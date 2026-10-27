import { describe, it, expect } from 'vitest';
import { Editor, rootCtx, defaultValueCtx, editorViewCtx, prosePluginsCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { createFootnoteTooltipPlugin } from '../../src/renderer/editor/wysiwyg/extended/footnoteTooltipPlugin';

describe('Footnote Hover Tooltip (T304 / AC-21.3)', () => {
  it('shows tooltip with definition content on mouseenter and hides on mouseleave', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const inputMd = '根据第一性原理[^1]，系统应承担全部复杂性。\n\n[^1]: 后端可以很复杂，但用户触碰到的每一层必须丝滑。';

    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, container);
        ctx.set(defaultValueCtx, inputMd);
        ctx.update(prosePluginsCtx, (prev) => [
          ...prev,
          createFootnoteTooltipPlugin(),
        ]);
      })
      .use(commonmark)
      .use(gfm)
      .create();

    const view = editor.action((ctx) => ctx.get(editorViewCtx));
    expect(view).toBeDefined();

    // 查找 DOM 中的脚注引用元素
    const footnoteRef = container.querySelector('.footnote-ref, [data-type="footnote_reference"], sup');
    expect(footnoteRef).not.toBeNull();

    // 模拟 mouseenter 事件
    footnoteRef?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

    // 验证浮窗被创建并显示对应的脚注解释
    const tooltip = document.querySelector('.mditor-footnote-tooltip');
    expect(tooltip).not.toBeNull();
    expect(tooltip?.textContent).toContain('后端可以很复杂');

    // 模拟 mouseleave 事件
    footnoteRef?.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    expect(tooltip?.classList.contains('hidden')).toBe(true);

    editor.destroy();
    document.body.removeChild(container);
    tooltip?.remove();
  });
});
