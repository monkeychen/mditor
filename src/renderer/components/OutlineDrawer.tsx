import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  AlignLeft,
  ChevronRight,
  ChevronDown,
  Folder,
  FileText,
  FileCode,
  Database,
  FileJson,
  Terminal,
  FolderPlus,
  Plus,
  X,
  Search,
  Loader2,
} from 'lucide-react';
import type { OutlineItem } from '../utils/outline';
import type { FileTreeNode, WorkspaceFolder, WorkspaceSearchResult } from '../../types';
import { getLanguageInfo } from '../utils/languageClassifier';
import { validateFileName } from '../utils/fileNameValidator';
import { SidebarContextMenu, ContextMenuTarget } from './SidebarContextMenu';
import { searchWorkspace } from '../services/workspaceSearchService';

export type SidebarViewMode = 'files' | 'outline' | 'search';

export const SIDEBAR_WIDTH_STORAGE_KEY = 'mditor_sidebar_width';
export const DEFAULT_SIDEBAR_WIDTH = 240;
export const MIN_SIDEBAR_WIDTH = 180;
export const MAX_SIDEBAR_WIDTH = 520;

export interface OutlineDrawerProps {
  isOpen: boolean;
  outline: OutlineItem[];
  activeHeadingId?: string | null;
  onSelectHeading: (item: OutlineItem) => void;
  folders?: WorkspaceFolder[];
  fileTree?: FileTreeNode[];
  currentFolderPath?: string | null;
  activeFilePath?: string | null;
  platform?: 'darwin' | 'win32' | 'linux';
  onSelectFile?: (filePath: string) => void;
  onSelectSearchMatch?: (filePath: string, line: number) => void;
  onOpenFolder?: () => void;
  onAddFolder?: () => void;
  onRemoveFolder?: (folderPath: string) => void;
  onRenameItem?: (oldPath: string, newName: string) => Promise<void> | void;
  onDeleteItem?: (target: ContextMenuTarget) => Promise<void> | void;
  onCreateFile?: (parentDir: string, fileName: string) => Promise<void> | void;
  onCreateFolder?: (parentDir: string, folderName: string) => Promise<void> | void;
  onRevealInExplorer?: (filePath: string) => void;
  onCopyPath?: (filePath: string) => void;
  onMoveItem?: (sourcePath: string, targetDirPath: string) => Promise<boolean | void> | void;
  onValidationError?: (errorMessage: string) => void;
  defaultView?: SidebarViewMode;
  viewMode?: SidebarViewMode;
  onViewModeChange?: (mode: SidebarViewMode) => void;
  onClose?: () => void;
}

const renderFileIcon = (filePathOrName: string, isActive: boolean) => {
  const lang = getLanguageInfo(filePathOrName);
  const iconClass = `w-3.5 h-3.5 shrink-0 ${isActive ? 'opacity-100' : 'opacity-80'}`;

  switch (lang.iconType) {
    case 'markdown':
      return <FileText className={`${iconClass} text-amber-600`} />;
    case 'python':
      return <FileCode className={`${iconClass} text-amber-600`} />;
    case 'database':
      return <Database className={`${iconClass} text-emerald-600`} />;
    case 'data':
      return <FileJson className={`${iconClass} text-sky-600`} />;
    case 'shell':
      return <Terminal className={`${iconClass} text-stone-600`} />;
    case 'code':
      return <FileCode className={`${iconClass} text-indigo-600`} />;
    case 'text':
    default:
      return <FileText className={`${iconClass} text-stone-400`} />;
  }
};

const renderSearchLineHighlight = (line: string, start: number, end: number) => {
  if (start < 0 || end <= start || start >= line.length) {
    return <span>{line}</span>;
  }
  const before = line.slice(0, start);
  const matched = line.slice(start, end);
  const after = line.slice(end);

  return (
    <span>
      {before}
      <mark className="bg-amber-300 dark:bg-amber-600 text-stone-900 dark:text-stone-100 px-0.5 rounded font-medium">
        {matched}
      </mark>
      {after}
    </span>
  );
};

