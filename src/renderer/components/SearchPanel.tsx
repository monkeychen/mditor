import React, { useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, Repeat, X } from 'lucide-react';
import type { SearchMatch } from '../utils/search';

export interface SearchPanelProps {
  isOpen: boolean;
  isReplaceOpen: boolean;
  query: string;
  replaceText: string;
  matches: SearchMatch[];
  currentIndex: number;
  onQueryChange: (query: string) => void;
  onReplaceTextChange: (text: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleReplace: () => void;
  onReplaceSingle: () => void;
  onReplaceAll: () => void;
  onClose: () => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  isOpen,
  isReplaceOpen,
  query,
  replaceText,
  matches,
  currentIndex,
  onQueryChange,
  onReplaceTextChange,
  onNext,
  onPrev,
  onToggleReplace,
  onReplaceSingle,
  onReplaceAll,
  onClose,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalMatches = matches.length;
  const countDisplay = query
    ? totalMatches > 0
      ? `${currentIndex + 1} / ${totalMatches}`
      : '无结果'
    : '';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onPrev();
      } else {
        onNext();
      }
    }
  };

  return (
    <div
      className="absolute top-3 right-5 z-40 bg-white/95 backdrop-blur-md rounded-xl border border-black/10 shadow-lg p-2.5 w-[320px] select-none text-xs"
      onKeyDown={handleKeyDown}
    >
      {/* 搜索主行 */}
      <div className="flex items-center space-x-1.5">
        <div className="relative flex-1 flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="在当前文档中查找..."
            className="w-full text-xs pl-2 pr-14 py-1.5 bg-stone-100/90 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-stone-800"
          />
          {countDisplay && (
            <span className="absolute right-2 text-[10px] font-mono text-stone-400">
              {countDisplay}
            </span>
          )}
        </div>

        {/* 上一个 / 下一个 */}
        <button
          onClick={onPrev}
          disabled={totalMatches === 0}
          title="上一个 (Shift+Enter)"
          className="p-1.5 hover:bg-black/5 disabled:opacity-30 rounded-md text-stone-600 transition"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onNext}
          disabled={totalMatches === 0}
          title="下一个 (Enter)"
          className="p-1.5 hover:bg-black/5 disabled:opacity-30 rounded-md text-stone-600 transition"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        {/* 展开/折叠替换 */}
        <button
          onClick={onToggleReplace}
          title="切换替换模式 (Cmd+H)"
          className={`p-1.5 rounded-md transition ${
            isReplaceOpen ? 'bg-amber-100 text-amber-800' : 'hover:bg-black/5 text-stone-600'
          }`}
        >
          <Repeat className="w-3.5 h-3.5" />
        </button>

        {/* 关闭 */}
        <button
          onClick={onClose}
          title="关闭 (Esc)"
          className="p-1.5 hover:bg-black/5 rounded-md text-stone-400 hover:text-stone-700 transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 替换行 */}
      {isReplaceOpen && (
        <div className="mt-2 pt-2 border-t border-black/5 flex items-center space-x-1.5">
          <input
            type="text"
            value={replaceText}
            onChange={(e) => onReplaceTextChange(e.target.value)}
            placeholder="替换为..."
            className="flex-1 text-xs px-2 py-1.5 bg-stone-100/90 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-stone-800"
          />
          <button
            onClick={onReplaceSingle}
            disabled={totalMatches === 0}
            className="px-2.5 py-1 text-[11px] bg-stone-100 hover:bg-stone-200 disabled:opacity-40 text-stone-700 rounded-md font-medium transition"
          >
            替换
          </button>
          <button
            onClick={onReplaceAll}
            disabled={totalMatches === 0}
            className="px-2.5 py-1 text-[11px] bg-amber-50 hover:bg-amber-100 disabled:opacity-40 text-amber-800 rounded-md font-medium transition"
          >
            全部
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchPanel;
