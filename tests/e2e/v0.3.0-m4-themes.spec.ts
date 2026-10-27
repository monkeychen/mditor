import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Theme System E2E (v0.3.0 M4: AC-22.1 ~ AC-22.3)', () => {
  test('verifies hot theme switching across 4 themes, dark mode styles, and persistence across relaunch', async () => {
    // 创建独立的临时 userDataDir，确保首发纯净环境与幂等性
    const testUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mditor-theme-test-'));

    // 第一次启动
    const app = await electron.launch({
      args: [
        path.join(__dirname, '../../dist-electron/main.js'),
        `--user-data-dir=${testUserDataDir}`,
      ],
    });

    const page = await app.firstWindow();
    await page.waitForLoadState('domcontentloaded');

    const wysiwygContainer = page.locator('.milkdown-wysiwyg-container');
    await expect(wysiwygContainer).toBeVisible();

    // 1. 验证默认根节点主题为 macos-light
    const rootEl = page.locator('html');
    await expect(rootEl).toHaveAttribute('data-theme', 'macos-light');

    // 2. 验证底部状态栏主题按钮
    const themeBtn = page.locator('[data-testid="theme-toggle-btn"]');
    await expect(themeBtn).toBeVisible();
    await expect(themeBtn).toContainText('macOS Light');

    // 3. 点击弹出主题选择气泡
    await themeBtn.click();
    const popover = page.locator('[data-testid="theme-selector-popover"]');
    await expect(popover).toBeVisible();

    // 4. 切换为 Night (暗黑) 主题 (AC-22.1)
    const nightOption = page.locator('[data-testid="theme-option-night"]');
    await expect(nightOption).toBeVisible();
    await nightOption.click();

    // 验证 popover 自动关闭，根节点更新为 data-theme="night"
    await expect(popover).toBeHidden();
    await expect(rootEl).toHaveAttribute('data-theme', 'night');
    await expect(themeBtn).toContainText('Night');

    // 验证编辑器暗黑模式计算样式 (深黑背景 #1E1E1E -> rgb(30, 30, 30))，自动等待 150ms transition 过渡完成
    await expect(wysiwygContainer).toHaveCSS('background-color', 'rgb(30, 30, 30)');

    // 5. 验证双模式下源码模式也同步应用暗黑主题
    const modeBtn = page.locator('[data-testid="mode-toggle-btn"]');
    await modeBtn.click();

    const cmEditor = page.locator('.cm-editor');
    await expect(cmEditor).toBeVisible();
    await expect(cmEditor).toHaveCSS('background-color', 'rgb(30, 30, 30)');

    // 6. 在源码模式下切换为 Newsprint 羊皮纸主题 (AC-22.2)
    await themeBtn.click();
    await expect(popover).toBeVisible();
    const newsprintOption = page.locator('[data-testid="theme-option-newsprint"]');
    await newsprintOption.click();

    await expect(rootEl).toHaveAttribute('data-theme', 'newsprint');
    await expect(themeBtn).toContainText('Newsprint');

    // 验证 Newsprint 暖黄色背景 (#F6F3ED -> rgb(246, 243, 237))
    await expect(cmEditor).toHaveCSS('background-color', 'rgb(246, 243, 237)');

    // 切回所见即所得模式
    await modeBtn.click();
    await expect(wysiwygContainer).toBeVisible();

    // 关闭应用
    await app.close();

    // 7. 第二次重启应用：指向同一独立 userDataDir 验证持久化记忆 (AC-22.3)
    const relaunchedApp = await electron.launch({
      args: [
        path.join(__dirname, '../../dist-electron/main.js'),
        `--user-data-dir=${testUserDataDir}`,
      ],
    });

    const relaunchedPage = await relaunchedApp.firstWindow();
    await relaunchedPage.waitForLoadState('domcontentloaded');

    // 验证重新启动后继承了 Newsprint 主题
    const relaunchedRoot = relaunchedPage.locator('html');
    await expect(relaunchedRoot).toHaveAttribute('data-theme', 'newsprint');
    const relaunchedThemeBtn = relaunchedPage.locator('[data-testid="theme-toggle-btn"]');
    await expect(relaunchedThemeBtn).toContainText('Newsprint');

    await relaunchedApp.close();

    // 清理临时测试目录
    try {
      fs.rmSync(testUserDataDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });
});
