import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Desktop Electron E2E Flow (M3: Search, Code Block & Export)', () => {
  test('verifies search panel, code block copy, and wechat rich text export', async () => {
    // 启动打包后的 Electron 主进程
    const app = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main.js')],
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // 1. 点击查找按钮，打开悬浮搜索栏
    const searchBtn = window.locator('header button[title="查找与替换 (Cmd+F)"]');
    await searchBtn.click();

    const searchInput = window.locator('input[placeholder="在当前文档中查找..."]');
    await expect(searchInput).toBeVisible();

    // 输入搜索关键词并验证匹配计数
    await searchInput.fill('体验');
    const counter = window.locator('span:has-text("1 /")');
    await expect(counter).toBeVisible();

    // 点击切换替换模式按钮
    const toggleReplaceBtn = window.locator('button[title="切换替换模式 (Cmd+H)"]');
    await toggleReplaceBtn.click();
    const replaceInput = window.locator('input[placeholder="替换为..."]');
    await expect(replaceInput).toBeVisible();

    // 关闭搜索栏
    const closeSearchBtn = window.locator('button[title="关闭 (Esc)"]');
    await closeSearchBtn.click();
    await expect(searchInput).not.toBeVisible();

    // 2. 验证排版中代码块正常渲染 (AC2.5)
    const codeBlock = window.locator('.milkdown-wysiwyg-container pre');
    await expect(codeBlock.first()).toBeVisible();
    await expect(codeBlock.first()).toContainText('interface EditorConfig');

    // 3. 验证导出菜单与一键公众号排版 (AC7.3)
    const exportBtn = window.locator('header button[title="导出 / 分享"]');
    await exportBtn.click();

    const wechatOption = window.getByText('复制为公众号/知乎排版', { exact: true });
    await expect(wechatOption).toBeVisible();

    await wechatOption.click();

    // 验证弹出 Toast 提示
    const toast = window.locator('#app-toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('已复制为公众号/知乎排版');

    await app.close();
  });
});
