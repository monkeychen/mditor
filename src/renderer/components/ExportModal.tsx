import React, { useState } from 'react';
import { X, FileText, Check } from 'lucide-react';
import type { PdfExportOptions } from '../../types';

export interface ExportModalProps {
  isOpen: boolean;
  fileName: string;
  onClose: () => void;
  onConfirm: (options: PdfExportOptions) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  fileName,
  onClose,
  onConfirm,
}) => {
  const [pageSize, setPageSize] = useState<'A4' | 'Letter'>('A4');
  const [marginPreset, setMarginPreset] = useState<'standard' | 'narrow' | 'none'>('standard');
  const [displayHeaderFooter, setDisplayHeaderFooter] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleExport = () => {
    onConfirm({
      pageSize,
      marginPreset,
      displayHeaderFooter,
      headerTitle: fileName.replace(/\.[^/.]+$/, ''),
    });
  };

  return (
    <div
      data-testid="pdf-export-modal"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 select-none"
    >
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-700/60 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded-md bg-red-500/10 text-red-600">
              <FileText className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-stone-800 dark:text-stone-100">出版级 PDF 导出配置</span>
          </div>
          <button
            onClick={onClose}
            data-testid="pdf-export-close-btn"
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition p-0.5 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 选项表单 */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-medium text-stone-700 dark:text-stone-300 block mb-1.5">纸张规格</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                data-testid="pdf-page-size-a4"
                onClick={() => setPageSize('A4')}
                className={`px-3 py-2 rounded-lg font-medium flex items-center justify-between transition cursor-pointer ${
                  pageSize === 'A4'
                    ? 'border-2 border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 font-semibold'
                    : 'border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700/50'
                }`}
              >
                <span>A4 (210 × 297mm)</span>
                {pageSize === 'A4' && <Check className="w-3.5 h-3.5 text-amber-600" />}
              </button>
              <button
                type="button"
                data-testid="pdf-page-size-letter"
                onClick={() => setPageSize('Letter')}
                className={`px-3 py-2 rounded-lg font-medium flex items-center justify-between transition cursor-pointer ${
                  pageSize === 'Letter'
                    ? 'border-2 border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 font-semibold'
                    : 'border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700/50'
                }`}
              >
                <span>US Letter (8.5 × 11")</span>
                {pageSize === 'Letter' && <Check className="w-3.5 h-3.5 text-amber-600" />}
              </button>
            </div>
          </div>

          <div>
            <label className="font-medium text-stone-700 dark:text-stone-300 block mb-1.5">页边距设置</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                data-testid="pdf-margin-standard"
                onClick={() => setMarginPreset('standard')}
                className={`px-3 py-1.5 rounded-lg text-center transition cursor-pointer ${
                  marginPreset === 'standard'
                    ? 'border-2 border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 font-semibold'
                    : 'border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700/50'
                }`}
              >
                标准 20mm
              </button>
              <button
                type="button"
                data-testid="pdf-margin-narrow"
                onClick={() => setMarginPreset('narrow')}
                className={`px-3 py-1.5 rounded-lg text-center transition cursor-pointer ${
                  marginPreset === 'narrow'
                    ? 'border-2 border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 font-semibold'
                    : 'border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700/50'
                }`}
              >
                紧凑 10mm
              </button>
              <button
                type="button"
                data-testid="pdf-margin-none"
                onClick={() => setMarginPreset('none')}
                className={`px-3 py-1.5 rounded-lg text-center transition cursor-pointer ${
                  marginPreset === 'none'
                    ? 'border-2 border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 font-semibold'
                    : 'border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700/50'
                }`}
              >
                无边距
              </button>
            </div>
          </div>

          <div className="p-3 bg-stone-50 dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-700/60 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-stone-700 dark:text-stone-300">
              <span className="font-medium">专业防腰斩截断控制 (Break Avoid)</span>
              <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">已启用</span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
              系统已自动为代码块、表格、独立公式、Mermaid 图表应用防断页规则，杜绝跨页生硬截断。
            </p>
          </div>

          <label className="flex items-center justify-between py-1 cursor-pointer">
            <span className="font-medium text-stone-700 dark:text-stone-300">在页脚印制页码与文档标题</span>
            <input
              type="checkbox"
              data-testid="pdf-footer-toggle"
              checked={displayHeaderFooter}
              onChange={(e) => setDisplayHeaderFooter(e.target.checked)}
              className="accent-amber-600 rounded cursor-pointer w-4 h-4"
            />
          </label>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100 dark:border-stone-700/60">
          <button
            type="button"
            data-testid="pdf-export-cancel-btn"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 text-xs font-medium cursor-pointer transition"
          >
            取消
          </button>
          <button
            type="button"
            data-testid="pdf-export-confirm-btn"
            onClick={handleExport}
            className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium shadow-xs cursor-pointer transition"
          >
            开始导出出版级 PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
