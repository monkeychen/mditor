import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Dual-Mode & Real-time WYSIWYG Engine (v0.2.0 M1)', () => {
  test('launches app, defaults to WYSIWYG, and switches seamlessly to source mode via button and shortcut', async () => {
    const app = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main.js')],
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // [E2E-1.1]: 默认进入 WYSIWYG 模式
    const wysiwygContainer = window.locator('.milkdown-wysiwyg-container');
    await expect(wysiwygContainer).toBeVisible();

    const modeBtn = window.locator('[data-testid="mode-toggle-btn"]');
    await expect(modeBtn).toContainText('实时渲染');

    // 验证 ProseMirror 文档结构存在且渲染了 h1 标题
    const h1Heading = wysiwygContainer.locator('h1').first();
    await expect(h1Heading).toBeVisible();
    await expect(h1Heading).toContainText('设计第一性原理与 macOS 手感');

    // [E2E-1.3]: 点击底栏模式切换按钮，切入源码模式
    await modeBtn.click();

    // 验证源码模式（CodeMirror 6）容器与行号显示
    const cmEditor = window.locator('.cm-editor');
    await expect(cmEditor).toBeVisible();
    await expect(modeBtn).toContainText('源码模式');

    const cmGutters = window.locator('.cm-gutters');
    await expect(cmGutters).toBeVisible();

    // [E2E-1.4]: 验证在源码模式下可看到 Markdown 原始符号（如 # 标题）
    const cmContent = window.locator('.cm-content');
    await expect(cmContent).toContainText('# 设计第一性原理与 macOS 手感');

    // 再点击切回即时渲染模式
    await modeBtn.click();
    await expect(wysiwygContainer).toBeVisible();
    await expect(modeBtn).toContainText('实时渲染');

    await app.close();
  });
});
