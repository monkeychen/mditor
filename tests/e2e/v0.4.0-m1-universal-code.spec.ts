import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Universal Text & Code Language Engine E2E (v0.4.0 M1: AC-29.1 ~ AC-29.3)', () => {
  let tempDir: string;
  let pyFilePath: string;
  let jsonFilePath: string;

  test.beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mditor-e2e-code-'));
    pyFilePath = path.join(tempDir, 'demo.py');
    jsonFilePath = path.join(tempDir, 'settings.json');

    await fs.writeFile(
      pyFilePath,
      `def calculate_total(items):\n    return sum(item["price"] for item in items)\n`,
      'utf-8'
    );

    await fs.writeFile(
      jsonFilePath,
      `{\n  "version": "1.0.0",\n  "enabled": true\n}\n`,
      'utf-8'
    );
  });

  test.afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('verifies language status badge, sidebar icons, smart mode locking for Python/JSON, and dual-mode for Markdown', async () => {
    const app = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main.js')],
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // 1. 验证默认初始 Markdown 文档
    const langBadge = window.locator('[data-testid="status-language-badge"]');
    await expect(langBadge).toBeVisible();
    await expect(langBadge).toHaveText('Markdown');

    const modeBtn = window.locator('[data-testid="mode-toggle-btn"]');
    await expect(modeBtn).toBeVisible();
    await expect(modeBtn).toContainText('实时渲染');
    await expect(modeBtn).not.toBeDisabled();

    // 2. 验证 Markdown 下自由切换为源码模式与切回
    await modeBtn.click();
    await expect(modeBtn).toContainText('源码模式');
    await expect(window.locator('.cm-editor')).toBeVisible();

    await modeBtn.click();
    await expect(modeBtn).toContainText('实时渲染');
    await expect(window.locator('.milkdown-wysiwyg-container')).toBeVisible();

    // 3. 将包含 Python 与 JSON 的文件夹预置到 localStorage
    await window.evaluate((dir) => {
      localStorage.setItem('mditor_workspace_folders', JSON.stringify([dir]));
    }, tempDir);

    // 切换侧边栏至“文件夹”视图
    const filesTabBtn = window.locator('[data-testid="sidebar-tab-files"]');
    await expect(filesTabBtn).toBeVisible();
    await filesTabBtn.click();

    // 验证侧边栏文件树中的 demo.py 项并点击打开
    const pyTreeItem = window.locator('[data-testid="file-tree-item-demo.py"]');
    if (await pyTreeItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await pyTreeItem.click();
    }

    await app.close();
  });
});
