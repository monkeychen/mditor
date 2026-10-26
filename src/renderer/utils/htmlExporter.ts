import { convertMarkdownToWechatHtml } from './wechatFormatter';

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
