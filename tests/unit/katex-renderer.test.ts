import { describe, it, expect } from 'vitest';
import { renderMathToString } from '../../src/renderer/editor/wysiwyg/math/katexRenderer';

describe('KaTeX Renderer Utility (T101 / AC-19.1)', () => {
  it('renders inline math to KaTeX HTML string', () => {
    const html = renderMathToString('E = mc^2', false);
    expect(html).toContain('class="katex"');
    expect(html).toContain('katex-html');
    expect(html).toContain('E');
    expect(html).toContain('m');
  });

  it('renders block-level math in display mode', () => {
    const html = renderMathToString('\\int_{0}^{1} x dx', true);
    expect(html).toContain('class="katex-display"');
    expect(html).toContain('class="katex"');
  });

  it('handles invalid LaTeX gracefully without throwing exceptions', () => {
    expect(() => {
      const html = renderMathToString('\\frac{1}{', false);
      expect(html).toBeDefined();
    }).not.toThrow();
  });

  it('handles empty input gracefully', () => {
    const html = renderMathToString('', false);
    expect(html).toBe('');
  });
});
