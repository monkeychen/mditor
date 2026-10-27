import { describe, it, expect } from 'vitest';
import { Editor, defaultValueCtx, rootCtx, prosePluginsCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { prism, prismConfig } from '@milkdown/plugin-prism';
import { createCodeBlockWidgetPlugin } from '../../src/renderer/editor/wysiwyg/code/codeBlockWidgetPlugin';

describe('Code Block Multi-Language Syntax Highlighting (Milkdown + Prism / Refractor)', () => {
  it('highlights TypeScript syntax with keyword, string, and function tokens', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const tsContent = `
\`\`\`typescript
interface Config {
  title: string;
}
const config: Config = { title: "mditor" };
function getTitle(): string {
  return config.title;
}
\`\`\`
`.trim();

    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, container);
        ctx.set(defaultValueCtx, tsContent);
        ctx.update(prismConfig.key, (prev) => ({
          ...prev,
          configureRefractor: (refractor) => {
            refractor.alias({
              typescript: ['ts'],
              javascript: ['js'],
              python: ['py'],
            });
          },
        }));
        ctx.update(prosePluginsCtx, (prev) => [
          ...prev,
          createCodeBlockWidgetPlugin(),
        ]);
      })
      .use(commonmark)
      .use(gfm)
      .use(prism)
      .create();

    const keywords = Array.from(container.querySelectorAll('.token.keyword')).map((el) => el.textContent);
    expect(keywords).toContain('interface');
    expect(keywords).toContain('const');
    expect(keywords).toContain('function');
    expect(keywords).toContain('return');

    const strings = Array.from(container.querySelectorAll('.token.string')).map((el) => el.textContent);
    expect(strings).toContain('"mditor"');

    editor.destroy();
    document.body.removeChild(container);
  });

  it('highlights Python syntax with def, return, number and string tokens', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const pyContent = `
\`\`\`python
def calculate_area(radius):
    pi = 3.14159
    return pi * (radius ** 2)
\`\`\`
`.trim();

    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, container);
        ctx.set(defaultValueCtx, pyContent);
        ctx.update(prosePluginsCtx, (prev) => [
          ...prev,
          createCodeBlockWidgetPlugin(),
        ]);
      })
      .use(commonmark)
      .use(gfm)
      .use(prism)
      .create();

    const keywords = Array.from(container.querySelectorAll('.token.keyword')).map((el) => el.textContent);
    expect(keywords).toContain('def');
    expect(keywords).toContain('return');

    const numbers = Array.from(container.querySelectorAll('.token.number')).map((el) => el.textContent);
    expect(numbers).toContain('3.14159');
    expect(numbers).toContain('2');

    editor.destroy();
    document.body.removeChild(container);
  });

  it('highlights JSON syntax with property, string, number and boolean tokens', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const jsonContent = `
\`\`\`json
{
  "name": "mditor",
  "version": 3,
  "localFirst": true
}
\`\`\`
`.trim();

    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, container);
        ctx.set(defaultValueCtx, jsonContent);
        ctx.update(prosePluginsCtx, (prev) => [
          ...prev,
          createCodeBlockWidgetPlugin(),
        ]);
      })
      .use(commonmark)
      .use(gfm)
      .use(prism)
      .create();

    const properties = Array.from(container.querySelectorAll('.token.property')).map((el) => el.textContent);
    expect(properties).toContain('"name"');
    expect(properties).toContain('"version"');
    expect(properties).toContain('"localFirst"');

    const numbers = Array.from(container.querySelectorAll('.token.number')).map((el) => el.textContent);
    expect(numbers).toContain('3');

    const booleans = Array.from(container.querySelectorAll('.token.boolean')).map((el) => el.textContent);
    expect(booleans).toContain('true');

    editor.destroy();
    document.body.removeChild(container);
  });

  it('dynamically updates syntax highlighting when language is changed via select dropdown', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    // 初始为无语言 plaintext
    const initialContent = `
\`\`\`
const x = 10;
\`\`\`
`.trim();

    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, container);
        ctx.set(defaultValueCtx, initialContent);
        ctx.update(prosePluginsCtx, (prev) => [
          ...prev,
          createCodeBlockWidgetPlugin(),
        ]);
      })
      .use(commonmark)
      .use(gfm)
      .use(prism)
      .create();

    // 初始 plaintext 无 keyword 高亮
    expect(container.querySelectorAll('.token.keyword').length).toBe(0);

    // 将下拉框切换为 javascript
    const langSelect = container.querySelector('.code-lang-selector') as HTMLSelectElement;
    expect(langSelect).not.toBeNull();
    langSelect.value = 'javascript';
    langSelect.dispatchEvent(new Event('change'));

    // 触发 ProseMirror 调度后，keyword token 应该被即时渲染
    const keywords = Array.from(container.querySelectorAll('.token.keyword')).map((el) => el.textContent);
    expect(keywords).toContain('const');

    editor.destroy();
    document.body.removeChild(container);
  });
});
