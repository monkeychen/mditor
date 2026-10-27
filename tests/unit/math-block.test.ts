import { describe, it, expect } from 'vitest';
import { Editor, rootCtx, defaultValueCtx, editorViewCtx, serializerCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { mathPlugin } from '../../src/renderer/editor/wysiwyg/math/mathPlugin';

describe('Math Block Node & Transformer (T103 / AC-19.1 / AC-19.3)', () => {
  it('parses $$...$$ block into math_block node and serializes back with 100% fidelity', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const inputMd = '# 高斯积分\n\n$$\n\\int_{-\\infty}^{+\\infty} e^{-x^2} dx = \\sqrt{\\pi}\n$$\n\n这是后续正文。';

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

    // 检查 ProseMirror 文档 AST 中是否存在 math_block 节点
    let foundMathBlock = false;
    let mathBlockValue = '';
    view.state.doc.descendants((node) => {
      if (node.type.name === 'math_block') {
        foundMathBlock = true;
        mathBlockValue = node.attrs.value;
      }
    });

    expect(foundMathBlock).toBe(true);
    expect(mathBlockValue).toContain('e^{-x^2}');

    // 检查序列化回 Markdown 的保真度
    const serialized = editor.action((ctx) => {
      const v = ctx.get(editorViewCtx);
      const serializer = ctx.get(serializerCtx);
      return serializer(v.state.doc);
    });

    expect(serialized).toContain('$$');
    expect(serialized).toContain('\\int_{-\\infty}^{+\\infty} e^{-x^2} dx = \\sqrt{\\pi}');

    editor.destroy();
    document.body.removeChild(container);
  });
});