interface FileTreeItemProps {
  node: FileTreeNode;
  depth: number;
  activeFilePath?: string | null;
  onSelectFile?: (filePath: string) => void;
  onContextMenu: (e: React.MouseEvent, target: ContextMenuTarget) => void;
  editingPath: string | null;
  editName: string;
  onEditNameChange: (val: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  creatingParentPath: string | null;
  creatingType: 'file' | 'folder' | null;
  createName: string;
  onCreateNameChange: (val: string) => void;
  onCommitCreate: () => void;
  onCancelCreate: () => void;
  dragOverPath: string | null;
  onDragOverPathChange: (path: string | null) => void;
  onDropOnTargetDir: (e: React.DragEvent, targetDirPath: string) => void;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({
  node,
  depth,
  activeFilePath,
  onSelectFile,
  onContextMenu,
  editingPath,
  editName,
  onEditNameChange,
  onCommitRename,
  onCancelRename,
  creatingParentPath,
  creatingType,
  createName,
  onCreateNameChange,
  onCommitCreate,
  onCancelCreate,
  dragOverPath,
  onDragOverPathChange,
  onDropOnTargetDir,
}) => {
  const [expanded, setExpanded] = useState(true);
  const paddingLeft = 8 + depth * 14;

  if (node.isDirectory) {
    const isEditing = editingPath === node.path;
    const isCreatingHere = creatingParentPath === node.path;
    const isDropTarget = dragOverPath === node.path;

    return (
      <div>
        <div
          draggable={!isEditing}
          onDragStart={(e) => {
            e.stopPropagation();
            e.dataTransfer.setData(
              'application/json',
              JSON.stringify({
                path: node.path,
                isDirectory: true,
                name: node.name,
              })
            );
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDragOverPathChange(node.path);
          }}
          onDragLeave={(e) => {
            e.stopPropagation();
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              if (dragOverPath === node.path) {
                onDragOverPathChange(null);
              }
            }
          }}
          onDrop={(e) => onDropOnTargetDir(e, node.path)}
          onClick={() => setExpanded((prev) => !prev)}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onContextMenu(e, {
              type: 'folder',
              path: node.path,
              name: node.name,
              isWorkspaceRoot: false,
            });
          }}
          style={{ paddingLeft: `${paddingLeft}px` }}
          className={`file-tree-dir group py-1.5 pr-2 rounded-md cursor-pointer text-stone-700 font-medium flex items-center gap-1.5 transition ${
            isDropTarget
              ? 'bg-amber-500/15 border border-dashed border-amber-500/60 ring-1 ring-amber-500/30'
              : 'hover:bg-black/5'
          }`}
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          )}
          <Folder className="w-3.5 h-3.5 text-amber-600/80 shrink-0" />
          {isEditing ? (
            <input
              data-testid="sidebar-inline-rename-input"
              autoFocus
              value={editName}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onEditNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  onCommitRename();
                } else if (e.key === 'Escape') {
                  e.stopPropagation();
                  onCancelRename();
                }
              }}
              onBlur={onCommitRename}
              className="flex-1 min-w-0 bg-white dark:bg-stone-800 border border-amber-500 rounded px-1.5 py-0.5 text-xs text-stone-900 dark:text-stone-100 outline-none"
            />
          ) : (
            <span className="truncate flex-1">{node.name}</span>
          )}
        </div>
        {expanded && (
          <div>
            {isCreatingHere && (
              <div
                style={{ paddingLeft: `${paddingLeft + 14}px` }}
                className="py-1 pr-2 rounded-md flex items-center gap-1.5"
              >
                {creatingType === 'folder' ? (
                  <Folder className="w-3.5 h-3.5 text-amber-600/80 shrink-0" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                )}
                <input
                  data-testid="sidebar-inline-create-input"
                  autoFocus
                  value={createName}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => onCreateNameChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.stopPropagation();
                      onCommitCreate();
                    } else if (e.key === 'Escape') {
                      e.stopPropagation();
                      onCancelCreate();
                    }
                  }}
                  onBlur={onCommitCreate}
                  className="flex-1 min-w-0 bg-white dark:bg-stone-800 border border-amber-500 rounded px-1.5 py-0.5 text-xs text-stone-900 dark:text-stone-100 outline-none"
                />
              </div>
            )}
            {node.children?.map((child) => (
              <FileTreeItem
                key={child.path}
                node={child}
                depth={depth + 1}
                activeFilePath={activeFilePath}
                onSelectFile={onSelectFile}
                onContextMenu={onContextMenu}
                editingPath={editingPath}
                editName={editName}
                onEditNameChange={onEditNameChange}
                onCommitRename={onCommitRename}
                onCancelRename={onCancelRename}
                creatingParentPath={creatingParentPath}
                creatingType={creatingType}
                createName={createName}
                onCreateNameChange={onCreateNameChange}
                onCommitCreate={onCommitCreate}
                onCancelCreate={onCancelCreate}
                dragOverPath={dragOverPath}
                onDragOverPathChange={onDragOverPathChange}
                onDropOnTargetDir={onDropOnTargetDir}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isActive = activeFilePath === node.path;
  const isEditing = editingPath === node.path;

  return (
    <div
      draggable={!isEditing}
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.setData(
          'application/json',
          JSON.stringify({
            path: node.path,
            isDirectory: false,
            name: node.name,
          })
        );
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={() => {
        if (!isEditing) onSelectFile?.(node.path);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu(e, {
          type: 'file',
          path: node.path,
          name: node.name,
        });
      }}
      style={{ paddingLeft: `${paddingLeft + 14}px` }}
      data-testid={`file-tree-item-${node.name}`}
      className={`file-tree-item group py-1.5 pr-2 rounded-md cursor-pointer flex items-center gap-1.5 transition ${
        isActive
          ? 'bg-amber-500/15 text-amber-900 font-semibold'
          : 'text-stone-600 hover:bg-black/5 hover:text-stone-900'
      }`}
    >
      {renderFileIcon(node.name || node.path, isActive)}
      {isEditing ? (
        <input
          data-testid="sidebar-inline-rename-input"
          autoFocus
          value={editName}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onEditNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.stopPropagation();
              onCommitRename();
            } else if (e.key === 'Escape') {
              e.stopPropagation();
              onCancelRename();
            }
          }}
          onBlur={onCommitRename}
          className="flex-1 min-w-0 bg-white dark:bg-stone-800 border border-amber-500 rounded px-1.5 py-0.5 text-xs text-stone-900 dark:text-stone-100 outline-none"
        />
      ) : (
        <span className="truncate flex-1" title={node.path}>
          {node.name}
        </span>
      )}
    </div>
  );
};

