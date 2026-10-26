import { describe, it, expect } from 'vitest';
import { Editor, defaultValueCtx, rootCtx, editorViewCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import {
  findTable,
  addRowAfter,
  addRowBefore,
  addColumnAfter,
  addColumnBefore,
  deleteRow,
  deleteColumn,
  deleteTable,
  setCellAttr,
} from '@milkdown/prose/tables';
import { Selection } from '@milkdown/prose/state';

const SAMPLE_TABLE_MD = `
| 标题一 | 标题二 |
| :--- | :---: |
| 单元格 1 | 单元格 2 |
| 单元格 3 | 单元格 4 |

下方正文段落。
`.trim();

describe('Table Operations & Commands (T211)', () => {
  it('correctly mounts GFM table and finds table structure in ProseMirror state', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, container);
        ctx.set(defaultValueCtx, SAMPLE_TABLE_MD);
      })
      .use(commonmark)
      .use(gfm)
      .create();

    const view = editor.action((ctx) => ctx.get(editorViewCtx));
    expect(view).toBeDefined();

    // 将光标定位在表格内部某个单元格中
    // 寻找 table 节点
    let tablePos = -1;
    view.state.doc.descendants((node, pos) => {
      if (node.type.name === 'table' && tablePos === -1) {
        tablePos = pos;
        return false;
      }
    });

    expect(tablePos).toBeGreaterThanOrEqual(0);

    // 将光标设置到表格内部 (tablePos + 3 是内部 cell 位置)
    const insideTablePos = tablePos + 4;
    const $pos = view.state.doc.resolve(insideTablePos);
    const sel = Selection.near($pos);
    view.dispatch(view.state.tr.setSelection(sel));

    // 验证 findTable 能识别到表格
    const tableInfo = findTable(view.state.selection.$from);
    expect(tableInfo).toBeDefined();
    expect(tableInfo?.node.type.name).toBe('table');

    // 找到第 2 行 (即第 1 个数据行) 的单元格内部位置
    const firstDataRow = tableInfo?.node.child(1);
    expect(firstDataRow).toBeDefined();

    // 初始表格应该有 3 行 (1 header + 2 body)
    expect(tableInfo?.node.childCount).toBe(3);

    // 将选区置于第 1 个数据行内部
    // tableInfo.start 是表格内容起始，第 0 行长度 + 偏移
    const row0Size = tableInfo!.node.child(0).nodeSize;
    const insideDataRowPos = tableInfo!.start + row0Size + 2;
    view.dispatch(view.state.tr.setSelection(Selection.near(view.state.doc.resolve(insideDataRowPos))));

    // 1. 在数据行执行 addRowAfter：在下方插入一行
    addRowAfter(view.state, view.dispatch);
    const tableAfterAddRow = findTable(view.state.selection.$from);
    expect(tableAfterAddRow?.node.childCount).toBe(4);

    // 2. 在数据行执行 addRowBefore：在上方插入一行
    addRowBefore(view.state, view.dispatch);
    const tableAfterAddRowBefore = findTable(view.state.selection.$from);
    expect(tableAfterAddRowBefore?.node.childCount).toBe(5);

    // 3. 执行 deleteRow：删除当前行
    deleteRow(view.state, view.dispatch);
    const tableAfterDelRow = findTable(view.state.selection.$from);
    expect(tableAfterDelRow?.node.childCount).toBe(4);

    // 4. 执行 addColumnBefore / addColumnAfter：插入列
    const initialCols = tableAfterDelRow?.node.child(0).childCount || 0;
    addColumnBefore(view.state, view.dispatch);
    const tableAfterAddColBefore = findTable(view.state.selection.$from);
    expect(tableAfterAddColBefore?.node.child(0).childCount).toBe(initialCols + 1);

    addColumnAfter(view.state, view.dispatch);
    const tableAfterAddCol = findTable(view.state.selection.$from);
    expect(tableAfterAddCol?.node.child(0).childCount).toBe(initialCols + 2);

    // 5. 执行 deleteColumn：删除一列
    deleteColumn(view.state, view.dispatch);
    deleteColumn(view.state, view.dispatch);
    const tableAfterDelCol = findTable(view.state.selection.$from);
    expect(tableAfterDelCol?.node.child(0).childCount).toBe(initialCols);

    // 6. 执行 setCellAttr 设置对齐属性
    setCellAttr('alignment', 'center')(view.state, view.dispatch);

    // 7. 执行 deleteTable：删除整个表格
    deleteTable(view.state, view.dispatch);
    const tableAfterDelete = findTable(view.state.selection.$from);
    expect(tableAfterDelete).toBeFalsy();

    editor.destroy();
    document.body.removeChild(container);
  });
});
