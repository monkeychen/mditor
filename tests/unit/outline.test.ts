import { describe, it, expect } from 'vitest';
import { extractOutline } from '../../src/renderer/utils/outline';

describe('Document Outline Extractor (AC5.1)', () => {
  it('returns empty array when text has no headings', () => {
    const text = 'This is just a regular paragraph with no headings.\nAnother line.';
    const outline = extractOutline(text);
    expect(outline).toEqual([]);
  });

  it('extracts H1 to H6 headings with accurate line numbers and levels', () => {
    const text = `# Main H1
Paragraph 1

## Sub H2
Paragraph 2

### Detail H3
Content`;

    const outline = extractOutline(text);
    expect(outline.length).toBe(3);

    expect(outline[0]).toMatchObject({
      level: 1,
      text: 'Main H1',
      line: 1,
    });
    expect(outline[1]).toMatchObject({
      level: 2,
      text: 'Sub H2',
      line: 4,
    });
    expect(outline[2]).toMatchObject({
      level: 3,
      text: 'Detail H3',
      line: 7,
    });
  });

  it('strips markdown inline styling from heading text', () => {
    const text = '## The **Bold** and *Italic* and `Code`';
    const outline = extractOutline(text);

    expect(outline.length).toBe(1);
    expect(outline[0].text).toBe('The Bold and Italic and Code');
  });

  it('ignores code blocks that contain hash comments', () => {
    const text = `# Real Title

\`\`\`python
# This is a python comment, not a heading
print("hello")
\`\`\`

## Another Real Title`;

    const outline = extractOutline(text);
    expect(outline.length).toBe(2);
    expect(outline[0].text).toBe('Real Title');
    expect(outline[1].text).toBe('Another Real Title');
  });
});
