import { Plugin, PluginKey } from '@milkdown/prose/state';
import { findTable } from '@milkdown/prose/tables';
import type { EditorView } from '@milkdown/prose/view';

export interface TableToolbarState {
  visible: boolean;
  tablePos: number;
  rect: {
    top: number;
    left: number;
    width: number;
  };
}

export const tableToolbarPluginKey = new PluginKey<TableToolbarState>('MDITOR_TABLE_TOOLBAR');

export function createTableToolbarPlugin(
  onStateChange: (state: TableToolbarState) => void
): Plugin {
  return new Plugin({
    key: tableToolbarPluginKey,
    view() {
      return {
        update(view: EditorView) {
          const { selection } = view.state;
          const table = findTable(selection.$from);

          if (!table) {
            onStateChange({
              visible: false,
              tablePos: -1,
              rect: { top: 0, left: 0, width: 0 },
            });
            return;
          }

          try {
            // 获取表格对应的 DOM 元素或坐标
            const dom = view.nodeDOM(table.pos) as HTMLElement | null;
            if (dom && typeof dom.getBoundingClientRect === 'function') {
              const rect = dom.getBoundingClientRect();
              onStateChange({
                visible: true,
                tablePos: table.pos,
                rect: {
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                },
              });
            } else {
              // 降级为当前单元格坐标
              const coords = view.coordsAtPos(selection.$from.pos);
              onStateChange({
                visible: true,
                tablePos: table.pos,
                rect: {
                  top: coords.top,
                  left: coords.left,
                  width: 200,
                },
              });
            }
          } catch {
            onStateChange({
              visible: false,
              tablePos: -1,
              rect: { top: 0, left: 0, width: 0 },
            });
          }
        },
        destroy() {
          onStateChange({
            visible: false,
            tablePos: -1,
            rect: { top: 0, left: 0, width: 0 },
          });
        },
      };
    },
  });
}
