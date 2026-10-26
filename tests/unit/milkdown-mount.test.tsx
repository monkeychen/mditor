import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRef } from 'react';
import { render, waitFor } from '@testing-library/react';
import { MilkdownEditor, MilkdownEditorRef } from '../../src/renderer/editor/wysiwyg/MilkdownEditor';

describe('MilkdownEditor Component (T201)', () => {
  beforeEach(() => {
    // 确保 jsdom 的基本选区 mock
    if (!window.getSelection) {
      window.getSelection = () => ({
        rangeCount: 0,
        getRangeAt: () => null,
        addRange: () => {},
        removeAllRanges: () => {},
      } as any);
    }
  });

  it('renders Milkdown container and parses Markdown into DOM nodes without showing raw delimiters (AC-8.1)', async () => {
    const testMarkdown = `# 主标题\n\n这是**加粗正文**以及*斜体*。\n\n> 引用块内容\n\n- 无序列表项`;
    const onChange = vi.fn();
    const ref = createRef<MilkdownEditorRef>();

    const { container } = render(
      <MilkdownEditor
        initialContent={testMarkdown}
        onChange={onChange}
        ref={ref}
      />
    );

    // 等待 Milkdown 与 ProseMirror 挂载完成
    await waitFor(() => {
      const editorEl = container.querySelector('.ProseMirror');
      expect(editorEl).not.toBeNull();
    }, { timeout: 3000 });

    const editorEl = container.querySelector('.ProseMirror');

    // 检查 H1 节点存在且内容正确
    const h1 = editorEl?.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1?.textContent).toContain('主标题');

    // 检查加粗 strong 节点存在且无 ** 字符露出
    const strong = editorEl?.querySelector('strong');
    expect(strong).not.toBeNull();
    expect(strong?.textContent).toBe('加粗正文');

    // 检查引用 blockquote 节点
    const blockquote = editorEl?.querySelector('blockquote');
    expect(blockquote).not.toBeNull();
    expect(blockquote?.textContent).toContain('引用块内容');

    // 检查列表 ul 节点
    const ul = editorEl?.querySelector('ul');
    expect(ul).not.toBeNull();
    expect(ul?.textContent).toContain('无序列表项');
  });

  it('exposes getMarkdown and setMarkdown via ref', async () => {
    const ref = createRef<MilkdownEditorRef>();
    render(
      <MilkdownEditor
        initialContent="# 初始文档"
        ref={ref}
      />
    );

    await waitFor(() => {
      expect(ref.current).not.toBeNull();
    }, { timeout: 3000 });

    expect(typeof ref.current?.getMarkdown).toBe('function');
    expect(typeof ref.current?.setMarkdown).toBe('function');

    const currentMd = ref.current?.getMarkdown();
    expect(currentMd).toContain('初始文档');
  });
});
