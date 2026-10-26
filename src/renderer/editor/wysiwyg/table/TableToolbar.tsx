import React from 'react';
import type { EditorView } from '@milkdown/prose/view';
import {
  addRowBefore,
  addRowAfter,
  addColumnBefore,
  addColumnAfter,
  deleteRow,
  deleteColumn,
  deleteTable,
  setCellAttr,
} from '@milkdown/prose/tables';
import type { TableToolbarState } from './tableToolbarPlugin';

export interface TableToolbarProps {
  toolbarState: TableToolbarState;
  editorView: EditorView | null;
  containerRect?: DOMRect | null;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({
  toolbarState,
  editorView,
  containerRect,
}) => {
  if (!toolbarState.visible || !editorView) return null;

  const execute = (cmd: (state: any, dispatch: any) => boolean) => {
    if (!editorView) return;
    cmd(editorView.state, editorView.dispatch);
    editorView.focus();
  };

  // 计算相对于编辑器容器的定位坐标
  const containerTop = containerRect ? containerRect.top : 0;
  const containerLeft = containerRect ? containerRect.left : 0;

  // 浮在表格上方，留 36px 间隙
  const top = Math.max(10, toolbarState.rect.top - containerTop - 38);
  const left = Math.max(16, toolbarState.rect.left - containerLeft);

  return (
    <div
      data-testid="table-toolbar"
      style={{ top: `${top}px`, left: `${left}px` }}
      className="absolute z-30 flex items-center gap-0.5 bg-white/95 backdrop-blur-md border border-stone-200/90 rounded-lg shadow-lg px-1.5 py-1 text-xs text-stone-700 select-none animate-in fade-in duration-150"
    >
      <button
        type="button"
        onClick={() => execute(addRowBefore)}
        className="px-2 py-0.5 hover:bg-stone-100 rounded text-stone-700 transition"
        title="在上方插入行"
      >
        + 上行
      </button>
      <button
        type="button"
        onClick={() => execute(addRowAfter)}
        className="px-2 py-0.5 hover:bg-stone-100 rounded text-stone-700 transition"
        title="在下方插入行"
      >
        + 下行
      </button>
      <div className="h-3.5 w-px bg-stone-200 mx-0.5" />
      <button
        type="button"
        onClick={() => execute(addColumnBefore)}
        className="px-2 py-0.5 hover:bg-stone-100 rounded text-stone-700 transition"
        title="在左侧插入列"
      >
        + 左列
      </button>
      <button
        type="button"
        onClick={() => execute(addColumnAfter)}
        className="px-2 py-0.5 hover:bg-stone-100 rounded text-stone-700 transition"
        title="在右侧插入列"
      >
        + 右列
      </button>
      <div className="h-3.5 w-px bg-stone-200 mx-0.5" />
      <button
        type="button"
        onClick={() => execute(setCellAttr('alignment', 'left'))}
        className="px-1.5 py-0.5 hover:bg-stone-100 rounded text-stone-600 transition"
        title="居左对齐"
      >
        ⫷
      </button>
      <button
        type="button"
        onClick={() => execute(setCellAttr('alignment', 'center'))}
        className="px-1.5 py-0.5 hover:bg-stone-100 rounded text-stone-600 transition"
        title="居中对齐"
      >
        ≡
      </button>
      <button
        type="button"
        onClick={() => execute(setCellAttr('alignment', 'right'))}
        className="px-1.5 py-0.5 hover:bg-stone-100 rounded text-stone-600 transition"
        title="居右对齐"
      >
        ⫸
      </button>
      <div className="h-3.5 w-px bg-stone-200 mx-0.5" />
      <button
        type="button"
        onClick={() => execute(deleteRow)}
        className="px-1.5 py-0.5 hover:bg-red-50 text-red-600 rounded transition"
        title="删除当前行"
      >
        删行
      </button>
      <button
        type="button"
        onClick={() => execute(deleteColumn)}
        className="px-1.5 py-0.5 hover:bg-red-50 text-red-600 rounded transition"
        title="删除当前列"
      >
        删列
      </button>
      <button
        type="button"
        onClick={() => execute(deleteTable)}
        className="px-1.5 py-0.5 hover:bg-red-100 text-red-700 font-medium rounded transition"
        title="删除整个表格"
      >
        整表删除
      </button>
    </div>
  );
};

TableToolbar.displayName = 'TableToolbar';
