import { describe, it, expect } from 'vitest';
import { convertMarkdownToWechatHtml, copyWechatHtmlToClipboard } from '../../src/renderer/utils/wechatFormatter';

describe('WeChat & Zhihu Inline HTML Formatter (AC7.3)', () => {
  it('converts headings with inline styling attributes', () => {
    const md = '# 主标题\n## 二级标题';
    const html = convertMarkdownToWechatHtml(md);

    expect(html).toContain('<h1 style="');
    expect(html).toContain('font-size: 22px');
    expect(html).toContain('<h2 style="');
    expect(html).toContain('border-left: 4px solid');
  });

  it('converts blockquote and inline code with styled tags', () => {
    const md = '> 系统承担复杂性。\n\n在 `mditor` 中写字。';
    const html = convertMarkdownToWechatHtml(md);

    expect(html).toContain('<blockquote style="');
    expect(html).toContain('background-color: #FAF6F0');
    expect(html).toContain('<code style="');
    expect(html).toContain('color: #B45309');
  });

  it('converts fenced code blocks into styled pre card', () => {
    const md = '```typescript\nconsole.log("hello");\n```';
    const html = convertMarkdownToWechatHtml(md);

    expect(html).toContain('<pre style="');
    expect(html).toContain('background-color: #1E1E20');
    expect(html).toContain('font-family:');
  });

  it('copies rich text to clipboard with text/html mime type', async () => {
    const success = await copyWechatHtmlToClipboard('# 测试\n正文内容');
    expect(success).toBe(true);
  });
});
