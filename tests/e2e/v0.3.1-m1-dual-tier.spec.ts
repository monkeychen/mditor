import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Dual-tier Header & Folding Toolbar E2E (v0.3.1 M1: AC-26.1 ~ AC-26.4)', () => {
  test('verifies Tier 1 window header, full-width tab bar, Tier 2 document toolbar, and folding animation', async () => {
    const app = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main.js')],
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // 1. 验证第一层 Window Header
    const header = window.locator('header');
    await expect(header).toBeVisible();

    // 验证顶栏左侧原生侧边栏开关 (PanelLeft)
    const sidebarToggleBtn = header.locator('[data-testid="sidebar-toggle-btn"]');
    await expect(sidebarToggleBtn).toBeVisible();

    // 验证 TabBar 全宽容器处于 Header 中间
    const tabBar = header.locator('[data-testid="tab-bar-container"]');
    await expect(tabBar).toBeVisible();

    // 验证顶栏右侧仅保留工具栏切换按钮，不含内容编辑按钮
    const toolbarToggleBtn = header.locator('[data-testid="toolbar-toggle-btn"]');
    await expect(toolbarToggleBtn).toBeVisible();

    const insertTableInHeader = header.locator('[data-testid="toolbar-insert-table-btn"]');
    await expect(insertTableInHeader).toHaveCount(0);

    // 2. 验证第二层 Document Toolbar 处于独立行，并承载正文排版工具
    const docToolbar = window.locator('[data-testid="document-toolbar"]');
    await expect(docToolbar).toBeVisible();

    const insertTableBtn = docToolbar.locator('[data-testid="toolbar-insert-table-btn"]');
    await expect(insertTableBtn).toBeVisible();

    const mathBlockBtn = docToolbar.locator('[data-testid="toolbar-insert-math-block-btn"]');
    await expect(mathBlockBtn).toBeVisible();

    const inlineMathBtn = docToolbar.locator('[data-testid="toolbar-insert-math-btn"]');
    await expect(inlineMathBtn).toBeVisible();

    const themeBtn = docToolbar.locator('[data-testid="toolbar-theme-btn"]');
    await expect(themeBtn).toBeVisible();

    const searchBtn = docToolbar.locator('[data-testid="toolbar-search-btn"]');
    await expect(searchBtn).toBeVisible();

    // 3. 测试工具栏折叠交互 (点击工具栏右侧「收起」按钮)
    const collapseBtn = docToolbar.locator('[data-testid="toolbar-collapse-btn"]');
    await expect(collapseBtn).toBeVisible();
    await collapseBtn.click();

    // 验证工具栏折叠后带有 toolbar-collapsed 样式类
    await expect(docToolbar).toHaveClass(/toolbar-collapsed/);

    // 4. 通过顶栏工具栏切换按钮重新展开
    await toolbarToggleBtn.click();
    await expect(docToolbar).toHaveClass(/toolbar-expanded/);
    await expect(docToolbar).not.toHaveClass(/toolbar-collapsed/);

    // 5. 验证快捷键 Cmd+Shift+T 折叠与展开联动
    await window.keyboard.press('Meta+Shift+T');
    await expect(docToolbar).toHaveClass(/toolbar-collapsed/);

    await window.keyboard.press('Meta+Shift+T');
    await expect(docToolbar).toHaveClass(/toolbar-expanded/);

    // 6. 验证顶栏左侧侧边栏开关与双视图联动
    const sidebar = window.locator('[data-testid="typora-sidebar"]');
    await expect(sidebar).toBeVisible();

    // 点击顶栏左侧按钮收起侧边栏
    await sidebarToggleBtn.click();
    await expect(sidebar).toHaveClass(/w-0/);

    // 再次点击展开侧边栏
    await sidebarToggleBtn.click();
    await expect(sidebar).toHaveClass(/w-60/);

    // 验证侧边栏双视图页签「文件」与「大纲」就位
    const tabFiles = sidebar.locator('[data-testid="sidebar-tab-files"]');
    const tabOutline = sidebar.locator('[data-testid="sidebar-tab-outline"]');
    await expect(tabFiles).toBeVisible();
    await expect(tabOutline).toBeVisible();

    await app.close();
  });
});
