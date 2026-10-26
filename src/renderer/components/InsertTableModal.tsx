import React, { useState, useEffect, useRef } from 'react';

export interface InsertTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (rows: number, cols: number) => void;
}

export const InsertTableModal: React.FC<InsertTableModalProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const [rows, setRows] = useState<number>(3);
  const [cols, setCols] = useState<number>(3);
  const rowsInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setRows(3);
      setCols(3);
      setTimeout(() => {
        rowsInputRef.current?.focus();
        rowsInputRef.current?.select();
      }, 20);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const safeRows = Math.max(2, Math.min(50, Number(rows) || 3));
    const safeCols = Math.max(1, Math.min(20, Number(cols) || 3));
    onInsert(safeRows, safeCols);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      data-testid="insert-table-modal-backdrop"
    >
      <div
        className="w-80 rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xl p-5 text-xs text-zinc-700 dark:text-zinc-200 select-none"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="插入表格"
        data-testid="insert-table-modal"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            插入表格
          </h3>
          <span className="text-[11px] font-mono text-zinc-400">⌥⌘T</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                行数 (含表头)
              </span>
              <input
                ref={rowsInputRef}
                type="number"
                min={2}
                max={50}
                value={rows}
                onChange={(e) => setRows( parseInt(e.target.value, 10) || 2 )}
                data-testid="insert-table-rows-input"
                className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                列数
              </span>
              <input
                type="number"
                min={1}
                max={20}
                value={cols}
                onChange={(e) => setCols( parseInt(e.target.value, 10) || 1 )}
                data-testid="insert-table-cols-input"
                className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              data-testid="insert-table-cancel-btn"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              data-testid="insert-table-confirm-btn"
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors"
            >
              插入表格
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
