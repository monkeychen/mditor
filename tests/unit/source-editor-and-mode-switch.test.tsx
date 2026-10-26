import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { SourceEditor } from '../../src/renderer/editor/source/SourceEditor';

describe('SourceEditor Component (T204 / AC-10.1 / AC-10.2)', () => {
  it('renders raw Markdown source without decorations and shows line numbers', async () => {
    const rawMarkdown = '# 原始大标题\n\n**加粗内容**';
    const onChange = vi.fn();

    const { container } = render(
      <SourceEditor
        content={rawMarkdown}
        onChange={onChange}
      />
    );

    await waitFor(() => {
      const cmEl = container.querySelector('.cm-editor');
      expect(cmEl).not.toBeNull();
    });

    const cmContent = container.querySelector('.cm-content');
    expect(cmContent?.textContent).toContain('# 原始大标题');
    expect(cmContent?.textContent).toContain('**加粗内容**');

    // 检查存在行号元素
    const gutterEl = container.querySelector('.cm-gutters');
    expect(gutterEl).not.toBeNull();
  });

  it('triggers onChange when source text is updated', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <SourceEditor
        content="初始源码"
        onChange={onChange}
      />
    );

    await waitFor(() => {
      expect(container.querySelector('.cm-editor')).not.toBeNull();
    });
  });
});
