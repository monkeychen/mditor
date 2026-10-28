import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuickOpenModal from '../../src/renderer/components/QuickOpenModal';
import type { WorkspaceFileItem } from '../../src/renderer/utils/fuzzySearch';

describe('Quick Open Modal Component (T503 / F31 / AC-31.1 ~ AC-31.4)', () => {
  const mockFiles: WorkspaceFileItem[] = [
    {
      name: '01-产品规划.md',
      path: '/workspace/docs/prd/01-产品规划.md',
      relativePath: 'docs/prd/01-产品规划.md',
      folderName: 'mditor-notes',
      isDirectory: false,
    },
    {
      name: 'fuzzySearch.ts',
      path: '/workspace/src/renderer/utils/fuzzySearch.ts',
      relativePath: 'src/renderer/utils/fuzzySearch.ts',
      folderName: 'mditor',
      isDirectory: false,
    },
    {
      name: 'searchService.ts',
      path: '/workspace/src/main/searchService.ts',
      relativePath: 'src/main/searchService.ts',
      folderName: 'mditor',
      isDirectory: false,
    },
    {
      name: 'README.md',
      path: '/workspace/README.md',
      relativePath: 'README.md',
      folderName: 'mditor',
      isDirectory: false,
    },
  ];

  it('renders nothing when isOpen is false', () => {
    render(
      <QuickOpenModal
        isOpen={false}
        files={mockFiles}
        onOpenFile={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByTestId('quick-open-modal')).toBeNull();
  });

  it('renders input and all files when isOpen is true with empty query', () => {
    render(
      <QuickOpenModal
        isOpen={true}
        files={mockFiles}
        onOpenFile={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('quick-open-modal')).toBeInTheDocument();
    expect(screen.getByTestId('quick-open-input')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(4);
    expect(screen.getByText('01-产品规划.md')).toBeInTheDocument();
    expect(screen.getByText('fuzzySearch.ts')).toBeInTheDocument();
  });

  it('filters results in real-time when typing query', () => {
    render(
      <QuickOpenModal
        isOpen={true}
        files={mockFiles}
        onOpenFile={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const input = screen.getByTestId('quick-open-input');
    fireEvent.change(input, { target: { value: 'search' } });

    // Should match fuzzySearch.ts and searchService.ts
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options.some((opt) => opt.textContent?.includes('fuzzySearch.ts'))).toBe(true);
    expect(options.some((opt) => opt.textContent?.includes('searchService.ts'))).toBe(true);
  });

  it('supports ArrowDown, ArrowUp and Enter keyboard navigation', () => {
    const handleOpenFile = vi.fn();
    const handleClose = vi.fn();

    render(
      <QuickOpenModal
        isOpen={true}
        files={mockFiles}
        onOpenFile={handleOpenFile}
        onClose={handleClose}
      />
    );

    const input = screen.getByTestId('quick-open-input');

    // Default active item is index 0 ('01-产品规划.md')
    // Press ArrowDown to select index 1 ('fuzzySearch.ts')
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    // Press Enter to activate
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(handleOpenFile).toHaveBeenCalledWith('/workspace/src/renderer/utils/fuzzySearch.ts');
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape key press or backdrop click', () => {
    const handleClose = vi.fn();
    render(
      <QuickOpenModal
        isOpen={true}
        files={mockFiles}
        onOpenFile={vi.fn()}
        onClose={handleClose}
      />
    );

    const input = screen.getByTestId('quick-open-input');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);

    const backdrop = screen.getByTestId('quick-open-overlay');
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('calls onOpenFile when clicking directly on an item', () => {
    const handleOpenFile = vi.fn();
    const handleClose = vi.fn();

    render(
      <QuickOpenModal
        isOpen={true}
        files={mockFiles}
        onOpenFile={handleOpenFile}
        onClose={handleClose}
      />
    );

    fireEvent.click(screen.getByText('README.md'));
    expect(handleOpenFile).toHaveBeenCalledWith('/workspace/README.md');
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
