import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../../src/renderer/App';

describe('App Scaffold (M2 & Dual-Mode)', () => {
  it('renders macOS tabs bar, outline drawer and default WYSIWYG editor, switches to Source editor on toggle', () => {
    const { container } = render(<App />);
    expect(screen.getByText('macOS-Philosophy.md')).toBeInTheDocument();
    expect(screen.getByText('文档大纲')).toBeInTheDocument();

    // 默认即时渲染 (Milkdown WYSIWYG)
    const milkdownElement = container.querySelector('.milkdown-wysiwyg-container');
    expect(milkdownElement).not.toBeNull();

    // 底部状态栏模式按钮与语言徽章
    const toggleBtn = screen.getByTestId('mode-toggle-btn');
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn.textContent).toContain('实时渲染');

    const langBadge = screen.getByTestId('status-language-badge');
    expect(langBadge).toBeInTheDocument();
    expect(langBadge.textContent).toBe('Markdown');

    // 点击切换为源码模式
    fireEvent.click(toggleBtn);

    // 切换后源码模式 (CodeMirror 6)
    const cmElement = container.querySelector('.cm-editor');
    expect(cmElement).not.toBeNull();
    expect(toggleBtn.textContent).toContain('源码模式');
  });
});
