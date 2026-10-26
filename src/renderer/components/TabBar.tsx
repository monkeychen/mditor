import React from 'react';
import { X, Plus } from 'lucide-react';
import type { TabItem } from '../../types';

export interface TabBarProps {
  tabs: TabItem[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
}) => {
  return (
    <div
      data-testid="tab-bar-container"
      className="flex-1 min-w-0 flex items-center space-x-1 overflow-x-auto px-2 scrollbar-none"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            className={`tab-item shrink-0 group flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition select-none ${
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

            <span className="truncate max-w-[200px]" title={tab.filePath || tab.fileName}>
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
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="shrink-0 p-1 hover:bg-black/5 text-stone-400 hover:text-stone-700 rounded-md transition ml-1"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default TabBar;
