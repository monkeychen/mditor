import { describe, it, expect } from 'vitest';
import { calculateDocumentStats } from '../../src/renderer/utils/counter';

describe('Document Stats Counter (Typora Word Count Spec - AC-16.3)', () => {
  it('correctly calculates character count, line count, and reading time for empty text', () => {
    const stats = calculateDocumentStats('');
    expect(stats.charCount).toBe(0);
    expect(stats.charCountNoSpaces).toBe(0);
    expect(stats.lineCount).toBe(1);
    expect(stats.wordCount).toBe(0);
    expect(stats.readingTimeMinutes).toBe(0);
  });

  it('correctly calculates chinese and english mixed text stats and reading time', () => {
    // 7 个汉字 ("设计第一性原理") + 3 个英文单词 ("Hello", "mditor", "world") = 10 词
    const text = '设计第一性原理\n\nHello mditor world!';
    const stats = calculateDocumentStats(text);
    expect(stats.lineCount).toBe(3);
    expect(stats.charCount).toBe(text.length);
    expect(stats.charCountNoSpaces).toBe(text.replace(/\s+/g, '').length);
    expect(stats.wordCount).toBe(10);
    expect(stats.readingTimeMinutes).toBe(1);
  });
});
