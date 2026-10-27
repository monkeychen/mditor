import React, { useState } from 'react';
import { AlignLeft, ChevronRight, ChevronDown, Folder, FileText, FolderPlus, Plus, X } from 'lucide-react';
import type { OutlineItem } from '../utils/outline';
import type { FileTreeNode, WorkspaceFolder } from '../../types';

export type SidebarViewMode = 'files' | 'outline';

export interface OutlineDrawerProps {
  isOpen: boolean;
  outline: OutlineItem[];
  activeHeadingId?: string | null;
  onSelectHeading: (item: OutlineItem) => void;
  folders?: WorkspaceFolder[];
  fileTree?: FileTreeNode[];
  currentFolderPath?: string | null;
  activeFilePath?: string | null;
  onSelectFile?: (filePath: string) => void;
  onOpenFolder?: () => void;
  onAddFolder?: () => void;
  onRemoveFolder?: (folderPath: string) => void;
  defaultView?: SidebarViewMode;
  onClose?: () => void;
}

const FileTreeItem: React.FC<{
  node: FileTreeNode;
  depth: number;
  activeFilePath?: string | null;
  onSelectFile?: (filePath: string) => void;
}> = ({ node, depth, activeFilePath, onSelectFile }) => {
  const [expanded, setExpanded] = useState(true);
  const paddingLeft = 8 + depth * 14;

  if (node.isDirectory) {
    return (
      <div>
        <div
          onClick={() => setExpanded((prev) => !prev)}
          style={{ paddingLeft: `${paddingLeft}px` }}
          className="file-tree-dir group py-1.5 pr-2 rounded-md cursor-pointer hover:bg-black/5 text-stone-700 font-medium flex items-center gap-1.5 transition"
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          )}
          <Folder className="w-3.5 h-3.5 text-amber-600/80 shrink-0" />
          <span className="truncate flex-1">{node.name}</span>
        </div>
        {expanded &&
          node.children?.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              activeFilePath={activeFilePath}
              onSelectFile={onSelectFile}
            />
          ))}
      </div>
    );
  }

  const isActive = activeFilePath === node.path;

  return (
    <div
      onClick={() => onSelectFile?.(node.path)}
      style={{ paddingLeft: `${paddingLeft + 14}px` }}
      className={`file-tree-item group py-1.5 pr-2 rounded-md cursor-pointer flex items-center gap-1.5 transition ${
        isActive
          ? 'bg-amber-500/15 text-amber-900 font-semibold'
          : 'text-stone-600 hover:bg-black/5 hover:text-stone-900'
      }`}
    >
      <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-600' : 'text-stone-400'}`} />
      <span className="truncate flex-1" title={node.path}>
        {node.name}
      </span>
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
  onSelectFile,
  onOpenFolder,
  onAddFolder,
  onRemoveFolder,
  defaultView = 'outline',
}) => {
  const [viewMode, setViewMode] = useState<SidebarViewMode>(defaultView);
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  const handleAddFolderAction = onAddFolder ?? onOpenFolder;

  // 构造规范化的工作区多文件夹列表（支持向后兼容单个 fileTree 传入）
  const effectiveFolders: WorkspaceFolder[] =
    folders ??
    (currentFolderPath
      ? [
          {
            id: currentFolderPath,
            name: currentFolderPath.split('/').pop() || currentFolderPath,
            path: currentFolderPath,
            tree: fileTree,
          },
        ]
      : fileTree.length > 0
      ? [
          {
            id: 'workspace',
            name: '当前工作区',
            path: 'workspace',
            tree: fileTree,
          },
        ]
      : []);

  const toggleFolder = (folderPath: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  return (
    <aside
      data-testid="typora-sidebar"
      className={`drawer-transition shrink-0 border-r border-black/5 bg-[#FAF8F5]/95 flex flex-col overflow-hidden transition-all duration-200 select-none ${
        isOpen ? 'w-60 opacity-100' : 'w-0 opacity-0 pointer-events-none'
      }`}
    >
      {/* 顶部 Typora 风格双视图切换栏 (文件夹 | 大纲) */}
      <div className="h-9 border-b border-black/5 grid grid-cols-2 text-xs font-medium shrink-0 bg-[#FAF8F5]">
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
      </div>

      {viewMode === 'outline' ? (
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
                return (
                  <div
                    key={folder.path || folderIdx}
                    data-testid={`workspace-folder-${folderIdx}`}
                    className="workspace-folder-item"
                  >
                    {/* 文件夹分组标题行 */}
                    <div
                      onClick={() => toggleFolder(folder.path)}
                      className="folder-header group flex items-center justify-between py-1 px-1.5 rounded-md hover:bg-black/5 text-stone-700 cursor-pointer select-none transition"
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
                        {folder.tree.length === 0 ? (
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
    </aside>
  );
};

export default OutlineDrawer;
