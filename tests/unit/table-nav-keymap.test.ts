import { describe, it, expect } from 'vitest';
import { Editor, defaultValueCtx, rootCtx, editorViewCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { findTable, TableMap } from '@milkdown/prose/tables';
import { Selection } from '@milkdown/prose/state';
import { handleTableTabNavigation } from '../../src/renderer/editor/wysiwyg/table/tableNavKeymap';

const TABLE_MD = `
| A | B |
| --- | --- |
| 1 | 2 |
`.trim();

describe('Table Tab Navigation & Auto-Row Append (T212 / AC-11.3)', () => {
  it('navigates through cells with Tab and appends row when Tab is pressed on last cell', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, container);
        ctx.set(defaultValueCtx, TABLE_MD);
      })
      .use(commonmark)
      .use(gfm)
      .create();

    const view = editor.action((ctx) => ctx.get(editorViewCtx));
    expect(view).toBeDefined();

    // 找到表格
    let tablePos = -1;
    view.state.doc.descendants((node, pos) => {
      if (node.type.name === 'table' && tablePos === -1) {
        tablePos = pos;
        return false;
      }
    });

    const tableInfo = findTable(view.state.doc.resolve(tablePos + 1))!;
    expect(tableInfo).toBeDefined();
    expect(tableInfo.node.childCount).toBe(2); // 1 header + 1 data row

    const map = TableMap.get(tableInfo.node);
    expect(map.height).toBe(2);
    expect(map.width).toBe(2);

    // 1. 定位在第一格 (row 0, col 0)
    const cell0Pos = tableInfo.start + map.map[0] + 1;
    view.dispatch(view.state.tr.setSelection(Selection.near(view.state.doc.resolve(cell0Pos))));

    // 按 Tab (direction = 1)：非末尾单元格，应该移动到下一格 (row 0, col 1)
    const handled1 = handleTableTabNavigation(1)(view.state, view.dispatch);
    expect(handled1).toBe(true);

    // 2. 将光标定位在最后一格 (row 1, col 1: 内容为 '2')
    const lastCellIndex = map.map.length - 1;
    const lastCellPos = tableInfo.start + map.map[lastCellIndex] + 1;
    view.dispatch(view.state.tr.setSelection(Selection.near(view.state.doc.resolve(lastCellPos))));

    // 按 Tab (direction = 1)：处于末行末列，应该自动增行并在新行第一格聚焦！
    const handledLast = handleTableTabNavigation(1)(view.state, view.dispatch);
    expect(handledLast).toBe(true);

    // 验证表格行数增加了 1 行（总行数变为 3 行）
    const tableAfterAppend = findTable(view.state.selection.$from)!;
    expect(tableAfterAppend.node.childCount).toBe(3);

    // 3. 测试 Shift-Tab (direction = -1)：逆向跳转到上一格
    const handledShiftTab = handleTableTabNavigation(-1)(view.state, view.dispatch);
    expect(handledShiftTab).toBe(true);

    editor.destroy();
    document.body.removeChild(container);
  });
});
