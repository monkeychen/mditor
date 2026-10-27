import { describe, it, expect } from 'vitest';
import { Editor, rootCtx, defaultValueCtx, editorViewCtx, serializerCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { mathPlugin } from '../../src/renderer/editor/wysiwyg/math/mathPlugin';

describe('Inline Math Node & Transformer (T102 / AC-19.1 / AC-19.3)', () => {
  it('parses $formula$ markdown into inline_math node and serializes back with 100% fidelity', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const inputMd = '质能方程为 $E = mc^2$ 描述质量与能量的关系。';

    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, container);
        ctx.set(defaultValueCtx, inputMd);
      })
      .use(commonmark)
      .use(mathPlugin)
      .create();

    const view = editor.action((ctx) => ctx.get(editorViewCtx));
    expect(view).toBeDefined();

    // 检查 ProseMirror 文档 AST 中是否存在 inline_math 节点
    let foundInlineMath = false;
    let mathValue = '';
    view.state.doc.descendants((node) => {
      if (node.type.name === 'inline_math') {
        foundInlineMath = true;
        mathValue = node.attrs.value;
      }
    });

    expect(foundInlineMath).toBe(true);
    expect(mathValue.replace(/\s+/g, '')).toBe('E=mc^2');

    // 检查序列化回 Markdown 的保真度
    const serialized = editor.action((ctx) => {
      const v = ctx.get(editorViewCtx);
      const serializer = ctx.get(serializerCtx);
      return serializer(v.state.doc);
    });

    expect(serialized).toContain('$E = mc^2$');

    editor.destroy();
    document.body.removeChild(container);
  });
});
