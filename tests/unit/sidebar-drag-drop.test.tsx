import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OutlineDrawer from '../../src/renderer/components/OutlineDrawer';
import type { WorkspaceFolder } from '../../src/types';

describe('Sidebar File Tree Drag & Drop (T507 / F33 / AC-33.1 ~ AC-33.4)', () => {
  const mockFolder: WorkspaceFolder = {
    id: '/workspace',
    name: 'workspace',
    path: '/workspace',
    tree: [
      {
        name: 'notes.md',
        path: '/workspace/notes.md',
        isDirectory: false,
      },
      {
        name: 'docs',
        path: '/workspace/docs',
        isDirectory: true,
        children: [
          {
            name: 'nested.md',
            path: '/workspace/docs/nested.md',
            isDirectory: false,
          },
          {
            name: 'subdocs',
            path: '/workspace/docs/subdocs',
            isDirectory: true,
            children: [],
          },
        ],
      },
    ],
  };

  it('renders file and directory items with draggable attribute', () => {
    render(
      <OutlineDrawer
        isOpen={true}
        outline={[]}
        onSelectHeading={vi.fn()}
        folders={[mockFolder]}
        viewMode="files"
      />
    );

    const fileItem = screen.getByTestId('file-tree-item-notes.md');
    expect(fileItem.getAttribute('draggable')).toBe('true');

    const dirItem = screen.getByText('docs').closest('.file-tree-dir');
    expect(dirItem).not.toBeNull();
    expect(dirItem?.getAttribute('draggable')).toBe('true');
  });

  it('sets dataTransfer on dragStart for file item', () => {
    render(
      <OutlineDrawer
        isOpen={true}
        outline={[]}
        onSelectHeading={vi.fn()}
        folders={[mockFolder]}
        viewMode="files"
      />
    );

    const fileItem = screen.getByTestId('file-tree-item-notes.md');
    const setDataMock = vi.fn();

    fireEvent.dragStart(fileItem, {
      dataTransfer: {
        setData: setDataMock,
        effectAllowed: '',
      },
    });

    expect(setDataMock).toHaveBeenCalledWith(
      'application/json',
      JSON.stringify({
        path: '/workspace/notes.md',
        isDirectory: false,
        name: 'notes.md',
      })
    );
  });

  it('calls onMoveItem when dropping a file onto a folder', () => {
    const onMoveItem = vi.fn();
    render(
      <OutlineDrawer
        isOpen={true}
        outline={[]}
        onSelectHeading={vi.fn()}
        folders={[mockFolder]}
        viewMode="files"
        onMoveItem={onMoveItem}
      />
    );

    const targetDir = screen.getByText('docs').closest('.file-tree-dir')!;

    // Simulate drag over
    fireEvent.dragOver(targetDir, {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {},
    });

    // Simulate drop
    fireEvent.drop(targetDir, {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        getData: (type: string) =>
          type === 'application/json'
            ? JSON.stringify({
                path: '/workspace/notes.md',
                isDirectory: false,
                name: 'notes.md',
              })
            : '',
      },
    });

    expect(onMoveItem).toHaveBeenCalledWith('/workspace/notes.md', '/workspace/docs');
  });

  it('prevents dropping a folder into itself or its own subfolder', () => {
    const onMoveItem = vi.fn();
    const onValidationError = vi.fn();

    render(
      <OutlineDrawer
        isOpen={true}
        outline={[]}
        onSelectHeading={vi.fn()}
        folders={[mockFolder]}
        viewMode="files"
        onMoveItem={onMoveItem}
        onValidationError={onValidationError}
      />
    );

    const subDocsDir = screen.getByText('subdocs').closest('.file-tree-dir')!;

    // Try to drop /workspace/docs into /workspace/docs/subdocs
    fireEvent.drop(subDocsDir, {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        getData: () =>
          JSON.stringify({
            path: '/workspace/docs',
            isDirectory: true,
            name: 'docs',
          }),
      },
    });

    expect(onMoveItem).not.toHaveBeenCalled();
    expect(onValidationError).toHaveBeenCalledWith(expect.stringContaining('不能将文件夹移动到其自身或子文件夹中'));
  });

  it('ignores in-place drops where target is current parent', () => {
    const onMoveItem = vi.fn();
    render(
      <OutlineDrawer
        isOpen={true}
        outline={[]}
        onSelectHeading={vi.fn()}
        folders={[mockFolder]}
        viewMode="files"
        onMoveItem={onMoveItem}
      />
    );

    // Header of root folder '/workspace'
    const rootHeader = screen.getByText('workspace').closest('.folder-header')!;

    // Try to drop /workspace/notes.md into /workspace
    fireEvent.drop(rootHeader, {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        getData: () =>
          JSON.stringify({
            path: '/workspace/notes.md',
            isDirectory: false,
            name: 'notes.md',
          }),
      },
    });

    expect(onMoveItem).not.toHaveBeenCalled();
  });
});
