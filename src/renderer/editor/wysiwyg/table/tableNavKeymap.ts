import { Plugin } from '@milkdown/prose/state';
import { keymap } from '@milkdown/prose/keymap';
import {
  findTable,
  TableMap,
  addRowAfter,
  goToNextCell,
} from '@milkdown/prose/tables';
import type { EditorState, Transaction } from '@milkdown/prose/state';
import { Selection } from '@milkdown/prose/state';

/**
 * 处理表格内的 Tab 与 Shift+Tab 导航
 * @param direction 1: 向后遍历 (Tab); -1: 向前遍历 (Shift+Tab)
 */
export function handleTableTabNavigation(direction: 1 | -1) {
  return (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
    const table = findTable(state.selection.$from);
    if (!table) return false;

    // Shift+Tab：直接向前移动一格
    if (direction === -1) {
      return goToNextCell(-1)(state, dispatch);
    }

    // Tab：判断当前是否是最后一格
    const map = TableMap.get(table.node);

    // 找到当前单元格相对 table.start 的偏移
    let cellOffset = -1;
    for (let d = state.selection.$from.depth; d > 0; d--) {
      const node = state.selection.$from.node(d);
      if (node.type.name === 'table_cell' || node.type.name === 'table_header') {
        cellOffset = state.selection.$from.before(d) - table.start;
        break;
      }
    }

    const lastCellOffset = map.map[map.map.length - 1];
    const isLastCell = cellOffset === lastCellOffset;

    if (!isLastCell) {
      // 并非最后一格，按序移动到下一格
      return goToNextCell(1)(state, dispatch);
    }

    // 最后一格按 Tab：自动在下方增行，并将光标移动到新行第一格
    if (dispatch) {
      // 先执行增行
      addRowAfter(state, (tr) => {
        // 在新文档中找到更新后的 table
        const newTable = findTable(tr.selection.$from);
        if (newTable) {
          const newMap = TableMap.get(newTable.node);
          // 新行第 0 列单元格的偏移
          const newRowFirstCellOffset = newMap.map[(newMap.height - 1) * newMap.width];
          const targetPos = newTable.start + newRowFirstCellOffset + 1;
          const $target = tr.doc.resolve(targetPos);
          tr.setSelection(Selection.near($target));
        }
        dispatch(tr);
      });
    }

    return true;
  };
}

export function createTableNavKeymapPlugin(): Plugin {
  return keymap({
    Tab: handleTableTabNavigation(1),
    'Shift-Tab': handleTableTabNavigation(-1),
  });
}