export const OutlineDrawer: React.FC<OutlineDrawerProps> = ({
  isOpen,
  outline,
  activeHeadingId,
  onSelectHeading,
  folders,
  fileTree = [],
  currentFolderPath = null,
  activeFilePath = null,
  platform = 'darwin',
  onSelectFile,
  onOpenFolder,
  onAddFolder,
  onRemoveFolder,
  onRenameItem,
  onDeleteItem,
  onCreateFile,
  onCreateFolder,
  onRevealInExplorer,
  onCopyPath,
  onMoveItem,
  onValidationError,
  defaultView = 'outline',
  viewMode: controlledViewMode,
  onViewModeChange,
  onSelectSearchMatch,
}) => {
  const [internalViewMode, setInternalViewMode] = useState<SidebarViewMode>(defaultView);
  const viewMode = controlledViewMode ?? internalViewMode;
  const setViewMode = (mode: SidebarViewMode) => {
    setInternalViewMode(mode);
    onViewModeChange?.(mode);
  };

  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  // 全工作区搜索状态 (F32)
  const [searchQuery, setSearchQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<WorkspaceSearchResult[]>([]);
  const [collapsedFiles, setCollapsedFiles] = useState<Record<string, boolean>>({});

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    target: ContextMenuTarget | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    target: null,
  });

  // 侧边栏宽度持久化与拖拽状态 (F30)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= MIN_SIDEBAR_WIDTH && parsed <= MAX_SIDEBAR_WIDTH) {
          return parsed;
        }
      }
    }
    return DEFAULT_SIDEBAR_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const lastClickTimeRef = useRef<number>(0);

  const handleDoubleClickResize = () => {
    setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
    localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(DEFAULT_SIDEBAR_WIDTH));
  };

  const handlePointerDownResize = (e: React.PointerEvent | React.MouseEvent) => {
    const now = Date.now();
    if (now - lastClickTimeRef.current < 350) {
      handleDoubleClickResize();
      lastClickTimeRef.current = 0;
      return;
    }
    lastClickTimeRef.current = now;

    const startX = e.clientX ?? 0;
    let hasMoved = false;

    const onPointerMove = (moveEvent: MouseEvent | PointerEvent) => {
      const clientX = moveEvent.clientX ?? 0;
      if (!hasMoved && Math.abs(clientX - startX) < 2) {
        return;
      }
      hasMoved = true;
      setIsResizing(true);
      const newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, clientX));
      setSidebarWidth(newWidth);
    };

    const onPointerUp = (upEvent: MouseEvent | PointerEvent) => {
      if (hasMoved) {
        const clientX = upEvent.clientX ?? 0;
        const finalWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, clientX));
        setSidebarWidth(finalWidth);
        localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(finalWidth));
      }
      setIsResizing(false);
      window.removeEventListener('pointermove', onPointerMove as any);
      window.removeEventListener('mousemove', onPointerMove as any);
      window.removeEventListener('pointerup', onPointerUp as any);
      window.removeEventListener('mouseup', onPointerUp as any);
    };

    window.addEventListener('pointermove', onPointerMove as any);
    window.addEventListener('mousemove', onPointerMove as any);
    window.addEventListener('pointerup', onPointerUp as any);
    window.addEventListener('mouseup', onPointerUp as any);
  };

  // 内联重命名状态
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');

  // 内联新建文件/文件夹状态
  const [creatingParentPath, setCreatingParentPath] = useState<string | null>(null);
  const [creatingType, setCreatingType] = useState<'file' | 'folder' | null>(null);
  const [createName, setCreateName] = useState<string>('');

  // 侧边栏拖拽放置高亮状态 (F33)
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);

  const handleDropOnTargetDir = (e: React.DragEvent, targetDirPath: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPath(null);

    try {
      const raw = e.dataTransfer.getData('application/json');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || !data.path) return;

      const sourcePath: string = data.path;
      const isDir: boolean = !!data.isDirectory;

      // 1. 循环嵌套防范：若源为文件夹，目标不能是自身或其子目录
      if (isDir) {
        if (
          targetDirPath === sourcePath ||
          targetDirPath.startsWith(sourcePath + '/') ||
          targetDirPath.startsWith(sourcePath + '\\')
        ) {
          onValidationError?.('不能将文件夹移动到其自身或子文件夹中');
          return;
        }
      }

      // 2. 原地放置阻断：若目标目录等于源文件父目录，忽略
      const normalizedSource = sourcePath.replace(/\\/g, '/');
      const normalizedTarget = targetDirPath.replace(/\\/g, '/');
      const parentOfSource = normalizedSource.substring(0, normalizedSource.lastIndexOf('/'));
      if (parentOfSource === normalizedTarget) {
        return;
      }

      onMoveItem?.(sourcePath, targetDirPath);
    } catch (err) {
      console.error('Failed to parse drag drop data:', err);
    }
  };

  const handleAddFolderAction = onAddFolder ?? onOpenFolder;

  // 构造规范化的工作区多文件夹列表（支持向后兼容单个 fileTree 传入）
  const effectiveFolders: WorkspaceFolder[] = useMemo(() => {
    if (folders) return folders;
    if (currentFolderPath) {
      return [
        {
          id: currentFolderPath,
          name: currentFolderPath.split('/').pop() || currentFolderPath,
          path: currentFolderPath,
          tree: fileTree || [],
        },
      ];
    }
    if (fileTree && fileTree.length > 0) {
      return [
        {
          id: 'workspace',
          name: '当前工作区',
          path: 'workspace',
          tree: fileTree,
        },
      ];
    }
    return [];
  }, [folders, currentFolderPath, fileTree]);

  const folderPaths = useMemo(() => effectiveFolders.map((f) => f.path), [effectiveFolders]);
  const folderPathsKey = folderPaths.join(';');

  // 触发全工作区搜索 (F32)
  useEffect(() => {
    if (viewMode !== 'search' || !searchQuery.trim()) {
      setSearchResults((prev) => (prev.length > 0 ? [] : prev));
      setIsSearching(false);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchWorkspace({
        rootDirs: folderPaths,
        query: searchQuery,
        caseSensitive,
        wholeWord,
      });
      if (isMounted) {
        setSearchResults(results);
        setIsSearching(false);
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [viewMode, searchQuery, caseSensitive, wholeWord, folderPathsKey]);

  const toggleFolder = (folderPath: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  const handleContextMenu = (e: React.MouseEvent, target: ContextMenuTarget) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      target,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  };

  const handleStartCreating = (target: ContextMenuTarget, type: 'file' | 'folder') => {
    setCollapsedFolders((prev) => ({ ...prev, [target.path]: false }));
    setCreatingParentPath(target.path);
    setCreatingType(type);
    setCreateName(type === 'file' ? 'Untitled.md' : '新建文件夹');
  };

  const handleCommitCreate = () => {
    if (!creatingParentPath || !creatingType) return;
    const parent = creatingParentPath;
    const type = creatingType;
    const name = createName.trim();
    setCreatingParentPath(null);
    setCreatingType(null);
    if (!name) return;

    const validation = validateFileName(name);
    if (!validation.valid) {
      onValidationError?.(validation.error || '无效的名称');
      return;
    }

    if (type === 'file') {
      onCreateFile?.(parent, name);
    } else {
      onCreateFolder?.(parent, name);
    }
  };

  const handleCancelCreate = () => {
    setCreatingParentPath(null);
    setCreatingType(null);
    setCreateName('');
  };

  const handleStartRenaming = (target: ContextMenuTarget) => {
    setEditingPath(target.path);
    setEditName(target.name);
  };

  const handleCommitRename = () => {
    if (!editingPath) return;
    const currentPath = editingPath;
    const newName = editName.trim();
    setEditingPath(null);
    if (!newName) return;

    const validation = validateFileName(newName);
    if (!validation.valid) {
      onValidationError?.(validation.error || '无效的文件名');
      return;
    }

    onRenameItem?.(currentPath, newName);
  };

  const handleCancelRename = () => {
    setEditingPath(null);
    setEditName('');
  };

  const handleCopyPath = (target: ContextMenuTarget) => {
    if (onCopyPath) {
      onCopyPath(target.path);
    } else if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(target.path);
    }
  };

  const handleCopyRelativePath = (target: ContextMenuTarget) => {
    let relPath = target.name;
    for (const f of effectiveFolders) {
      if (target.path.startsWith(f.path)) {
        relPath = target.path.slice(f.path.length).replace(/^[/\\]/, '');
        break;
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(relPath);
    }
  };

  return (
    <aside
      data-testid="typora-sidebar"
      style={{ width: isOpen ? `${sidebarWidth}px` : 0 }}
      className={`drawer-transition shrink-0 border-r border-black/5 bg-[#FAF8F5]/95 flex flex-col overflow-hidden relative select-none ${
        isOpen ? 'w-60 opacity-100' : 'w-0 opacity-0 pointer-events-none'
      } ${isResizing ? 'select-none transition-none' : 'transition-all duration-200'}`}
    >
      {/* 侧边栏拖拽调宽把手 (F30) */}
      <div
        data-testid="sidebar-resize-handle"
        onPointerDown={handlePointerDownResize}
        onMouseDown={handlePointerDownResize}
        onDoubleClick={handleDoubleClickResize}
        className={`absolute top-0 right-0 w-1.5 h-full cursor-col-resize z-40 transition-colors ${
          isResizing ? 'bg-amber-500/50' : 'hover:bg-amber-500/30'
        }`}
        title="拖动调整宽度 (180~520px)，双击复位 240px"
      />
      {/* 顶部三视图切换栏 (文件夹 | 大纲 | 搜索) */}
      <div className="h-9 border-b border-black/5 grid grid-cols-3 text-xs font-medium shrink-0 bg-[#FAF8F5]">
        <button
          data-testid="sidebar-tab-files"
          onClick={() => setViewMode('files')}
          className={`flex items-center justify-center gap-1.5 transition border-b-2 ${
            viewMode === 'files'
              ? 'border-stone-800 text-stone-900 font-semibold'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <Folder className="w-3.5 h-3.5" />
          <span>文件夹</span>
        </button>
        <button
          data-testid="sidebar-tab-outline"
          onClick={() => setViewMode('outline')}
          className={`flex items-center justify-center gap-1.5 transition border-b-2 ${
            viewMode === 'outline'
              ? 'border-stone-800 text-stone-900 font-semibold'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <AlignLeft className="w-3.5 h-3.5" />
          <span>大纲</span>
        </button>
        <button
          data-testid="sidebar-tab-search"
          onClick={() => setViewMode('search')}
          className={`flex items-center justify-center gap-1.5 transition border-b-2 ${
            viewMode === 'search'
              ? 'border-stone-800 text-stone-900 font-semibold'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>搜索</span>
        </button>
      </div>

      {viewMode === 'search' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 搜索输入与条件设置 */}
          <div className="p-2 border-b border-black/5 space-y-2 shrink-0">
            <div className="relative">
              <input
                data-testid="workspace-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="全工作区全文检索..."
                className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:border-amber-600 rounded-md pl-7 pr-16 py-1 text-xs text-stone-800 dark:text-stone-100 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2 top-2" />
              <div className="absolute right-1.5 top-1 flex items-center space-x-0.5">
                <button
                  type="button"
                  data-testid="search-case-sensitive-toggle"
                  onClick={() => setCaseSensitive((prev) => !prev)}
                  title="区分大小写 (Aa)"
                  className={`p-0.5 rounded text-[10px] font-mono transition ${
                    caseSensitive
                      ? 'bg-amber-500/20 text-amber-800 font-bold'
                      : 'text-stone-400 hover:text-stone-700'
                  }`}
                >
                  Aa
                </button>
                <button
                  type="button"
                  data-testid="search-whole-word-toggle"
                  onClick={() => setWholeWord((prev) => !prev)}
                  title="全词匹配 (\b)"
                  className={`p-0.5 rounded text-[10px] font-mono transition ${
                    wholeWord
                      ? 'bg-amber-500/20 text-amber-800 font-bold'
                      : 'text-stone-400 hover:text-stone-700'
                  }`}
                >
                  \b
                </button>
                {searchQuery && (
                  <button
                    type="button"
                    data-testid="search-clear-btn"
                    onClick={() => setSearchQuery('')}
                    title="清空"
                    className="p-0.5 text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-500 px-1">
              <span data-testid="workspace-search-stats">
                {isSearching
                  ? '正在检索工作区文件...'
                  : !searchQuery.trim()
                  ? '输入关键词检索全工作区'
                  : searchResults.length === 0
                  ? '未找到匹配结果'
                  : `找到 ${searchResults.reduce((acc, r) => acc + r.matches.length, 0)} 处匹配，分布在 ${searchResults.length} 个文件`}
              </span>
            </div>
          </div>

          {/* 搜索结果列表 */}
          <div
            data-testid="workspace-search-results"
            className="flex-1 overflow-y-auto p-2 space-y-2 text-xs"
          >
            {isSearching && (
              <div className="flex items-center justify-center py-8 text-stone-400 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                <span>检索中...</span>
              </div>
            )}

            {!isSearching &&
              searchResults.map((result, fileIdx) => {
                const isCollapsed = !!collapsedFiles[result.filePath];

                return (
                  <div
                    key={result.filePath}
                    data-testid={`search-file-group-${fileIdx}`}
                    className="space-y-1"
                  >
                    <div
                      onClick={() =>
                        setCollapsedFiles((prev) => ({
                          ...prev,
                          [result.filePath]: !prev[result.filePath],
                        }))
                      }
                      className="flex items-center justify-between font-semibold text-stone-800 dark:text-stone-200 px-1 hover:bg-black/5 dark:hover:bg-white/5 rounded cursor-pointer py-0.5 select-none transition"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        )}
                        {renderFileIcon(result.fileName, false)}
                        <span className="truncate text-xs">{result.fileName}</span>
                        {result.relativePath !== result.fileName && (
                          <span className="text-[10px] text-stone-400 font-normal truncate">
                            {result.relativePath}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono bg-stone-200/70 dark:bg-stone-700 text-stone-600 dark:text-stone-300 px-1.5 rounded-full shrink-0">
                        {result.matches.length}
                      </span>
                    </div>

                    {!isCollapsed && (
                      <div className="pl-4 space-y-1">
                        {result.matches.map((match, matchIdx) => (
                          <div
                            key={`${match.line}-${matchIdx}`}
                            data-testid={`search-match-item-${fileIdx}-${matchIdx}`}
                            onClick={() => {
                              if (onSelectSearchMatch) {
                                onSelectSearchMatch(result.filePath, match.line);
                              } else {
                                onSelectFile?.(result.filePath);
                              }
                            }}
                            className="p-1 rounded hover:bg-amber-500/10 dark:hover:bg-amber-500/20 cursor-pointer border border-transparent hover:border-amber-500/20 group transition"
                          >
                            <div className="flex items-baseline gap-2">
                              <span className="font-mono text-[10px] text-stone-400 group-hover:text-amber-700 dark:group-hover:text-amber-400 shrink-0">
                                行 {match.line}
                              </span>
                              <p className="text-stone-600 dark:text-stone-300 text-[11px] line-clamp-2 break-all">
                                {renderSearchLineHighlight(
                                  match.lineContent,
                                  match.matchStart,
                                  match.matchEnd
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      ) : viewMode === 'outline' ? (
        <>
          <div className="h-7 px-3 border-b border-black/5 flex items-center justify-between text-[11px] text-stone-400 shrink-0">
            <span>文档大纲</span>
            <span className="font-mono">{outline.length} 个小节</span>
          </div>

          <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs">
            {outline.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-xs">
                暂无标题，输入 # 即可生成大纲
              </div>
            ) : (
              outline.map((item) => {
                const isActive = activeHeadingId === item.id;
                const indentClass =
                  item.level === 1
                    ? 'pl-2 font-medium text-stone-800'
                    : item.level === 2
                    ? 'pl-5 text-stone-600'
                    : item.level === 3
                    ? 'pl-8 text-stone-500'
                    : 'pl-10 text-stone-400';

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectHeading(item)}
                    className={`outline-item group p-1.5 rounded-md cursor-pointer transition flex items-center space-x-1.5 ${indentClass} ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-900 font-semibold'
                        : 'hover:bg-black/5 hover:text-stone-900'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-mono shrink-0 ${
                        isActive ? 'text-amber-600 font-bold' : 'text-stone-300 group-hover:text-stone-500'
                      }`}
                    >
                      H{item.level}
                    </span>
                    <span className="truncate flex-1">{item.text}</span>
                    <ChevronRight className="w-3 h-3 text-stone-300 opacity-0 group-hover:opacity-100 transition shrink-0" />
                  </div>
                );
              })
            )}
          </nav>
        </>
      ) : (
        <>
          <div className="h-7 px-3 border-b border-black/5 flex items-center justify-between text-[11px] text-stone-400 shrink-0">
            <span className="truncate font-medium text-stone-600">
              工作区文件夹 {effectiveFolders.length > 0 ? `(${effectiveFolders.length})` : ''}
            </span>
            {handleAddFolderAction && (
              <button
                onClick={handleAddFolderAction}
                title="添加文件夹到工作区"
                data-testid="sidebar-add-folder-btn"
                className="hover:text-stone-800 flex items-center gap-1 transition p-0.5 rounded hover:bg-black/5"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-600" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2 text-xs">
            {effectiveFolders.length === 0 ? (
              <div className="text-center py-8 px-3 space-y-3">
                <div className="text-stone-400 text-xs">尚未添加工作区文件夹</div>
                {handleAddFolderAction && (
                  <button
                    data-testid="sidebar-empty-add-folder-btn"
                    onClick={handleAddFolderAction}
                    className="px-3 py-1.5 bg-white border border-black/10 rounded-lg text-xs font-medium text-stone-700 hover:bg-stone-50 shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-amber-600" />
                    <span>添加文件夹...</span>
                  </button>
                )}
              </div>
            ) : (
              effectiveFolders.map((folder, folderIdx) => {
                const isCollapsed = !!collapsedFolders[folder.path];
                const isCreatingInRoot = creatingParentPath === folder.path;

                return (
                  <div
                    key={folder.path || folderIdx}
                    data-testid={`workspace-folder-${folderIdx}`}
                    className="workspace-folder-item"
                  >
                    {/* 文件夹分组标题行 */}
                    <div
                      onClick={() => toggleFolder(folder.path)}
                      onContextMenu={(e) =>
                        handleContextMenu(e, {
                          type: 'folder',
                          path: folder.path,
                          name: folder.name,
                          isWorkspaceRoot: true,
                        })
                      }
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverPath(folder.path);
                      }}
                      onDragLeave={(e) => {
                        e.stopPropagation();
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                          if (dragOverPath === folder.path) {
                            setDragOverPath(null);
                          }
                        }
                      }}
                      onDrop={(e) => handleDropOnTargetDir(e, folder.path)}
                      className={`folder-header group flex items-center justify-between py-1 px-1.5 rounded-md text-stone-700 cursor-pointer select-none transition ${
                        dragOverPath === folder.path
                          ? 'bg-amber-500/15 border border-dashed border-amber-500/60 ring-1 ring-amber-500/30'
                          : 'hover:bg-black/5'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        )}
                        <Folder className="w-3.5 h-3.5 text-amber-600/90 shrink-0" />
                        <span className="truncate font-semibold text-xs" title={folder.path}>
                          {folder.name}
                        </span>
                      </div>

                      {onRemoveFolder && (
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition shrink-0 ml-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveFolder(folder.path);
                            }}
                            title={`从侧边栏移除 "${folder.name}" (不删除本地文件)`}
                            data-testid={`remove-folder-btn-${folderIdx}`}
                            className="p-0.5 rounded hover:bg-black/10 text-stone-400 hover:text-red-500 transition cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 展开时渲染该文件夹的 Markdown 目录树 */}
                    {!isCollapsed && (
                      <div className="pl-1">
                        {isCreatingInRoot && (
                          <div
                            style={{ paddingLeft: '22px' }}
                            className="py-1 pr-2 rounded-md flex items-center gap-1.5"
                          >
                            {creatingType === 'folder' ? (
                              <Folder className="w-3.5 h-3.5 text-amber-600/80 shrink-0" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            )}
                            <input
                              data-testid="sidebar-inline-create-input"
                              autoFocus
                              value={createName}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setCreateName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.stopPropagation();
                                  handleCommitCreate();
                                } else if (e.key === 'Escape') {
                                  e.stopPropagation();
                                  handleCancelCreate();
                                }
                              }}
                              onBlur={handleCommitCreate}
                              className="flex-1 min-w-0 bg-white dark:bg-stone-800 border border-amber-500 rounded px-1.5 py-0.5 text-xs text-stone-900 dark:text-stone-100 outline-none"
                            />
                          </div>
                        )}
                        {folder.tree.length === 0 && !isCreatingInRoot ? (
                          <div className="text-[11px] text-stone-400 pl-6 py-1 italic">
                            无 Markdown 文档
                          </div>
                        ) : (
                          folder.tree.map((node) => (
                            <FileTreeItem
                              key={node.path}
                              node={node}
                              depth={0}
                              activeFilePath={activeFilePath}
                              onSelectFile={onSelectFile}
                              onContextMenu={handleContextMenu}
                              editingPath={editingPath}
                              editName={editName}
                              onEditNameChange={setEditName}
                              onCommitRename={handleCommitRename}
                              onCancelRename={handleCancelRename}
                              creatingParentPath={creatingParentPath}
                              creatingType={creatingType}
                              createName={createName}
                              onCreateNameChange={setCreateName}
                              onCommitCreate={handleCommitCreate}
                              onCancelCreate={handleCancelCreate}
                              dragOverPath={dragOverPath}
                              onDragOverPathChange={setDragOverPath}
                              onDropOnTargetDir={handleDropOnTargetDir}
                            />
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* 当已有文件夹时，底部提供虚线添加按钮 */}
            {effectiveFolders.length > 0 && handleAddFolderAction && (
              <div className="pt-2 px-1">
                <button
                  onClick={handleAddFolderAction}
                  data-testid="sidebar-footer-add-folder-btn"
                  className="w-full py-1.5 px-2 border border-dashed border-stone-300 hover:border-amber-500/60 rounded-md text-[11px] text-stone-500 hover:text-amber-900 hover:bg-amber-50/50 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-stone-400" />
                  <span>添加文件夹...</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* 右键上下文菜单 */}
      <SidebarContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        target={contextMenu.target}
        platform={platform}
        onNewFile={(target) => handleStartCreating(target, 'file')}
        onNewFolder={(target) => handleStartCreating(target, 'folder')}
        onRename={handleStartRenaming}
        onDelete={(target) => onDeleteItem?.(target)}
        onReveal={(target) => onRevealInExplorer?.(target.path)}
        onCopyPath={handleCopyPath}
        onCopyRelativePath={handleCopyRelativePath}
        onRemoveWorkspaceFolder={(folderPath) => onRemoveFolder?.(folderPath)}
        onClose={handleCloseContextMenu}
      />
    </aside>
  );
};

export default OutlineDrawer;
