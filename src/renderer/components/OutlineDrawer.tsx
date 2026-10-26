import React, { useState } from 'react';
import { AlignLeft, ChevronRight, ChevronDown, Folder, FileText, FolderOpen } from 'lucide-react';
import type { OutlineItem } from '../utils/outline';
import type { FileTreeNode } from '../../types';

export type SidebarViewMode = 'files' | 'outline';

export interface OutlineDrawerProps {
  isOpen: boolean;
  outline: OutlineItem[];
  activeHeadingId?: string | null;
  onSelectHeading: (item: OutlineItem) => void;
  fileTree?: FileTreeNode[];
  currentFolderPath?: string | null;
  activeFilePath?: string | null;
  onSelectFile?: (filePath: string) => void;
  onOpenFolder?: () => void;
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
  fileTree = [],
  currentFolderPath = null,
  activeFilePath = null,
  onSelectFile,
  onOpenFolder,
  defaultView = 'outline',
}) => {
  const [viewMode, setViewMode] = useState<SidebarViewMode>(defaultView);

  const folderName = currentFolderPath ? currentFolderPath.split('/').pop() || currentFolderPath : null;

  return (
    <aside
      data-testid="typora-sidebar"
      className={`drawer-transition shrink-0 border-r border-black/5 bg-[#FAF8F5]/95 flex flex-col overflow-hidden transition-all duration-200 select-none ${
        isOpen ? 'w-60 opacity-100' : 'w-0 opacity-0 pointer-events-none'
      }`}
    >
      {/* 顶部 Typora 风格双视图切换栏 (文件 | 大纲) */}
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
          <span>文件</span>
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
            <span className="truncate font-medium text-stone-600" title={currentFolderPath || '未打开文件夹'}>
              {folderName || '当前工作区'}
            </span>
            {onOpenFolder && (
              <button
                onClick={onOpenFolder}
                title="切换文件夹"
                className="hover:text-stone-800 flex items-center gap-1 transition"
              >
                <FolderOpen className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs">
            {fileTree.length === 0 ? (
              <div className="text-center py-8 px-3 space-y-3">
                <div className="text-stone-400 text-xs">尚未加载文件夹目录</div>
                {onOpenFolder && (
                  <button
                    onClick={onOpenFolder}
                    className="px-3 py-1.5 bg-white border border-black/10 rounded-lg text-xs font-medium text-stone-700 hover:bg-stone-50 shadow-2xs transition inline-flex items-center gap-1.5"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
                    <span>打开文件夹...</span>
                  </button>
                )}
              </div>
            ) : (
              fileTree.map((node) => (
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
        </>
      )}
    </aside>
  );
};

export default OutlineDrawer;
