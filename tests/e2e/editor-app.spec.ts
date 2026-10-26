import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Desktop Electron E2E Flow (M1)', () => {
  test('launches application window and verifies editor live preview container', async () => {
    // 启动打包后的 Electron 主进程
    const app = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main.js')],
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // 验证窗口标题
    const title = await window.title();
    expect(title).toBe('mditor');

    // 验证标题栏存在并显示初始标签文件名
    const tabName = await window.locator('.tab-item:has-text("macOS-Philosophy.md")').isVisible();
    expect(tabName).toBe(true);

    // 验证自动保存指示符存在
    const savedDot = await window.locator('.tab-item span[title="已保存"]').isVisible();
    expect(savedDot).toBe(true);

    // 验证默认以 Milkdown 所见即所得容器呈现
    const milkdownEditor = window.locator('.milkdown-wysiwyg-container');
    await expect(milkdownEditor).toBeVisible();

    // 验证底部状态栏包含模式与 UTF-8
    const footer = window.locator('footer');
    await expect(footer).toContainText('实时渲染');
    await expect(footer).toContainText('UTF-8');

    await app.close();
  });
});
