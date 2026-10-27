import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../../src/renderer/App';

describe('Dual-tier Header & Document Toolbar (F26 / T261)', () => {
  it('renders Tier 1 Window Header with sidebar toggle and tab bar, separating editing tools into Tier 2 Document Toolbar', () => {
    const { container } = render(<App />);

    // 1. 第一层 Window Header 校验
    const header = container.querySelector('header');
    expect(header).not.toBeNull();

    // 侧边栏开关位于顶栏左侧
    const sidebarToggleBtn = screen.getByTestId('sidebar-toggle-btn');
    expect(sidebarToggleBtn).toBeInTheDocument();
    expect(header?.contains(sidebarToggleBtn)).toBe(true);

    // TabBar 位于顶栏中间
    const tabBar = screen.getByTestId('tab-bar-container');
    expect(tabBar).toBeInTheDocument();
    expect(header?.contains(tabBar)).toBe(true);

    // 工具栏显隐开关位于顶栏右侧
    const toolbarToggleBtn = screen.getByTestId('toolbar-toggle-btn');
    expect(toolbarToggleBtn).toBeInTheDocument();
    expect(header?.contains(toolbarToggleBtn)).toBe(true);

    // 底部状态栏依然保留模式切换
    const modeToggleBtn = screen.getByTestId('mode-toggle-btn');
    expect(modeToggleBtn).toBeInTheDocument();

    // 核心隔离断言：正文排版按钮绝不在第一层 Header 中
    const insertTableBtn = screen.getByTestId('toolbar-insert-table-btn');
    expect(header?.contains(insertTableBtn)).toBe(false);

    // 2. 第二层 Document Toolbar 校验
    const docToolbar = screen.getByTestId('document-toolbar');
    expect(docToolbar).toBeInTheDocument();
    expect(docToolbar.contains(insertTableBtn)).toBe(true);

    // 独立公式块、行内公式、主题、搜索等排版工具归属第二层
    const mathBlockBtn = screen.getByTestId('toolbar-insert-math-block-btn');
    const inlineMathBtn = screen.getByTestId('toolbar-insert-math-btn');
    const themeBtn = screen.getByTestId('toolbar-theme-btn');
    const searchBtn = screen.getByTestId('toolbar-search-btn');

    expect(docToolbar.contains(mathBlockBtn)).toBe(true);
    expect(docToolbar.contains(inlineMathBtn)).toBe(true);
    expect(docToolbar.contains(themeBtn)).toBe(true);
    expect(docToolbar.contains(searchBtn)).toBe(true);
  });

  it('supports collapsing and expanding Document Toolbar via button and shortcut (Cmd+Shift+T)', () => {
    render(<App />);

    const docToolbar = screen.getByTestId('document-toolbar');
    const toolbarToggleBtn = screen.getByTestId('toolbar-toggle-btn');

    // 初始状态为展开态
    expect(docToolbar.className).not.toContain('toolbar-collapsed');

    // 点击顶栏切换按钮收起工具栏
    fireEvent.click(toolbarToggleBtn);
    expect(docToolbar.className).toContain('toolbar-collapsed');

    // 再次点击展开
    fireEvent.click(toolbarToggleBtn);
    expect(docToolbar.className).not.toContain('toolbar-collapsed');

    // 按下快捷键 Cmd+Shift+T 收起
    fireEvent.keyDown(window, { key: 'T', shiftKey: true, metaKey: true });
    expect(docToolbar.className).toContain('toolbar-collapsed');

    // 再次按下快捷键 Cmd+Shift+T 展开
    fireEvent.keyDown(window, { key: 'T', shiftKey: true, metaKey: true });
    expect(docToolbar.className).not.toContain('toolbar-collapsed');
  });

  it('supports toggling left sidebar via top-left PanelLeft button and shortcut (Cmd+Shift+O)', () => {
    render(<App />);

    const sidebarToggleBtn = screen.getByTestId('sidebar-toggle-btn');
    const sidebar = screen.getByTestId('typora-sidebar');

    // 初始状态默认为展开 (isOpen = true)
    expect(sidebar.className).toContain('w-60');

    // 点击左侧开关收起侧边栏
    fireEvent.click(sidebarToggleBtn);
    expect(sidebar.className).toContain('w-0');

    // 再次点击展开
    fireEvent.click(sidebarToggleBtn);
    expect(sidebar.className).toContain('w-60');

    // 快捷键 Cmd+Shift+O 切换
    fireEvent.keyDown(window, { key: 'O', shiftKey: true, metaKey: true });
    expect(sidebar.className).toContain('w-0');
  });
});
