import React from 'react';
import type { DocumentStats } from '../utils/counter';

export interface WordCountPopoverProps {
  isOpen: boolean;
  stats: DocumentStats;
  onClose: () => void;
}

export const WordCountPopover: React.FC<WordCountPopoverProps> = ({
  isOpen,
  stats,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      data-testid="word-count-popover"
      className="fixed bottom-8 right-4 w-56 bg-white/95 backdrop-blur-xl border border-black/10 rounded-xl shadow-xl p-3.5 text-xs text-stone-700 z-50 select-none animate-in fade-in duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/5">
        <span className="font-semibold text-stone-800">字数统计</span>
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-stone-700 text-[11px] px-1 rounded hover:bg-black/5"
        >
          ✕
        </button>
      </div>
      <div className="space-y-1.5 font-sans">
        <div className="flex items-center justify-between">
          <span className="text-stone-500">预计阅读</span>
          <span className="font-mono font-medium text-stone-800">
            {stats.readingTimeMinutes === 0 ? '< 1 分钟' : `约 ${stats.readingTimeMinutes} 分钟`}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-stone-500">词数 (Words)</span>
          <span className="font-mono font-semibold text-amber-700">{stats.wordCount.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-stone-500">字符 (Characters)</span>
          <span className="font-mono font-medium text-stone-800">{stats.charCount.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-stone-500">字符 (不含空格)</span>
          <span className="font-mono font-medium text-stone-800">{stats.charCountNoSpaces.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-stone-500">行数 (Lines)</span>
          <span className="font-mono font-medium text-stone-800">{stats.lineCount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
