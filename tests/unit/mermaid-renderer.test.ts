import { describe, it, expect } from 'vitest';
import { renderMermaidToSvg } from '../../src/renderer/editor/wysiwyg/mermaid/mermaidRenderer';

describe('Mermaid Renderer (T201 / AC-20.1 / AC-20.3)', () => {
  it('renders valid flowchart text into SVG markup', async () => {
    const code = `graph TD
  A[开始] --> B[结束]`;

    const res = await renderMermaidToSvg('test-chart-1', code);
    expect(res.success).toBe(true);
    expect(res.svg).toBeDefined();
    expect(res.svg).toContain('<svg');
    expect(res.svg).toContain('开始');
    expect(res.error).toBeUndefined();
  });

  it('renders valid sequence diagram into SVG markup', async () => {
    const code = `sequenceDiagram
  Alice->>Bob: Hello Bob
  Bob-->>Alice: Hi Alice`;

    const res = await renderMermaidToSvg('test-chart-2', code);
    expect(res.success).toBe(true);
    expect(res.svg).toContain('<svg');
    expect(res.svg).toContain('Alice');
    expect(res.svg).toContain('Bob');
  });

  it('catches invalid syntax gracefully and returns error message without throwing', async () => {
    // 故意提供破坏性未闭合语法
    const invalidCode = `graph TD
  A[未闭合节点 --->`;

    const res = await renderMermaidToSvg('test-chart-invalid', invalidCode);
    expect(res.success).toBe(false);
    expect(res.svg).toBeUndefined();
    expect(res.error).toBeDefined();
    expect(typeof res.error).toBe('string');
    expect(res.error!.length).toBeGreaterThan(0);
  });
});
