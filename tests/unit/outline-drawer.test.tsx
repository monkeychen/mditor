import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OutlineDrawer from '../../src/renderer/components/OutlineDrawer';
import type { OutlineItem } from '../../src/renderer/utils/outline';
import type { FileTreeNode } from '../../src/types';

describe('Sidebar Dual-View (Files + Outline) Component (T303 / AC-15.1 ~ AC-15.4)', () => {
  const mockOutline: OutlineItem[] = [
    { id: '1', level: 1, text: 'Title 1', line: 1, from: 0 },
    { id: '2', level: 2, text: 'Subtitle 2', line: 5, from: 40 },
  ];

  const mockFileTree: FileTreeNode[] = [
    {
      name: 'docs',
      path: '/workspace/docs',
      isDirectory: true,
      children: [
        { name: 'guide.md', path: '/workspace/docs/guide.md', isDirectory: false },
      ],
    },
    { name: 'README.md', path: '/workspace/README.md', isDirectory: false },
  ];

  it('renders outline items when open in outline view', () => {
    const handleSelect = vi.fn();
    render(
      <OutlineDrawer
        isOpen={true}
        outline={mockOutline}
        onSelectHeading={handleSelect}
      />
    );

    expect(screen.getByText('Title 1')).toBeInTheDocument();
    expect(screen.getByText('Subtitle 2')).toBeInTheDocument();
    expect(screen.getByText('2 个小节')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Subtitle 2'));
    expect(handleSelect).toHaveBeenCalledWith(mockOutline[1]);
  });

  it('switches to Files view and triggers onSelectFile when clicking a markdown file', () => {
    const handleSelectFile = vi.fn();
    render(
      <OutlineDrawer
        isOpen={true}
        outline={mockOutline}
        fileTree={mockFileTree}
        currentFolderPath="/workspace"
        activeFilePath="/workspace/README.md"
        onSelectHeading={vi.fn()}
        onSelectFile={handleSelectFile}
      />
    );

    // 点击顶部「文件」Tab 切换到文件树视图
    const filesTab = screen.getByTestId('sidebar-tab-files');
    fireEvent.click(filesTab);

    expect(screen.getByText('README.md')).toBeInTheDocument();
    expect(screen.getByText('guide.md')).toBeInTheDocument();

    fireEvent.click(screen.getByText('guide.md'));
    expect(handleSelectFile).toHaveBeenCalledWith('/workspace/docs/guide.md');
  });

  it('hides drawer when isOpen is false', () => {
    const { container } = render(
      <OutlineDrawer
        isOpen={false}
        outline={mockOutline}
        onSelectHeading={vi.fn()}
      />
    );

    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('w-0');
  });
});
