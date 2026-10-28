import { convertMarkdownToWechatHtml } from './wechatFormatter';
import type { PdfExportOptions } from '../../types';

export function generateStandaloneHtml(title: string, markdown: string): string {
  const bodyContent = convertMarkdownToWechatHtml(markdown);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'mditor Document'}</title>
  <style>
    :root {
      --bg: #FAF8F5;
      --text: #1D1D1F;
      --accent: #E58E26;
    }
    body {
      margin: 0;
      padding: 40px 20px;
      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Helvetica Neue", sans-serif;
      -webkit-font-smoothing: antialiased;
      line-height: 1.8;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #FFFFFF;
      padding: 48px 56px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(0, 0, 0, 0.06);
    }
    @media print {
      body {
        background: #FFFFFF;
        padding: 0;
      }
      .container {
        box-shadow: none;
        border: none;
        padding: 0;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    ${bodyContent}
  </div>
</body>
</html>`;
}

export function generatePrintHtml(
  title: string,
  markdown: string,
  options?: PdfExportOptions
): string {
  const bodyContent = convertMarkdownToWechatHtml(markdown);
  const pageSize = options?.pageSize || 'A4';
  const marginPreset = options?.marginPreset || 'standard';

  let marginCss = '20mm 15mm';
  if (marginPreset === 'narrow') {
    marginCss = '10mm 10mm';
  } else if (marginPreset === 'none') {
    marginCss = '0';
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'mditor Document'}</title>
  <style>
    :root {
      --bg: #FAF8F5;
      --text: #1D1D1F;
      --accent: #E58E26;
    }
    body {
      margin: 0;
      padding: 40px 20px;
      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Helvetica Neue", sans-serif;
      -webkit-font-smoothing: antialiased;
      line-height: 1.8;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #FFFFFF;
      padding: 48px 56px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(0, 0, 0, 0.06);
    }
    @media print {
      @page {
        size: ${pageSize} portrait;
        margin: ${marginCss};
      }
      body {
        background: #FFFFFF !important;
        color: #1D1D1F !important;
        padding: 0 !important;
      }
      .container {
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        max-width: 100% !important;
      }
      /* 防截断控制：严禁代码块、表格、公式、图表、引用与图片在分页处被腰斩 */
      pre, code, .code-block-container,
      table, .tableWrapper,
      .math-block, .katex-display,
      .mermaid-block, svg,
      blockquote, img {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
      /* 防孤行标题：标题元素绝不在页尾孤立出现 */
      h1, h2, h3, h4, h5, h6 {
        break-after: avoid !important;
        page-break-after: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    ${bodyContent}
  </div>
</body>
</html>`;
}

export function getPdfPrintOptions(options?: PdfExportOptions) {
  const pageSize = options?.pageSize || 'A4';
  const marginPreset = options?.marginPreset || 'standard';
  const displayHeaderFooter = options?.displayHeaderFooter ?? true;
  const headerTitle = options?.headerTitle || '';

  let margins: { marginType: 'custom' | 'none'; top?: number; bottom?: number; left?: number; right?: number } = {
    marginType: 'custom',
    top: 0.8,
    bottom: 0.8,
    left: 0.8,
    right: 0.8,
  };

  if (marginPreset === 'narrow') {
    margins = {
      marginType: 'custom',
      top: 0.4,
      bottom: 0.4,
      left: 0.4,
      right: 0.4,
    };
  } else if (marginPreset === 'none') {
    margins = { marginType: 'none' };
  }

  const headerTemplate = `
    <div style="font-size: 9px; width: 100%; text-align: center; color: #8E8E93; font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding-top: 4px;">
      <span>${headerTitle}</span>
    </div>
  `;

  const footerTemplate = `
    <div style="font-size: 9px; width: 100%; text-align: center; color: #8E8E93; font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding-bottom: 4px;">
      <span>第 <span class="pageNumber"></span> 页 / 共 <span class="totalPages"></span> 页</span>
    </div>
  `;

  return {
    pageSize,
    printBackground: true,
    margins,
    displayHeaderFooter,
    headerTemplate: displayHeaderFooter ? headerTemplate : '',
    footerTemplate: displayHeaderFooter ? footerTemplate : '',
  };
}
