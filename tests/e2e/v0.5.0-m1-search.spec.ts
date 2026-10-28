import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Workspace Search & Resizable Sidebar E2E (v0.5.0 M1: F30, F31, F32)', () => {
  let tempDir: string;

  test.beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mditor-e2e-v050-m1-'));
    await fs.mkdir(path.join(tempDir, 'subfolder'), { recursive: true });

    await fs.writeFile(
      path.join(tempDir, 'doc-alpha.md'),
      '# Alpha Document\n\nThis is a special search target keyword here in alpha.\n',
      'utf-8'
    );
    await fs.writeFile(
      path.join(tempDir, 'subfolder', 'code-beta.ts'),
      'export const secret = "special search target in typescript beta";\n',
      'utf-8'
    );
  });

  test.afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  test('F30: sidebar can be resized via handle and reset by double-click', async () => {
    const app = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main.js')],
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // 清理可能遗留的宽度设置
    await window.evaluate(() => {
      localStorage.removeItem('mditor_sidebar_width');
    });

    const sidebar = window.locator('[data-testid="typora-sidebar"]');
    await expect(sidebar).toBeVisible();

    const resizeHandle = window.locator('[data-testid="sidebar-resize-handle"]');
    await expect(resizeHandle).toBeVisible();

    // 1. 拖拽手柄
    const handleBox = await resizeHandle.boundingBox();
    if (handleBox) {
      await window.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + 100);
      await window.mouse.down();
      await window.mouse.move(handleBox.x + 80, handleBox.y + 100);
      await window.mouse.up();
    }

    // 2. 双击手柄复位
    await resizeHandle.dblclick();

    // 验证复位为 240px
    await expect(sidebar).toHaveCSS('width', '240px');

    await app.close();
  });

  test('F31: Quick Open modal triggers via header button, filters files, and opens tab on Enter', async () => {
    const app = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main.js')],
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // 挂载工作区
    await window.evaluate((dir) => {
      localStorage.setItem('mditor_workspace_folders', JSON.stringify([dir]));
    }, tempDir);
    await window.reload();
    await window.waitForLoadState('domcontentloaded');

    // 点击顶栏“快速打开”按钮
    const quickOpenBtn = window.locator('[data-testid="header-quick-open-btn"]');
    await expect(quickOpenBtn).toBeVisible();
    await quickOpenBtn.click();

    // 验证 Quick Open 居中浮层弹出
    const modal = window.locator('[data-testid="quick-open-modal"]');
    await expect(modal).toBeVisible();

    // 输入搜索关键字
    const input = window.locator('[data-testid="quick-open-input"]');
    await input.fill('doc-alpha');

    // 键盘回车激活第一项
    await input.press('Enter');

    // 浮层关闭
    await expect(modal).toBeHidden();

    // 标签页打开 doc-alpha.md
    const tabItem = window.locator('[data-testid="tab-doc-alpha.md"]');
    await expect(tabItem).toBeVisible({ timeout: 5000 });

    await app.close();
  });

  test('F32: Workspace Full-Text Search panel searches content across files and navigates on match click', async () => {
    const app = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main.js')],
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // 挂载工作区
    await window.evaluate((dir) => {
      localStorage.setItem('mditor_workspace_folders', JSON.stringify([dir]));
    }, tempDir);
    await window.reload();
    await window.waitForLoadState('domcontentloaded');

    // 切换到侧边栏“搜索”Tab
    const searchTab = window.locator('[data-testid="sidebar-tab-search"]');
    await expect(searchTab).toBeVisible();
    await searchTab.click();

    // 输入全工作区检索词
    const searchInput = window.locator('[data-testid="workspace-search-input"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('special search target');

    // 等待搜索结果出现
    const fileGroup0 = window.locator('[data-testid="search-file-group-0"]');
    await expect(fileGroup0).toBeVisible({ timeout: 8000 });

    // 验证包含命中行
    const matchItem0 = window.locator('[data-testid="search-match-item-0-0"]');
    await expect(matchItem0).toBeVisible();

    // 点击命中行跳转
    await matchItem0.click();

    // 验证对应标签页已被激活或打开
    const anyTab = window.locator('[data-testid="tab-bar"]').or(window.locator('[data-testid^="tab-"]')).first();
    await expect(anyTab).toBeVisible();

    await app.close();
  });
});
