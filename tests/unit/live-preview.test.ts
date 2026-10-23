import { describe, it, expect } from 'vitest';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { computeLiveDecorations, livePreviewPlugin } from '../../src/renderer/editor/livePreview';

describe('Live Preview Engine (AC2.1, AC2.2, AC2.3)', () => {
  it('hides markdown heading symbols and adds class when cursor is elsewhere', () => {
    const text = '# Main Title\nSecond line';
    // 光标放置在第二行 (offset 15)
    const state = EditorState.create({
      doc: text,
      selection: { anchor: 15 },
      extensions: [markdown()],
    });

    const decorations = computeLiveDecorations(state);
    expect(decorations).toBeDefined();

    // 应该在第一行产生 decoration
    let foundHeadingLine = false;
    let foundHiddenPrefix = false;

    const iter = decorations.iter();
    while (iter.value) {
      if (iter.value.spec?.class?.includes('cm-live-h1')) {
        foundHeadingLine = true;
      }
      if (iter.value.spec?.isPrefixHide) {
        foundHiddenPrefix = true;
      }
      iter.next();
    }

    expect(foundHeadingLine).toBe(true);
    expect(foundHiddenPrefix).toBe(true);
  });

  it('keeps markdown heading symbols visible when cursor is on the heading line', () => {
    const text = '# Main Title\nSecond line';
    // 光标放置在第一行内部 (offset 4)
    const state = EditorState.create({
      doc: text,
      selection: { anchor: 4 },
      extensions: [markdown()],
    });

    const decorations = computeLiveDecorations(state);
    let foundHiddenPrefix = false;

    const iter = decorations.iter();
    while (iter.value) {
      if (iter.value.spec?.isPrefixHide) {
        foundHiddenPrefix = true;
      }
      iter.next();
    }

    // 光标在标题行时，禁止隐藏 # 标记
    expect(foundHiddenPrefix).toBe(false);
  });

  it('decorates bold and inline code when cursor is away', () => {
    const text = 'This is **strong** and `code`\nSecond line';
    // 光标在第二行 (offset 35)
    const state = EditorState.create({
      doc: text,
      selection: { anchor: 35 },
      extensions: [markdown()],
    });

    const decorations = computeLiveDecorations(state);
    let foundBold = false;
    let foundCode = false;

    const iter = decorations.iter();
    while (iter.value) {
      if (iter.value.spec?.class?.includes('cm-live-bold')) {
        foundBold = true;
      }
      if (iter.value.spec?.class?.includes('cm-live-inline-code')) {
        foundCode = true;
      }
      iter.next();
    }

    expect(foundBold).toBe(true);
    expect(foundCode).toBe(true);
  });

  it('provides livePreviewPlugin extension', () => {
    expect(livePreviewPlugin).toBeDefined();
  });
});
