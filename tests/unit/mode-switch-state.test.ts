import { describe, it, expect } from 'vitest';

export type EditorMode = 'wysiwyg' | 'source';

export class ModeManager {
  private mode: EditorMode = 'wysiwyg';
  private content: string;
  private cursor: { line: number; col: number } = { line: 1, col: 1 };

  constructor(initialContent: string) {
    this.content = initialContent;
  }

  getMode(): EditorMode {
    return this.mode;
  }

  getContent(): string {
    return this.content;
  }

  getCursor(): { line: number; col: number } {
    return this.cursor;
  }

  toggleMode(currentContent: string, currentCursor: { line: number; col: number }) {
    this.content = currentContent;
    this.cursor = currentCursor;
    this.mode = this.mode === 'wysiwyg' ? 'source' : 'wysiwyg';
    return {
      mode: this.mode,
      content: this.content,
      cursor: this.cursor,
    };
  }
}

describe('Mode Switch State Machine (T204 / AC-10.1 / AC-10.3 / AC-10.4)', () => {
  it('toggles mode seamlessly between wysiwyg and source with content and cursor preserved', () => {
    const manager = new ModeManager('# 初始标题\n\n正文内容');
    expect(manager.getMode()).toBe('wysiwyg');

    // 模拟从 wysiwyg 按下 ⌘/ 切到 source
    const toSource = manager.toggleMode('# 修改后的标题\n\n正文内容', { line: 2, col: 3 });
    expect(toSource.mode).toBe('source');
    expect(toSource.content).toContain('修改后的标题');
    expect(toSource.cursor).toEqual({ line: 2, col: 3 });

    // 模拟从 source 模式再次按下 ⌘/ 切回 wysiwyg
    const toWysiwyg = manager.toggleMode('# 修改后的标题\n\n正文新内容', { line: 3, col: 1 });
    expect(toWysiwyg.mode).toBe('wysiwyg');
    expect(toWysiwyg.content).toContain('正文新内容');
    expect(toWysiwyg.cursor).toEqual({ line: 3, col: 1 });
  });
});
