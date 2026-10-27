import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OutlineDrawer } from '../../src/renderer/components/OutlineDrawer';
import type { WorkspaceFolder } from '../../src/types';

describe('OutlineDrawer Context Actions & Inline Operations (T407 / AC-28.1 ~ AC-28.2)', () => {
  const mockFolder: WorkspaceFolder = {
    id: '/workspace/project',
    name: 'project',
    path: '/workspace/project',
    tree: [
      {
        name: 'README.md',
        path: '/workspace/project/README.md',
        isDirectory: false,
      },
      {
        name: 'src',
        path: '/workspace/project/src',
        isDirectory: true,
        children: [
          {
            name: 'index.ts',
            path: '/workspace/project/src/index.ts',
            isDirectory: false,
          },
        ],
      },
    ],
  };

  it('opens context menu on right click on file and triggers rename mode', async () => {
    const onRenameItem = vi.fn();

    render(
      <OutlineDrawer
        isOpen={true}
        outline={[]}
        defaultView="files"
        folders={[mockFolder]}
        onSelectHeading={vi.fn()}
        onRenameItem={onRenameItem}
      />
    );

    // 找到 README.md 文件项并右键点击
    const fileItem = screen.getByTestId('file-tree-item-README.md');
    expect(fileItem).toBeInTheDocument();

    fireEvent.contextMenu(fileItem, { clientX: 200, clientY: 300 });

    // 验证右键菜单弹出
    const renameOption = await screen.findByText('重命名');
    expect(renameOption).toBeInTheDocument();

    // 点击重命名选项进入内联编辑
    fireEvent.click(renameOption);

    // 应该出现内联 input
    const input = screen.getByDisplayValue('README.md');
    expect(input).toBeInTheDocument();

    // 输入新文件名并回车
    fireEvent.change(input, { target: { value: 'GUIDE.md' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(onRenameItem).toHaveBeenCalledWith('/workspace/project/README.md', 'GUIDE.md');
    });
  });

  it('triggers delete action when clicking move to trash in context menu', async () => {
    const onDeleteItem = vi.fn();

    render(
      <OutlineDrawer
        isOpen={true}
        outline={[]}
        defaultView="files"
        folders={[mockFolder]}
        onSelectHeading={vi.fn()}
        onDeleteItem={onDeleteItem}
      />
    );

    const fileItem = screen.getByTestId('file-tree-item-README.md');
    fireEvent.contextMenu(fileItem, { clientX: 200, clientY: 300 });

    const deleteOption = await screen.findByText(/移到/);
    expect(deleteOption).toBeInTheDocument();

    fireEvent.click(deleteOption);

    await waitFor(() => {
      expect(onDeleteItem).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/workspace/project/README.md',
          name: 'README.md',
        })
      );
    });
  });

  it('triggers new file inline creation on folder context menu', async () => {
    const onCreateFile = vi.fn();

    render(
      <OutlineDrawer
        isOpen={true}
        outline={[]}
        defaultView="files"
        folders={[mockFolder]}
        onSelectHeading={vi.fn()}
        onCreateFile={onCreateFile}
      />
    );

    const folderRoot = screen.getByText('project');
    fireEvent.contextMenu(folderRoot, { clientX: 150, clientY: 200 });

    const newFileOption = await screen.findByText('新建文件');
    expect(newFileOption).toBeInTheDocument();

    fireEvent.click(newFileOption);

    // 出现新建文件输入框
    const createInput = screen.getByDisplayValue('Untitled.md');
    expect(createInput).toBeInTheDocument();

    fireEvent.change(createInput, { target: { value: 'new_doc.md' } });
    fireEvent.keyDown(createInput, { key: 'Enter' });

    await waitFor(() => {
      expect(onCreateFile).toHaveBeenCalledWith('/workspace/project', 'new_doc.md');
    });
  });
});
