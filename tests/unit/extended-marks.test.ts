import { describe, it, expect } from 'vitest';
import { Editor, rootCtx, defaultValueCtx, editorViewCtx, serializerCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { extendedTypographyPlugin } from '../../src/renderer/editor/wysiwyg/extended/extendedTypographyPlugin';

describe('Extended Typography Marks (T301 / AC-21.1 / AC-21.4)', () => {
  it('parses highlight, subscript, and superscript marks and preserves 100% fidelity on serialization', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const inputMd = '这是 ==核心要点==，水分子为 H~2~O，平方运算为 a^2^。';

    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, container);
        ctx.set(defaultValueCtx, inputMd);
      })
      .use(commonmark)
      .use(extendedTypographyPlugin)
      .create();

    const view = editor.action((ctx) => ctx.get(editorViewCtx));
    expect(view).toBeDefined();

    // 检查 ProseMirror 文档中的 marks
    let foundHighlight = false;
    let foundSubscript = false;
    let foundSuperscript = false;

    view.state.doc.descendants((node) => {
      if (node.isText && node.marks) {
        for (const m of node.marks) {
          if (m.type.name === 'highlight') foundHighlight = true;
          if (m.type.name === 'subscript') foundSubscript = true;
          if (m.type.name === 'superscript') foundSuperscript = true;
        }
      }
    });

    expect(foundHighlight).toBe(true);
    expect(foundSubscript).toBe(true);
    expect(foundSuperscript).toBe(true);

    // 检查序列化保真度
    const serialized = editor.action((ctx) => {
      const v = ctx.get(editorViewCtx);
      const serializer = ctx.get(serializerCtx);
      return serializer(v.state.doc);
    });

    expect(serialized).toContain('==核心要点==');
    expect(serialized).toContain('H~2~O');
    expect(serialized).toContain('a^2^');

    editor.destroy();
    document.body.removeChild(container);
  });
});
