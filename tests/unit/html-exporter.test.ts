import { describe, it, expect } from 'vitest';
import { generateStandaloneHtml } from '../../src/renderer/utils/htmlExporter';

describe('Standalone HTML Exporter (AC7.1)', () => {
  it('generates fully self-contained HTML with embedded styling and meta tags', () => {
    const md = '# 独立导出标题\n\n这是导出的正文内容，带有 **加粗** 和 `代码`。';
    const html = generateStandaloneHtml('My Document', md);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<title>My Document</title>');
    expect(html).toContain('<meta charset="UTF-8">');
    expect(html).toContain('<style>');
    expect(html).toContain('font-family: -apple-system');
    expect(html).toContain('独立导出标题');
  });
});
