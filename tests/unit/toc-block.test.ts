import { describe, it, expect } from 'vitest';
import { Editor, rootCtx, defaultValueCtx, editorViewCtx, serializerCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { extendedTypographyPlugin } from '../../src/renderer/editor/wysiwyg/extended/extendedTypographyPlugin';

describe('Table of Contents Block (T303 / AC-21.2 / AC-21.4)', () => {
  it('parses [TOC] block, renders dynamic outline card, and preserves [TOC] on serialization', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const inputMd = '# 核心架构\n\n[TOC]\n\n## 组件体系\n\n## 数据管道';

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

    // 检查 ProseMirror 文档 AST 中是否存在 toc_block 节点
    let foundToc = false;
    view.state.doc.descendants((node) => {
      if (node.type.name === 'toc_block') {
        foundToc = true;
      }
    });
    expect(foundToc).toBe(true);

    // 检查 DOM 中生成了 TOC 目录卡片及目录链接
    const tocCard = container.querySelector('.toc-block-card');
    expect(tocCard).not.toBeNull();
    expect(tocCard?.textContent).toContain('核心架构');
    expect(tocCard?.textContent).toContain('组件体系');
    expect(tocCard?.textContent).toContain('数据管道');

    // 检查序列化保真度
    const serialized = editor.action((ctx) => {
      const v = ctx.get(editorViewCtx);
      const serializer = ctx.get(serializerCtx);
      return serializer(v.state.doc);
    });

    expect(serialized).toContain('[TOC]');

    editor.destroy();
    document.body.removeChild(container);
  });
});
