import React from 'react';
import { AlignLeft, ChevronRight } from 'lucide-react';
import type { OutlineItem } from '../utils/outline';

export interface OutlineDrawerProps {
  isOpen: boolean;
  outline: OutlineItem[];
  activeHeadingId?: string | null;
  onSelectHeading: (item: OutlineItem) => void;
  onClose?: () => void;
}

export const OutlineDrawer: React.FC<OutlineDrawerProps> = ({
  isOpen,
  outline,
  activeHeadingId,
  onSelectHeading,
}) => {
  return (
    <aside
      className={`drawer-transition shrink-0 border-r border-black/5 bg-[#FAF8F5]/90 flex flex-col overflow-hidden transition-all duration-200 select-none ${
        isOpen ? 'w-60 opacity-100' : 'w-0 opacity-0 pointer-events-none'
      }`}
    >
      <div className="h-10 px-3 border-b border-black/5 flex items-center justify-between text-xs font-medium text-stone-500 shrink-0">
        <span className="flex items-center gap-1.5 font-semibold text-stone-700">
          <AlignLeft className="w-3.5 h-3.5 text-stone-400" />
          文档大纲
        </span>
        <span className="text-[11px] text-stone-400 font-mono">
          {outline.length} 个小节
        </span>
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
                    ? 'bg-amber-500/10 text-amber-900 font-semibold'
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
    </aside>
  );
};

export default OutlineDrawer;
