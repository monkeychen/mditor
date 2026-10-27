import React, { useEffect, useRef } from 'react';
import {
  FilePlus,
  FolderPlus,
  Edit3,
  Trash2,
  ExternalLink,
  Copy,
  FolderX,
} from 'lucide-react';
import { getPlatformActionConfig } from '../utils/fileNameValidator';

export interface ContextMenuTarget {
  type: 'folder' | 'file';
  path: string;
  name: string;
  isWorkspaceRoot?: boolean;
}

export interface SidebarContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  target: ContextMenuTarget | null;
  platform?: 'darwin' | 'win32' | 'linux';
  onNewFile?: (target: ContextMenuTarget) => void;
  onNewFolder?: (target: ContextMenuTarget) => void;
  onRename?: (target: ContextMenuTarget) => void;
  onDelete?: (target: ContextMenuTarget) => void;
  onReveal?: (target: ContextMenuTarget) => void;
  onCopyPath?: (target: ContextMenuTarget) => void;
  onCopyRelativePath?: (target: ContextMenuTarget) => void;
  onRemoveWorkspaceFolder?: (folderPath: string) => void;
  onClose: () => void;
}

export const SidebarContextMenu: React.FC<SidebarContextMenuProps> = ({
  isOpen,
  position,
  target,
  platform = 'darwin',
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
  onReveal,
  onCopyPath,
  onCopyRelativePath,
  onRemoveWorkspaceFolder,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const config = getPlatformActionConfig(platform);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !target) return null;

  // 边界保护，防止菜单溢出可视区域
  const menuWidth = 210;
  const menuHeight = 220;
  const clampedX = typeof window !== 'undefined' ? Math.min(position.x, window.innerWidth - menuWidth - 10) : position.x;
  const clampedY = typeof window !== 'undefined' ? Math.min(position.y, window.innerHeight - menuHeight - 10) : position.y;

  return (
    <div
      ref={menuRef}
      style={{ top: `${clampedY}px`, left: `${clampedX}px` }}
      data-testid="sidebar-context-menu"
      className="fixed z-50 w-52 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-black/10 dark:border-stone-700 rounded-xl shadow-2xl py-1 text-xs text-stone-700 dark:text-stone-200 select-none animate-in fade-in duration-100"
    >
      {target.type === 'folder' ? (
        <>
          <div
            onClick={() => {
              onClose();
              onNewFile?.(target);
            }}
            className="px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer flex items-center justify-between transition"
          >
            <span className="flex items-center gap-2">
              <FilePlus className="w-3.5 h-3.5 text-stone-500" />
              <span>新建文件</span>
            </span>
            <span className="text-[10px] text-stone-400 font-mono">
              {platform === 'darwin' ? '⌘N' : 'Ctrl+N'}
            </span>
          </div>

          <div
            onClick={() => {
              onClose();
              onNewFolder?.(target);
            }}
            className="px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer flex items-center justify-between transition"
          >
            <span className="flex items-center gap-2">
              <FolderPlus className="w-3.5 h-3.5 text-stone-500" />
              <span>新建文件夹</span>
            </span>
          </div>

          <div className="h-px bg-black/5 dark:bg-white/10 my-1" />

          <div
            onClick={() => {
              onClose();
              onReveal?.(target);
            }}
            className="px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer flex items-center justify-between transition"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
              <span>{config.revealText}</span>
            </span>
            <span className="text-[10px] text-stone-400 font-mono">{config.revealShortcut}</span>
          </div>

          <div
            onClick={() => {
              onClose();
              onCopyPath?.(target);
            }}
            className="px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer flex items-center justify-between transition"
          >
            <span className="flex items-center gap-2">
              <Copy className="w-3.5 h-3.5 text-stone-500" />
              <span>复制路径</span>
            </span>
            <span className="text-[10px] text-stone-400 font-mono">{config.copyPathShortcut}</span>
          </div>

          {target.isWorkspaceRoot && (
            <>
              <div className="h-px bg-black/5 dark:bg-white/10 my-1" />
              <div
                onClick={() => {
                  onClose();
                  onRemoveWorkspaceFolder?.(target.path);
                }}
                className="px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 cursor-pointer flex items-center justify-between transition"
              >
                <span className="flex items-center gap-2">
                  <FolderX className="w-3.5 h-3.5 text-red-500" />
                  <span>从侧边栏移除</span>
                </span>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div
            onClick={() => {
              onClose();
              onRename?.(target);
            }}
            className="px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer flex items-center justify-between transition"
          >
            <span className="flex items-center gap-2">
              <Edit3 className="w-3.5 h-3.5 text-stone-500" />
              <span>重命名</span>
            </span>
            <span className="text-[10px] text-stone-400 font-mono">{config.renameShortcut}</span>
          </div>

          <div
            onClick={() => {
              onClose();
              onReveal?.(target);
            }}
            className="px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer flex items-center justify-between transition"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
              <span>{config.revealText}</span>
            </span>
            <span className="text-[10px] text-stone-400 font-mono">{config.revealShortcut}</span>
          </div>

          <div
            onClick={() => {
              onClose();
              onCopyPath?.(target);
            }}
            className="px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer flex items-center justify-between transition"
          >
            <span className="flex items-center gap-2">
              <Copy className="w-3.5 h-3.5 text-stone-500" />
              <span>复制绝对路径</span>
            </span>
            <span className="text-[10px] text-stone-400 font-mono">{config.copyPathShortcut}</span>
          </div>

          {onCopyRelativePath && (
            <div
              onClick={() => {
                onClose();
                onCopyRelativePath?.(target);
              }}
              className="px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer flex items-center justify-between transition"
            >
              <span className="flex items-center gap-2">
                <Copy className="w-3.5 h-3.5 text-stone-500" />
                <span>复制相对路径</span>
              </span>
            </div>
          )}

          <div className="h-px bg-black/5 dark:bg-white/10 my-1" />

          <div
            onClick={() => {
              onClose();
              onDelete?.(target);
            }}
            className="px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 cursor-pointer flex items-center justify-between transition"
          >
            <span className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span>{config.trashText}</span>
            </span>
            <span className="text-[10px] text-red-400 font-mono">{config.trashShortcut}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default SidebarContextMenu;
