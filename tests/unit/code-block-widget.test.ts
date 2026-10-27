import { describe, it, expect, vi } from 'vitest';
import { Editor, defaultValueCtx, rootCtx, editorViewCtx, serializerCtx, prosePluginsCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { prism } from '@milkdown/plugin-prism';
import { createCodeBlockWidgetPlugin } from '../../src/renderer/editor/wysiwyg/code/codeBlockWidgetPlugin';

const SAMPLE_CODE_MD = `
\`\`\`typescript
const greeting = "Hello, mditor";
console.log(greeting);
\`\`\`
`.trim();

describe('CodeBlock Widget & Header Enhancements (T213 / AC-12.1 ~ AC-12.3)', () => {
  it('renders custom CodeBlockView with language selector and copy button', async () => {
    // mock clipboard
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const container = document.createElement('div');
    document.body.appendChild(container);

    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, container);
        ctx.set(defaultValueCtx, SAMPLE_CODE_MD);
        ctx.update(prosePluginsCtx, (prev) => [
          ...prev,
          createCodeBlockWidgetPlugin(),
        ]);
      })
      .use(commonmark)
      .use(gfm)
      .create();

    const view = editor.action((ctx) => ctx.get(editorViewCtx));
    expect(view).toBeDefined();

    // 验证 DOM 中渲染了代码块 Header
    const header = container.querySelector('.cm-code-block-header');
    expect(header).not.toBeNull();

    // 验证语言选择器
    const langSelect = container.querySelector('.code-lang-selector') as HTMLSelectElement;
    expect(langSelect).not.toBeNull();
    expect(langSelect.value).toBe('typescript');

    // 验证复制代码按钮
    const copyBtn = container.querySelector('.code-copy-btn') as HTMLButtonElement;
    expect(copyBtn).not.toBeNull();
    expect(copyBtn.textContent).toContain('复制');

    // 触发点击复制
    copyBtn.click();
    expect(writeTextMock).toHaveBeenCalledWith('const greeting = "Hello, mditor";\nconsole.log(greeting);');

    // 验证语言切换联动 (修改为 python)
    langSelect.value = 'python';
    langSelect.dispatchEvent(new Event('change'));

    // 验证序列化输出已变为 ```python
    const serialized = editor.action((ctx) => {
      const v = ctx.get(editorViewCtx);
      const serializer = ctx.get(serializerCtx);
      return serializer(v.state.doc);
    });

    expect(serialized).toContain('```python');

    editor.destroy();
    document.body.removeChild(container);
  });

  it('highlights code syntax with language tokens across different languages', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, container);
        ctx.set(defaultValueCtx, SAMPLE_CODE_MD);
        ctx.update(prosePluginsCtx, (prev) => [
          ...prev,
          createCodeBlockWidgetPlugin(),
        ]);
      })
      .use(commonmark)
      .use(gfm)
      .use(prism)
      .create();

    const keywordToken = container.querySelector('.token.keyword');
    expect(keywordToken).not.toBeNull();
    expect(keywordToken?.textContent).toBe('const');

    const stringToken = container.querySelector('.token.string');
    expect(stringToken).not.toBeNull();
    expect(stringToken?.textContent).toBe('"Hello, mditor"');

    editor.destroy();
    document.body.removeChild(container);
  });
});
