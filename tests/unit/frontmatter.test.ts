import { describe, it, expect } from 'vitest';
import { Editor, rootCtx, defaultValueCtx, editorViewCtx, serializerCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { extendedTypographyPlugin } from '../../src/renderer/editor/wysiwyg/extended/extendedTypographyPlugin';

describe('YAML Front Matter (T302 / AC-21.4)', () => {
  it('parses frontmatter block, renders foldable card, and preserves YAML on serialization', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const inputMd = '---\ntitle: 优雅设计\ndate: 2026-10-27\n---\n\n正文内容';

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

    // 检查 ProseMirror 文档 AST 中是否存在 frontmatter 节点
    let foundFm = false;
    let fmVal = '';
    view.state.doc.descendants((node) => {
      if (node.type.name === 'frontmatter') {
        foundFm = true;
        fmVal = node.attrs.value;
      }
    });

    expect(foundFm).toBe(true);
    expect(fmVal).toContain('title: 优雅设计');
    expect(fmVal).toContain('date: 2026-10-27');

    // 检查 DOM 渲染
    const fmCard = container.querySelector('.frontmatter-card');
    expect(fmCard).not.toBeNull();
    expect(fmCard?.textContent).toContain('优雅设计');

    // 检查序列化保真度
    const serialized = editor.action((ctx) => {
      const v = ctx.get(editorViewCtx);
      const serializer = ctx.get(serializerCtx);
      return serializer(v.state.doc);
    });

    expect(serialized).toContain('---');
    expect(serialized).toContain('title: 优雅设计');
    expect(serialized).toContain('date: 2026-10-27');

    editor.destroy();
    document.body.removeChild(container);
  });
});
