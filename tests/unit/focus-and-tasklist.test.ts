import { describe, it, expect } from 'vitest';
import { Editor, defaultValueCtx, rootCtx, editorViewCtx, prosePluginsCtx, serializerCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { TextSelection } from '@milkdown/prose/state';
import { createFocusModePlugin } from '../../src/renderer/editor/wysiwyg/focusModePlugin';
import { createTaskListPlugin } from '../../src/renderer/editor/wysiwyg/taskListPlugin';

describe('Focus Mode & Interactive Task List Plugins (T304 / T305)', () => {
  it('decorates only the active top-level block with focus-mode-active class', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const md = `# 标题一\n\n第一段文字\n\n第二段文字`;

    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, container);
        ctx.set(defaultValueCtx, md);
        ctx.update(prosePluginsCtx, (prev) => [
          ...prev,
          createFocusModePlugin(),
        ]);
      })
      .use(commonmark)
      .use(gfm)
      .create();

    const view = editor.action((ctx) => ctx.get(editorViewCtx));

    // 将光标放到第一段文字内部
    let firstParaPos = 1;
    view.state.doc.forEach((node, offset) => {
      if (node.type.name === 'paragraph' && node.textContent.includes('第一段')) {
        firstParaPos = offset + 1;
      }
    });

    const tr = view.state.tr.setSelection(TextSelection.create(view.state.doc, firstParaPos));
    view.dispatch(tr);

    const activeBlocks = container.querySelectorAll('.ProseMirror > .focus-mode-active');
    expect(activeBlocks.length).toBe(1);
    expect(activeBlocks[0].textContent).toContain('第一段文字');

    editor.destroy();
    document.body.removeChild(container);
  });

  it('renders interactive checkboxes for GFM task lists and toggles checked state on click', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const md = `- [ ] 待办事项一\n- [x] 已完成事项二`;

    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, container);
        ctx.set(defaultValueCtx, md);
        ctx.update(prosePluginsCtx, (prev) => [
          ...prev,
          createTaskListPlugin(),
        ]);
      })
      .use(commonmark)
      .use(gfm)
      .create();

    const view = editor.action((ctx) => ctx.get(editorViewCtx));
    expect(view).toBeDefined();

    // 查找渲染出的复选框控件
    const checkboxes = container.querySelectorAll('input.task-list-checkbox') as NodeListOf<HTMLInputElement>;
    expect(checkboxes.length).toBe(2);
    expect(checkboxes[0].checked).toBe(false);
    expect(checkboxes[1].checked).toBe(true);

    // 点击第一个复选框将其勾选
    checkboxes[0].click();

    const serialized = editor.action((ctx) => {
      const v = ctx.get(editorViewCtx);
      const serializer = ctx.get(serializerCtx);
      return serializer(v.state.doc);
    });

    expect(serialized).toContain('[x] 待办事项一');

    editor.destroy();
    document.body.removeChild(container);
  });
});
