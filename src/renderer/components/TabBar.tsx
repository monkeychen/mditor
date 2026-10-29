import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { TabItem } from '../../types';
import { cleanHeadingText } from '../utils/outline';

/**
 * 计算 Tab 标签页悬停 Tooltip 文本 (F39 / AC-39.1 ~ AC-39.3)
 * 1. 已保存文档 (具有 filePath): 显示完整物理路径
 * 2. 未保存新建草稿 (filePath 为空): 提取第一行有效标题，剥离 Markdown # 标记并跳过空行
 * 3. 空白草稿: 优雅回退为 tab.fileName
 */
export function getTabTooltip(tab: TabItem): string {
  if (tab.filePath) {
    return tab.filePath;
  }

  if (tab.content) {
    const lines = tab.content.split(/\r?\n/);
    const firstLine = lines.find((line) => line.trim().length > 0)?.trim();
    if (firstLine) {
      const headingMatch = firstLine.match(/^#{1,6}\s+(.+)$/);
      const titleRaw = headingMatch ? headingMatch[1] : firstLine;
      const cleanTitle = cleanHeadingText(titleRaw);
      if (cleanTitle) {
        return cleanTitle;
      }
    }
  }

  return tab.fileName || 'Untitled.md';
}

export interface TabBarProps {
  tabs: TabItem[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: () => void;
  onReorderTabs?: (fromIndex: number, toIndex: number) => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onReorderTabs,
}) => {
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{
    index: number;
    position: 'left' | 'right';
  } | null>(null);

  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTabId(tabId);
    e.dataTransfer.setData('text/plain', tabId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTabId(null);
    setDropIndicator(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number, tabId: string) => {
    e.preventDefault();
    const sourceId = draggedTabId || e.dataTransfer.getData('text/plain');
    if (sourceId && sourceId === tabId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const position = e.clientX < midX ? 'left' : 'right';
    setDropIndicator({ index, position });
  };

  const handleDrop = (e: React.DragEvent, toIndex: number, tabId: string) => {
    e.preventDefault();
    const sourceId = draggedTabId || e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === tabId) {
      setDropIndicator(null);
      return;
    }

    const fromIndex = tabs.findIndex((t) => t.id === sourceId);
    if (fromIndex >= 0) {
      onReorderTabs?.(fromIndex, toIndex);
    }

    setDraggedTabId(null);
    setDropIndicator(null);
  };

  return (
    <div
      data-testid="tab-bar-container"
      className="flex-1 min-w-0 flex items-center space-x-1 overflow-x-auto px-2 scrollbar-none"
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTabId;
        const isDragging = tab.id === draggedTabId;
        const isDropTarget = dropIndicator?.index === index;
        const indicatorClass = isDropTarget
          ? dropIndicator.position === 'left'
            ? 'border-l-2 border-l-amber-500'
            : 'border-r-2 border-r-amber-500'
          : '';
        const tooltip = getTabTooltip(tab);

        return (
          <div
            key={tab.id}
            data-testid={`tab-${tab.fileName}`}
            data-tab-id={tab.id}
            data-tab-index={index}
            draggable={true}
            onDragStart={(e) => handleDragStart(e, tab.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index, tab.id)}
            onDrop={(e) => handleDrop(e, index, tab.id)}
            onClick={() => onSelectTab(tab.id)}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title={tooltip}
            className={`tab-item shrink-0 group flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition select-none ${
              isDragging ? 'opacity-40 scale-95' : ''
            } ${indicatorClass} ${
              isActive
                ? 'bg-white/85 border border-black/5 shadow-2xs text-stone-800'
                : 'text-stone-500 hover:bg-black/5 hover:text-stone-700'
            }`}
          >
            {/* 状态小圆点 */}
            {tab.isDirty ? (
              <span
                title="未保存修改"
                className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0"
              />
            ) : (
              <span
                title="已保存"
                className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"
              />
            )}

            <span className="truncate max-w-[200px]" title={tooltip}>
              {tab.fileName}
            </span>

            {/* 关闭按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
              title="关闭 (Cmd+W)"
              className="opacity-0 group-hover:opacity-100 hover:bg-black/10 rounded p-0.5 text-stone-400 hover:text-stone-700 transition"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}

      {/* 新建标签按钮 */}
      <button
        onClick={onNewTab}
        title="新建标签 (Cmd+T)"
        data-testid="tab-bar-new-tab-btn"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="shrink-0 p-1 hover:bg-black/5 text-stone-400 hover:text-stone-700 rounded-md transition ml-1"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default TabBar;
