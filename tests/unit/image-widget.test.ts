import { describe, it, expect } from 'vitest';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { computeLiveDecorations } from '../../src/renderer/editor/livePreview';

describe('Live Preview Image Widget (AC4.3)', () => {
  it('renders ImageWidget replacement when cursor is on another line', () => {
    const text = '![Preview](./assets/img-demo.png)\nAnother line';
    // 光标放置在第 2 行 (offset 40)
    const state = EditorState.create({
      doc: text,
      selection: { anchor: 40 },
      extensions: [markdown()],
    });

    const decorations = computeLiveDecorations(state);
    let foundImageWidget = false;

    const iter = decorations.iter();
    while (iter.value) {
      if (iter.value.spec?.widget && iter.value.spec?.widget.constructor.name === 'ImageWidget') {
        foundImageWidget = true;
      }
      iter.next();
    }

    expect(foundImageWidget).toBe(true);
  });

  it('keeps raw markdown syntax when cursor is on the image line', () => {
    const text = '![Preview](./assets/img-demo.png)\nAnother line';
    // 光标放置在第 1 行内部 (offset 5)
    const state = EditorState.create({
      doc: text,
      selection: { anchor: 5 },
      extensions: [markdown()],
    });

    const decorations = computeLiveDecorations(state);
    let foundImageWidget = false;

    const iter = decorations.iter();
    while (iter.value) {
      if (iter.value.spec?.widget && iter.value.spec?.widget.constructor.name === 'ImageWidget') {
        foundImageWidget = true;
      }
      iter.next();
    }

    // 光标在该行时不替换为 widget
    expect(foundImageWidget).toBe(false);
  });
});
