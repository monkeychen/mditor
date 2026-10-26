import { describe, it, expect } from 'vitest';
import { Editor, defaultValueCtx, rootCtx, editorViewCtx, prosePluginsCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { createPlaceholderPlugin } from '../../src/renderer/editor/wysiwyg/placeholderPlugin';

describe('Placeholder & Empty Document Guide Plugin (TDD)', () => {
  it('adds is-empty class and data-placeholder attribute when document is empty', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, container);
        ctx.set(defaultValueCtx, '');
        ctx.update(prosePluginsCtx, (prev) => [
          ...prev,
          createPlaceholderPlugin('开始书写，或输入 # 创建标题...'),
        ]);
      })
      .use(commonmark)
      .use(gfm)
      .create();

    const view = editor.action((ctx) => ctx.get(editorViewCtx));
    expect(view).toBeDefined();

    // 验证空文档时第一段被装饰了 is-empty 与 data-placeholder
    const emptyP = container.querySelector('.ProseMirror p.is-empty');
    expect(emptyP).not.toBeNull();
    expect(emptyP?.getAttribute('data-placeholder')).toBe('开始书写，或输入 # 创建标题...');

    editor.destroy();
    document.body.removeChild(container);
  });

  it('does NOT add placeholder decoration when document has text content', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, container);
        ctx.set(defaultValueCtx, '# 已有文档标题\n\n正文内容');
        ctx.update(prosePluginsCtx, (prev) => [
          ...prev,
          createPlaceholderPlugin('开始书写，或输入 # 创建标题...'),
        ]);
      })
      .use(commonmark)
      .use(gfm)
      .create();

    const view = editor.action((ctx) => ctx.get(editorViewCtx));
    expect(view).toBeDefined();

    // 验证有内容时不应存在 is-empty
    const emptyP = container.querySelector('.ProseMirror p.is-empty');
    expect(emptyP).toBeNull();

    editor.destroy();
    document.body.removeChild(container);
  });
});
