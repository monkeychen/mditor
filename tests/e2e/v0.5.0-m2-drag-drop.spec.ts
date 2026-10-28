import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Workspace File Move & Draggable Tabs E2E (v0.5.0 M2: F33, F34)', () => {
  let tempDir: string;

  test.beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mditor-e2e-v050-m2-'));
    await fs.mkdir(path.join(tempDir, 'subfolder'), { recursive: true });

    await fs.writeFile(
      path.join(tempDir, 'doc-source.md'),
      '# Source Document\n\nContent to be moved.\n',
      'utf-8'
    );
    await fs.writeFile(
      path.join(tempDir, 'subfolder', 'existing.md'),
      '# Existing Doc\n',
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

  test('F34: Tabs can be reordered via drag and drop without content loss or deselection', async () => {
    const app = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main.js')],
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Create 2 additional tabs
    const newTabBtn = window.locator('[data-testid="tab-bar-new-tab-btn"]');
    await expect(newTabBtn).toBeVisible();
    await newTabBtn.click();
    await newTabBtn.click();

    // Now there are at least 3 tabs
    const tabs = window.locator('.tab-item');
    await expect(tabs).toHaveCount(3);

    const firstTabTitle = await tabs.nth(0).innerText();

    // Drag first tab onto last tab
    await window.evaluate(() => {
      const allTabs = document.querySelectorAll('.tab-item');
      if (allTabs.length < 3) return;
      const source = allTabs[0];
      const target = allTabs[2];
      const dataTransfer = new DataTransfer();
      const sourceId = source.getAttribute('data-tab-id') || '';
      dataTransfer.setData('text/plain', sourceId);

      source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer }));
      target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer, clientX: 9999 }));
      target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }));
      source.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer }));
    });

    // After reordering, the first tab is moved
    await expect(async () => {
      const currentFirstTitle = await tabs.nth(0).innerText();
      expect(currentFirstTitle).not.toBe(firstTabTitle);
    }).toPass({ timeout: 4000 });

    // Verify active editor is still functioning
    const editor = window.locator('.milkdown');
    await expect(editor).toBeVisible();

    await app.close();
  });

  test('F33: File tree item can be moved to subfolder and tab path cascades smoothly', async () => {
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

    // 确保侧边栏处于文件树视图
    const filesTab = window.locator('[data-testid="sidebar-tab-files"]');
    await filesTab.click();

    // 检查源文件可见
    const sourceItem = window.locator('[data-testid="file-tree-item-doc-source.md"]').first();
    await expect(sourceItem).toBeVisible({ timeout: 6000 });

    // 点击打开该文件为 Tab
    await sourceItem.click();
    const docTab = window.locator('[data-testid="tab-doc-source.md"]').first();
    await expect(docTab).toBeVisible({ timeout: 5000 });

    // 找到目标目录元素
    const subfolderDir = window.locator('.file-tree-dir', { hasText: 'subfolder' }).first();
    await expect(subfolderDir).toBeVisible();

    // 通过 HTML5 DragEvent 将源文件拖放到目标文件夹
    const srcFilePath = path.join(tempDir, 'doc-source.md');
    await window.evaluate(({ src }) => {
      const source = document.querySelector('[data-testid="file-tree-item-doc-source.md"]');
      const target = document.querySelector('.file-tree-dir');
      if (!source || !target) return;

      const dataTransfer = new DataTransfer();
      dataTransfer.setData(
        'application/json',
        JSON.stringify({ path: src, isDirectory: false, name: 'doc-source.md' })
      );

      source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer }));
      target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer }));
      target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }));
      source.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer }));
    }, { src: srcFilePath });

    // 验证物理磁盘上的文件已移动
    const expectedNewPath = path.join(tempDir, 'subfolder', 'doc-source.md');
    await expect(async () => {
      const exists = await fs.access(expectedNewPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    }).toPass({ timeout: 6000 });

    // 验证旧路径物理文件已不存在
    const oldPathExists = await fs.access(srcFilePath).then(() => true).catch(() => false);
    expect(oldPathExists).toBe(false);

    // 验证 Tab 仍打开且未丢失
    await expect(docTab).toBeVisible();

    await app.close();
  });

  test('F33: Circular containment prevention prevents moving folder into its subfolder', async () => {
    const app = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main.js')],
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // 验证通过 electronAPI 拦截非法循环移动
    const subDir = path.join(tempDir, 'subfolder');
    const result = await window.evaluate(async ({ dir, sub }) => {
      return await (window as any).electronAPI?.moveItem?.(dir, sub);
    }, { dir: tempDir, sub: subDir });

    expect(result?.success).toBe(false);
    expect(result?.error).toMatch(/不能将文件夹移动到其自身或子文件夹中|Cannot move/);

    await app.close();
  });
});
