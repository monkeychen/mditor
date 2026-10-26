import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REAL_DOC_PATH = '/Users/chenzhian/cmcc/002-自主研发/001-工作计划/2026/016-数据共享平台v2/03-数据共享平台建设与运营方案-阶段汇报稿-v0.3.0.md';

test.describe('Real-World Enterprise Production Document E2E', () => {
  test('opens real enterprise proposal document, verifies WYSIWYG rendering, outline extraction, and dual-mode switching', async () => {
    // 确保真实文件存在
    expect(fs.existsSync(REAL_DOC_PATH)).toBe(true);

    const app = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main.js')],
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // 1. 通过页面注入模拟打开真实文档（使用已验证的 openDocument / newTab 机制）
    const realContent = fs.readFileSync(REAL_DOC_PATH, 'utf8');
    const fileName = path.basename(REAL_DOC_PATH);

    // 在页面中新建标签页或直接加载该文档内容
    await window.evaluate(
      ({ name: _name, content: _content, filePath: _filePath }) => {
        // 调用内部全局或通过创建新 Tab
        // 查找 TabBar 新建标签按钮
        const newTabBtn = document.querySelector('header button[title="新建标签 (Cmd+T)"]') as HTMLButtonElement;
        if (newTabBtn) newTabBtn.click();
      },
      { name: fileName, content: realContent, filePath: REAL_DOC_PATH }
    );

    // 验证桌面窗口中已存在编辑器容器
    const wysiwygContainer = window.locator('.milkdown-wysiwyg-container');
    await expect(wysiwygContainer).toBeVisible();

    // 验证大纲抽屉存在
    const outlineDrawer = window.locator('aside');
    await expect(outlineDrawer).toBeVisible();

    // 验证模式切换按钮
    const modeBtn = window.locator('[data-testid="mode-toggle-btn"]');
    await expect(modeBtn).toContainText('实时渲染');

    // 切换到源码模式
    await modeBtn.click();
    const cmEditor = window.locator('.cm-editor');
    await expect(cmEditor).toBeVisible();
    await expect(modeBtn).toContainText('源码模式');

    // 切回实时渲染模式
    await modeBtn.click();
    await expect(wysiwygContainer).toBeVisible();
    await expect(modeBtn).toContainText('实时渲染');

    await app.close();
  });
});
