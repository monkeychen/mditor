import katex from 'katex';

/**
 * 安全渲染 LaTeX 数学公式为 HTML 字符串
 * @param latex LaTeX 表达式
 * @param isBlock 是否为独立块级展示模式（displayMode）
 * @returns 渲染生成的 HTML 字符串
 */
export function renderMathToString(latex: string, isBlock = false): string {
  const trimmed = latex.trim();
  if (!trimmed) {
    return '';
  }

  try {
    return katex.renderToString(trimmed, {
      displayMode: isBlock,
      throwOnError: false,
      output: 'htmlAndMathml',
    });
  } catch (err) {
    console.warn('[KaTeX] Failed to render latex:', err);
    // 语法错误时返回防爆盾容器，绝不崩溃
    const escaped = trimmed
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<span class="katex-error text-red-500 font-mono text-xs" title="公式语法错误">${escaped}</span>`;
  }
}
