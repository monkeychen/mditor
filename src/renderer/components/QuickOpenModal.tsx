import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, FileText, FileCode, Database, FileJson, Terminal } from 'lucide-react';
import {
  filterAndRankFuzzy,
  type WorkspaceFileItem,
  type FuzzyMatchResult,
} from '../utils/fuzzySearch';
import { getLanguageInfo } from '../utils/languageClassifier';

export interface QuickOpenModalProps {
  isOpen: boolean;
  files: WorkspaceFileItem[];
  onOpenFile: (filePath: string) => void;
  onClose: () => void;
}

const renderFileIcon = (fileName: string) => {
  const lang = getLanguageInfo(fileName);
  const iconClass = 'w-4 h-4 shrink-0';

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

/**
 * Highlights matched characters in a string based on index list.
 */
function renderHighlightedText(text: string, matches: number[]) {
  if (!matches || matches.length === 0) {
    return <span>{text}</span>;
  }

  const matchSet = new Set(matches);
  const parts: React.ReactNode[] = [];

  for (let i = 0; i < text.length; i++) {
    if (matchSet.has(i)) {
      parts.push(
        <span key={i} className="text-amber-600 font-bold underline decoration-amber-500/50">
          {text[i]}
        </span>
      );
    } else {
      parts.push(text[i]);
    }
  }

  return <span>{parts}</span>;
}

export const QuickOpenModal: React.FC<QuickOpenModalProps> = ({
  isOpen,
  files,
  onOpenFile,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter and score results in real-time
  const results = useMemo(() => {
    return filterAndRankFuzzy(query, files, (f) => f.relativePath || f.name);
  }, [query, files]);

  // Reset query and selected index on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 30);
    }
  }, [isOpen]);

  // Keep selected index within bounds
  useEffect(() => {
    if (selectedIndex >= results.length) {
      setSelectedIndex(Math.max(0, results.length - 1));
    }
  }, [results.length, selectedIndex]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeElement = listRef.current.querySelector('[aria-selected="true"]');
      if (activeElement && typeof activeElement.scrollIntoView === 'function') {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        results.length > 0 ? (prev - 1 + results.length) % results.length : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = results[selectedIndex];
      if (selected) {
        onOpenFile(selected.item.path);
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleSelectItem = (item: WorkspaceFileItem) => {
    onOpenFile(item.path);
    onClose();
  };

  return (
    <div
      data-testid="quick-open-overlay"
      onClick={onClose}
      className="fixed inset-0 bg-black/30 backdrop-blur-xs z-50 flex items-start justify-center pt-20"
    >
      <div
        data-testid="quick-open-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-[580px] max-w-[90vw] bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-black/10 dark:border-stone-700/50 flex flex-col overflow-hidden animate-in fade-in duration-150"
      >
        {/* 搜索输入栏 */}
        <div className="p-3 border-b border-black/5 dark:border-stone-800 flex items-center gap-2.5">
          <Search className="w-4 h-4 text-stone-400 shrink-0" />
          <input
            ref={inputRef}
            data-testid="quick-open-input"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="快速打开文件 (输入文件名或路径)..."
            className="flex-1 bg-transparent text-sm text-stone-800 dark:text-stone-100 focus:outline-none placeholder-stone-400"
            autoFocus
          />
          <kbd className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-400 border border-stone-200 dark:border-stone-700 px-1.5 py-0.5 rounded font-mono">
            ESC
          </kbd>
        </div>

        {/* 结果列表 */}
        <div
          ref={listRef}
          data-testid="quick-open-list"
          role="listbox"
          className="max-h-80 overflow-y-auto p-1.5 space-y-0.5 text-xs"
        >
          {results.length === 0 ? (
            <div className="py-8 text-center text-stone-400 text-xs">
              无匹配文件
            </div>
          ) : (
            results.map((result, idx) => {
              const file = result.item;
              const isSelected = idx === selectedIndex;
              const langInfo = getLanguageInfo(file.name);

              return (
                <div
                  key={file.path}
                  data-testid={`quick-open-item-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectItem(file)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition select-none ${
                    isSelected
                      ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200'
                      : 'hover:bg-black/5 dark:hover:bg-white/5 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {renderFileIcon(file.name)}
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className="font-medium truncate text-stone-800 dark:text-stone-100">
                        {renderHighlightedText(file.name, result.matches)}
                      </span>
                      {file.relativePath !== file.name && (
                        <span className="text-[11px] text-stone-400 truncate">
                          {file.relativePath}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-stone-400 shrink-0 ml-2">
                    {langInfo.name}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* 底部键盘指引条 */}
        <div className="p-2 bg-stone-50/80 dark:bg-stone-800/50 border-t border-black/5 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 px-3">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 px-1 py-0.2 rounded">
                ↑
              </kbd>{' '}
              <kbd className="font-mono bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 px-1 py-0.2 rounded">
                ↓
              </kbd>{' '}
              切换
            </span>
            <span>
              <kbd className="font-mono bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 px-1 py-0.2 rounded">
                ↵
              </kbd>{' '}
              打开
            </span>
          </div>
          <span className="text-stone-400">
            {results.length} / {files.length} 个文件
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuickOpenModal;
