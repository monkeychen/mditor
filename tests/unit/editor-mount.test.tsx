import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Editor from '../../src/renderer/editor/Editor';

describe('CodeMirror 6 Editor Component Mount (AC2.6)', () => {
  it('renders editor container element', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <Editor initialDoc="# Hello Editor" onChange={handleChange} />
    );

    const cmElement = container.querySelector('.cm-editor');
    expect(cmElement).not.toBeNull();
  });
});
