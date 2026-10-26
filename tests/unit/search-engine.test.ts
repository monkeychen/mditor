import { describe, it, expect } from 'vitest';
import { findMatches, replaceSingle, replaceAll } from '../../src/renderer/utils/search';

describe('Search & Replace Engine (AC6.1, AC6.2, AC6.3)', () => {
  const sampleText = 'The quick brown fox jumps over the lazy dog. The fox is quick.';

  it('finds all occurrences of query case-insensitively by default', () => {
    const matches = findMatches(sampleText, 'the');
    expect(matches.length).toBe(3);
    expect(matches[0].from).toBe(0);
    expect(matches[0].to).toBe(3);
    expect(matches[1].from).toBe(31);
    expect(matches[2].from).toBe(45);
  });

  it('respects case-sensitivity when enabled', () => {
    const matches = findMatches(sampleText, 'The', true);
    expect(matches.length).toBe(2);
    expect(matches[0].from).toBe(0);
    expect(matches[1].from).toBe(45);
  });

  it('returns empty array when query is empty or not found', () => {
    expect(findMatches(sampleText, '')).toEqual([]);
    expect(findMatches(sampleText, 'elephant')).toEqual([]);
  });

  it('replaces a single occurrence accurately', () => {
    const matches = findMatches(sampleText, 'fox');
    expect(matches.length).toBe(2);

    const replaced = replaceSingle(sampleText, matches[0], 'cat');
    expect(replaced).toBe('The quick brown cat jumps over the lazy dog. The fox is quick.');
  });

  it('replaces all occurrences throughout document', () => {
    const result = replaceAll(sampleText, 'fox', 'wolf');
    expect(result.count).toBe(2);
    expect(result.content).toBe('The quick brown wolf jumps over the lazy dog. The wolf is quick.');
  });
});
