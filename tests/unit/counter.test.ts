import { describe, it, expect } from 'vitest';
import { calculateDocumentStats } from '../../src/renderer/utils/counter';

describe('Document Stats Counter', () => {
  it('correctly calculates character count and line count for empty text', () => {
    const stats = calculateDocumentStats('');
    expect(stats.charCount).toBe(0);
    expect(stats.lineCount).toBe(1);
    expect(stats.wordCount).toBe(0);
  });

  it('correctly calculates chinese and english mixed text stats', () => {
    const text = '# 设计第一性原理\n\nHello mditor world!';
    const stats = calculateDocumentStats(text);
    expect(stats.lineCount).toBe(3);
    expect(stats.charCount).toBe(text.length);
    expect(stats.wordCount).toBeGreaterThan(0);
  });
});
