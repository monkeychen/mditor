import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Editor, defaultValueCtx, rootCtx, editorViewCtx, serializerCtx, remarkStringifyOptionsCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { mathPlugin } from '../../src/renderer/editor/wysiwyg/math/mathPlugin';
import { extendedTypographyPlugin } from '../../src/renderer/editor/wysiwyg/extended/extendedTypographyPlugin';

const corpusDir = path.resolve(__dirname, 'corpus');
const corpusFiles = fs.readdirSync(corpusDir).filter((f) => f.endsWith('.md')).sort();

/**
 * 规整表格中单元格的多余对齐空格与对齐横线长度，保留语义、单元格内容及对齐方向
 */
function normalizeMarkdownTables(content: string): string {
  return content
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const cells = trimmed
          .slice(1, -1)
          .split('|')
          .map((c) => {
            const ct = c.trim();
            if (/^:?-+:?$/.test(ct)) {
              const left = ct.startsWith(':');
              const right = ct.endsWith(':');
              if (left && right) return ':---:';
              if (left) return ':---';
              if (right) return '---:';
              return '---';
            }
            return ct;
          });
        return `| ${cells.join(' | ')} |`;
      }
      return line;
    })
    .join('\n');
}

describe('File Fidelity Gate (T205 / AC-14.1 / AC-14.2 / AC-14.3)', () => {
  it('has at least 30 diverse test corpus files', () => {
    expect(corpusFiles.length).toBeGreaterThanOrEqual(30);
  });

  // 为语料库中每一个文件执行「载入 ➔ 序列化」保真断言
  for (const filename of corpusFiles) {
    it(`preserves content fidelity for ${filename}`, async () => {
      const filePath = path.join(corpusDir, filename);
      const original = fs.readFileSync(filePath, 'utf8').trim();

      const container = document.createElement('div');
      document.body.appendChild(container);

      const editor = await Editor.make()
        .config((ctx) => {
          ctx.set(rootCtx, container);
          ctx.set(defaultValueCtx, original);
          ctx.update(remarkStringifyOptionsCtx, (prev) => ({
            ...prev,
            bullet: '-' as const,
            rule: '-' as const,
            emphasis: '*' as const,
            strong: '*' as const,
          }));
        })
        .use(commonmark)
        .use(gfm)
        .use(mathPlugin)
        .use(extendedTypographyPlugin)
        .create();

      const serialized = editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const serializer = ctx.get(serializerCtx);
        return serializer(view.state.doc);
      }).trim();

      editor.destroy();
      document.body.removeChild(container);

      // 非表格文件执行 100% 逐字节对比；表格文件允许 GFM 列宽美化，执行语义等价比对
      if (filename.includes('table') || filename === '28-complex-article.md' || filename === '30-comprehensive-doc.md') {
        expect(normalizeMarkdownTables(serialized)).toBe(normalizeMarkdownTables(original));
      } else {
        expect(serialized).toBe(original);
      }
    });
  }
});
