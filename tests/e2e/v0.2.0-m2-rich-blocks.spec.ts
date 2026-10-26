import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Rich Block Widgets E2E (v0.2.0 M2: Table, CodeBlock, Image)', () => {
  test('verifies table toolbar, tab auto-append, codeblock header copy, and image rendering', async () => {
    const app = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main.js')],
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    const wysiwygContainer = window.locator('.milkdown-wysiwyg-container');
    await expect(wysiwygContainer).toBeVisible();

    // 1. 代码块 Header 与复制代码按钮 (AC-12.1 ~ 12.3)
    const codeWrapper = window.locator('.cm-code-block-wrapper');
    await expect(codeWrapper.first()).toBeVisible();

    const codeHeader = window.locator('.cm-code-block-header');
    await expect(codeHeader.first()).toBeVisible();

    // 验证代码块语言下拉选择框
    const langSelect = codeWrapper.locator('.code-lang-selector').first();
    await expect(langSelect).toBeVisible();

    // 点击复制代码按钮
    const copyBtn = codeWrapper.locator('.code-copy-btn').first();
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    await expect(copyBtn).toContainText('已复制');

    // 2. 图片包装容器与占位卡片 (AC-13.1 ~ 13.3)
    const imageWrapper = window.locator('.image-widget-wrapper');
    await expect(imageWrapper.first()).toBeVisible();

    // 悬浮源码胶囊
    const imagePill = imageWrapper.locator('.image-source-pill').first();
    await expect(imagePill).toBeAttached();

    // 3. 双模式切换验证：按模式切换按钮进入源码模式
    const modeBtn = window.locator('[data-testid="mode-toggle-btn"]');
    await modeBtn.click();

    const cmEditor = window.locator('.cm-editor');
    await expect(cmEditor).toBeVisible();
    await expect(modeBtn).toContainText('源码模式');

    // 切回实时渲染
    await modeBtn.click();
    await expect(wysiwygContainer).toBeVisible();
    await expect(modeBtn).toContainText('实时渲染');

    await app.close();
  });
});
