import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { TabItem } from '../../types';

export interface UnsavedConfirmModalProps {
  tab: TabItem | null;
  onCancel: () => void;
  onDiscard: () => void;
  onSave: () => void;
}

export const UnsavedConfirmModal: React.FC<UnsavedConfirmModalProps> = ({
  tab,
  onCancel,
  onDiscard,
  onSave,
}) => {
  if (!tab) return null;

  return (
    <div className="absolute inset-0 bg-black/25 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 rounded-xl border border-black/10 shadow-2xl p-5 max-w-sm w-full space-y-4 text-center select-none">
        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-stone-900">文档存在未保存修改</h4>
          <p className="text-xs text-stone-500 mt-1">
            是否在关闭标签前保存对 <span className="font-medium text-stone-700">{tab.fileName}</span> 的更改？
          </p>
        </div>
        <div className="flex justify-center space-x-2 text-xs pt-1">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-md border border-stone-200 text-stone-700 hover:bg-stone-50 transition"
          >
            取消
          </button>
          <button
            onClick={onDiscard}
            className="px-3 py-1.5 rounded-md text-red-600 hover:bg-red-50 transition"
          >
            放弃更改
          </button>
          <button
            onClick={onSave}
            className="px-3 py-1.5 rounded-md bg-amber-600 text-white hover:bg-amber-700 font-medium transition shadow-2xs"
          >
            保存并关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnsavedConfirmModal;
