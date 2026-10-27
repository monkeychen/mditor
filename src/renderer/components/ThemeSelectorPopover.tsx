import React, { useEffect, useRef } from 'react';
import { THEME_LIST, AppTheme } from '../services/themeService';
import { Check } from 'lucide-react';

export interface ThemeSelectorPopoverProps {
  currentTheme: AppTheme;
  isOpen: boolean;
  onSelect: (theme: AppTheme) => void;
  onClose: () => void;
}

export const ThemeSelectorPopover: React.FC<ThemeSelectorPopoverProps> = ({
  currentTheme,
  isOpen,
  onSelect,
  onClose,
}) => {
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
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

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      data-testid="theme-selector-popover"
      className="absolute bottom-9 right-4 w-64 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200/90 dark:border-stone-700/80 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 select-none text-stone-800 dark:text-stone-200"
    >
      <div className="px-3 py-1.5 text-[11px] font-semibold text-stone-400 dark:text-stone-400 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
        <span>🎨 选择排版主题</span>
        <span className="text-[10px] text-stone-400 font-normal">实时切换</span>
      </div>

      <div className="mt-1 space-y-1">
        {THEME_LIST.map((item) => {
          const isSelected = item.id === currentTheme;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelect(item.id);
                onClose();
              }}
              data-testid={`theme-option-${item.id}`}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer text-left ${
                isSelected
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium'
                  : 'hover:bg-stone-100/80 dark:hover:bg-stone-800/80 text-stone-700 dark:text-stone-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {/* 主题色板预览小圆圈 */}
                <div
                  className="w-4 h-4 rounded-full border border-stone-300 dark:border-stone-600 shadow-2xs shrink-0 flex items-center justify-center text-[8px]"
                  style={{ backgroundColor: item.previewBg }}
                >
                  {item.icon}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-xs leading-snug">{item.label}</span>
                  <span className="text-[10px] text-stone-400 dark:text-stone-400 font-normal truncate max-w-[150px]">
                    {item.description}
                  </span>
                </div>
              </div>

              {isSelected && <Check className="w-3.5 h-3.5 text-blue-500 shrink-0 ml-2" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
