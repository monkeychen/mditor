import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SidebarContextMenu, ContextMenuTarget } from '../../src/renderer/components/SidebarContextMenu';

describe('SidebarContextMenu Component (T406 / AC-28.1 ~ AC-28.3)', () => {
  const folderTarget: ContextMenuTarget = {
    type: 'folder',
    path: '/Users/test/workspace/project',
    name: 'project',
    isWorkspaceRoot: true,
  };

  const fileTarget: ContextMenuTarget = {
    type: 'file',
    path: '/Users/test/workspace/project/README.md',
    name: 'README.md',
  };

  it('renders folder context menu with platform-specific labels (macOS)', () => {
    const onNewFile = vi.fn();
    const onReveal = vi.fn();
    const onRemoveWorkspaceFolder = vi.fn();
    const onClose = vi.fn();

    render(
      <SidebarContextMenu
        isOpen={true}
        position={{ x: 100, y: 100 }}
        target={folderTarget}
        platform="darwin"
        onNewFile={onNewFile}
        onReveal={onReveal}
        onRemoveWorkspaceFolder={onRemoveWorkspaceFolder}
        onClose={onClose}
      />
    );

    // 检查新建文件与新建文件夹选项
    expect(screen.getByText('新建文件')).toBeInTheDocument();
    expect(screen.getByText('新建文件夹')).toBeInTheDocument();

    // 检查 macOS 原生文案「在访达中显示」
    const revealItem = screen.getByText('在访达中显示');
    expect(revealItem).toBeInTheDocument();
    fireEvent.click(revealItem);
    expect(onReveal).toHaveBeenCalledWith(folderTarget);

    // 检查工作区根目录的「从侧边栏移除」
    const removeItem = screen.getByText('从侧边栏移除');
    expect(removeItem).toBeInTheDocument();
    fireEvent.click(removeItem);
    expect(onRemoveWorkspaceFolder).toHaveBeenCalledWith(folderTarget.path);
  });

  it('renders file context menu with Windows specific labels (win32)', () => {
    const onRename = vi.fn();
    const onDelete = vi.fn();
    const onReveal = vi.fn();
    const onClose = vi.fn();

    render(
      <SidebarContextMenu
        isOpen={true}
        position={{ x: 150, y: 150 }}
        target={fileTarget}
        platform="win32"
        onRename={onRename}
        onDelete={onDelete}
        onReveal={onReveal}
        onClose={onClose}
      />
    );

    // 检查重命名
    const renameItem = screen.getByText('重命名');
    expect(renameItem).toBeInTheDocument();
    expect(screen.getByText('F2')).toBeInTheDocument();
    fireEvent.click(renameItem);
    expect(onRename).toHaveBeenCalledWith(fileTarget);

    // 检查 Windows 原生文案「在文件资源管理器中显示」
    expect(screen.getByText('在文件资源管理器中显示')).toBeInTheDocument();

    // 检查 Windows 回收站文案「移到回收站」
    const trashItem = screen.getByText('移到回收站');
    expect(trashItem).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    fireEvent.click(trashItem);
    expect(onDelete).toHaveBeenCalledWith(fileTarget);
  });

  it('closes on Escape or outside click', () => {
    const onClose = vi.fn();

    render(
      <SidebarContextMenu
        isOpen={true}
        position={{ x: 200, y: 200 }}
        target={fileTarget}
        onClose={onClose}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
