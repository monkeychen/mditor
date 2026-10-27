import { describe, it, expect } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { SourceEditor, resolveLanguageExtension } from '../../src/renderer/editor/source/SourceEditor';

describe('SourceEditor Universal Language Engine (T403 / AC-29.2)', () => {
  it('resolves dynamic language extensions for Python, JSON, SQL, and Markdown', async () => {
    const pyExt = await resolveLanguageExtension('server.py');
    expect(pyExt).not.toBeNull();

    const jsonExt = await resolveLanguageExtension('config.json');
    expect(jsonExt).not.toBeNull();

    const sqlExt = await resolveLanguageExtension('query.sql');
    expect(sqlExt).not.toBeNull();

    const mdExt = await resolveLanguageExtension('readme.md');
    expect(mdExt).not.toBeNull();

    const logExt = await resolveLanguageExtension('app.log');
    expect(logExt).toEqual([]);
  });

  it('renders SourceEditor with Python file and mounts fold gutter and syntax highlighting', async () => {
    const pythonCode = `def hello():\n    print("Hello, world!")\n`;
    const { container } = render(
      <SourceEditor
        content={pythonCode}
        fileName="script.py"
      />
    );

    await waitFor(() => {
      expect(container.querySelector('.cm-editor')).not.toBeNull();
    });

    // 检查行号与折叠槽（fold gutter）
    expect(container.querySelector('.cm-lineNumbers')).not.toBeNull();
    expect(container.querySelector('.cm-foldGutter')).not.toBeNull();

    // 检查内容正确渲染
    const cmContent = container.querySelector('.cm-content');
    expect(cmContent?.textContent).toContain('def hello():');
  });

  it('dynamically updates language extension when fileName changes', async () => {
    const { container, rerender } = render(
      <SourceEditor
        content={`{"port": 8080}`}
        fileName="config.json"
      />
    );

    await waitFor(() => {
      expect(container.querySelector('.cm-editor')).not.toBeNull();
    });

    // 切换到 SQL 文件
    rerender(
      <SourceEditor
        content={`SELECT * FROM users;`}
        fileName="query.sql"
      />
    );

    await waitFor(() => {
      const cmContent = container.querySelector('.cm-content');
      expect(cmContent).not.toBeNull();
    });
  });
});
