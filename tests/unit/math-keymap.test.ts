import { describe, it, expect } from 'vitest';
import { Editor, rootCtx, defaultValueCtx, editorViewCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { TextSelection } from '@milkdown/prose/state';
import { mathPlugin } from '../../src/renderer/editor/wysiwyg/math/mathPlugin';

describe('Math Keymap & Input Rules (T104 / AC-19.1 / AC-19.2)', () => {
  it('converts "$$" paragraph to math_block node upon pressing Enter', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, container);
        ctx.set(defaultValueCtx, '一段正文');
      })
      .use(commonmark)
      .use(mathPlugin)
      .create();

    const view = editor.action((ctx) => ctx.get(editorViewCtx));
    expect(view).toBeDefined();

    // 在文档末尾追加一个包含 "$$" 文本的段落
    const paragraph = view.state.schema.nodes.paragraph.create(
      null,
      view.state.schema.text('$$')
    );
    const insertTr = view.state.tr.insert(view.state.doc.content.size, paragraph);
    view.dispatch(insertTr);

    // 将光标定位在该段落末尾
    const pos = view.state.doc.content.size - 1;
    const selectTr = view.state.tr.setSelection(TextSelection.create(view.state.doc, pos));
    view.dispatch(selectTr);

    // 触发 Enter 按键事件
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    const handled = view.someProp('handleKeyDown', (f) => f(view, enterEvent));
    expect(handled).toBe(true);

    // 验证当前文档中成功生成了 math_block 节点
    let foundMathBlock = false;
    view.state.doc.descendants((node) => {
      if (node.type.name === 'math_block') {
        foundMathBlock = true;
      }
    });

    expect(foundMathBlock).toBe(true);

    editor.destroy();
    document.body.removeChild(container);
  });

  it('inserts or wraps selection into inline_math upon triggering Mod-Alt-M (⌥⌘M)', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, container);
        ctx.set(defaultValueCtx, 'Einstein E=mc^2 theory');
      })
      .use(commonmark)
      .use(mathPlugin)
      .create();

    const view = editor.action((ctx) => ctx.get(editorViewCtx));

    // 选中 "E=mc^2" (from: 10, to: 16)
    const tr = view.state.tr.setSelection(TextSelection.create(view.state.doc, 10, 16));
    view.dispatch(tr);

    // 触发 Mod+Alt+M 按键
    const shortcutEvent = new KeyboardEvent('keydown', {
      key: 'm',
      code: 'KeyM',
      metaKey: true,
      altKey: true,
      bubbles: true,
      cancelable: true,
    });
    const handled = view.someProp('handleKeyDown', (f) => f(view, shortcutEvent));
    expect(handled).toBe(true);

    // 验证生成了 inline_math 节点且内容为 E=mc^2
    let foundInlineMath = false;
    let mathVal = '';
    view.state.doc.descendants((node) => {
      if (node.type.name === 'inline_math') {
        foundInlineMath = true;
        mathVal = node.attrs.value;
      }
    });

    expect(foundInlineMath).toBe(true);
    expect(mathVal).toBe('E=mc^2');

    editor.destroy();
    document.body.removeChild(container);
  });
});
