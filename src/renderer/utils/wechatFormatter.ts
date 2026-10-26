export const WECHAT_STYLES = {
  container: 'font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif; font-size: 15px; color: #2B2B2B; line-height: 1.8; letter-spacing: 0.5px; padding: 10px;',
  h1: 'font-size: 22px; font-weight: bold; color: #1D1D1F; margin: 24px 0 12px 0; border-bottom: 2px solid #E58E26; padding-bottom: 6px;',
  h2: 'font-size: 18px; font-weight: bold; color: #1D1D1F; margin: 20px 0 10px 0; border-left: 4px solid #E58E26; padding-left: 10px;',
  h3: 'font-size: 16px; font-weight: bold; color: #27272A; margin: 16px 0 8px 0;',
  h4: 'font-size: 15px; font-weight: bold; color: #3F3F46; margin: 14px 0 6px 0;',
  p: 'margin: 12px 0; text-align: justify;',
  blockquote: 'border-left: 4px solid #E58E26; background-color: #FAF6F0; padding: 10px 14px; margin: 16px 0; color: #555555; font-style: italic; border-radius: 0 4px 4px 0;',
  inlineCode: 'font-family: "SF Mono", Menlo, Consolas, monospace; background-color: #F3F4F6; color: #B45309; padding: 2px 5px; border-radius: 3px; font-size: 0.88em;',
  pre: 'background-color: #1E1E20; color: #E5E7EB; padding: 12px 14px; border-radius: 8px; overflow-x: auto; font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 13px; line-height: 1.6; margin: 16px 0;',
  hr: 'border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;',
  ul: 'margin: 12px 0; padding-left: 20px; list-style-type: disc;',
  ol: 'margin: 12px 0; padding-left: 20px; list-style-type: decimal;',
  li: 'margin: 4px 0;',
  bold: 'font-weight: bold; color: #111827;',
  italic: 'font-style: italic;',
  link: 'color: #D97706; text-decoration: underline; word-break: break-all;',
  img: 'max-width: 100%; height: auto; border-radius: 6px; margin: 12px auto; display: block;',
};

export function renderInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, `<strong style="${WECHAT_STYLES.bold}">$1</strong>`)
    .replace(/__([^_]+)__/g, `<strong style="${WECHAT_STYLES.bold}">$1</strong>`)
    .replace(/\*([^*]+)\*/g, `<em style="${WECHAT_STYLES.italic}">$1</em>`)
    .replace(/_([^_]+)_/g, `<em style="${WECHAT_STYLES.italic}">$1</em>`)
    .replace(/`([^`]+)`/g, `<code style="${WECHAT_STYLES.inlineCode}">$1</code>`)
    .replace(/!\[(.*?)\]\((.*?)\)/g, `<img src="$2" alt="$1" style="${WECHAT_STYLES.img}" />`)
    .replace(/\[(.*?)\]\((.*?)\)/g, `<a href="$2" style="${WECHAT_STYLES.link}">$1</a>`);
}

export function convertMarkdownToWechatHtml(markdown: string): string {
  if (!markdown) return '';

  const lines = markdown.split('\n');
  const result: string[] = [`<section style="${WECHAT_STYLES.container}">`];

  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 围栏代码块
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        result.push(`<pre style="${WECHAT_STYLES.pre}"><code>${codeBuffer.join('\n')}</code></pre>`);
        codeBuffer = [];
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      continue;
    }

    // 列表结束检查
    if (inList && !trimmed.startsWith('- ') && !trimmed.startsWith('* ') && !/^\d+\.\s/.test(trimmed)) {
      result.push(listType === 'ul' ? '</ul>' : '</ol>');
      inList = false;
    }

    // 标题
    if (line.startsWith('# ')) {
      result.push(`<h1 style="${WECHAT_STYLES.h1}">${renderInlineMarkdown(line.slice(2))}</h1>`);
    } else if (line.startsWith('## ')) {
      result.push(`<h2 style="${WECHAT_STYLES.h2}">${renderInlineMarkdown(line.slice(3))}</h2>`);
    } else if (line.startsWith('### ')) {
      result.push(`<h3 style="${WECHAT_STYLES.h3}">${renderInlineMarkdown(line.slice(4))}</h3>`);
    } else if (line.startsWith('#### ')) {
      result.push(`<h4 style="${WECHAT_STYLES.h4}">${renderInlineMarkdown(line.slice(5))}</h4>`);
    } else if (line.startsWith('> ')) {
      result.push(`<blockquote style="${WECHAT_STYLES.blockquote}">${renderInlineMarkdown(line.slice(2))}</blockquote>`);
    } else if (trimmed === '---' || trimmed === '***') {
      result.push(`<hr style="${WECHAT_STYLES.hr}" />`);
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        inList = true;
        listType = 'ul';
        result.push(`<ul style="${WECHAT_STYLES.ul}">`);
      }
      result.push(`<li style="${WECHAT_STYLES.li}">${renderInlineMarkdown(trimmed.slice(2))}</li>`);
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (!inList) {
        inList = true;
        listType = 'ol';
        result.push(`<ol style="${WECHAT_STYLES.ol}">`);
      }
      const itemText = trimmed.replace(/^\d+\.\s/, '');
      result.push(`<li style="${WECHAT_STYLES.li}">${renderInlineMarkdown(itemText)}</li>`);
    } else if (trimmed) {
      result.push(`<p style="${WECHAT_STYLES.p}">${renderInlineMarkdown(line)}</p>`);
    }
  }

  if (inList) {
    result.push(listType === 'ul' ? '</ul>' : '</ol>');
  }

  result.push('</section>');
  return result.join('\n');
}

export async function copyWechatHtmlToClipboard(markdown: string): Promise<boolean> {
  const html = convertMarkdownToWechatHtml(markdown);

  try {
    if (navigator?.clipboard?.write && typeof ClipboardItem !== 'undefined') {
      const htmlBlob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([markdown], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob,
        }),
      ]);
      return true;
    } else if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(html);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
