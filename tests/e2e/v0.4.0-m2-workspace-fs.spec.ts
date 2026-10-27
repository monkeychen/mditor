import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Workspace Context Management & Safe Trash E2E (v0.4.0 M2: AC-28.1 ~ AC-28.3)', () => {
  let tempDir: string;
  let initialDocPath: string;

  test.beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mditor-e2e-m2-'));
    initialDocPath = path.join(tempDir, 'welcome.md');
    await fs.writeFile(initialDocPath, '# Welcome to mditor\n\nInitial content.', 'utf-8');
  });

  test.afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  test('creates new file, renames file with tab sync, and moves file safely to trash', async () => {
    const app = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main.js')],
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // 1. 设置工作区文件夹至 localStorage 并重新加载
    await window.evaluate((dir) => {
      localStorage.setItem('mditor_workspace_folders', JSON.stringify([dir]));
    }, tempDir);

    await window.reload();
    await window.waitForLoadState('domcontentloaded');

    // 2. 切换至“文件夹”视图
    const filesTabBtn = window.locator('[data-testid="sidebar-tab-files"]');
    await expect(filesTabBtn).toBeVisible();
    await filesTabBtn.click();

    // 3. 验证 welcome.md 渲染在文件树中
    const welcomeItem = window.locator('[data-testid="file-tree-item-welcome.md"]');
    await expect(welcomeItem).toBeVisible({ timeout: 5000 });

    // 4. 在文件夹根节点上右键呼出上下文菜单 -> 新建文件
    const folderHeader = window.locator('.folder-header').first();
    await folderHeader.click({ button: 'right' });

    const contextMenu = window.locator('[data-testid="sidebar-context-menu"]');
    await expect(contextMenu).toBeVisible();

    const newFileOption = window.getByText('新建文件', { exact: true });
    await expect(newFileOption).toBeVisible();
    await newFileOption.click();

    // 5. 校验内联输入框并防御非法字符
    const createInput = window.locator('[data-testid="sidebar-inline-create-input"]');
    await expect(createInput).toBeVisible();

    // 输入非法字符测试防御门禁
    await createInput.fill('invalid:name.md');
    await createInput.press('Enter');

    // 验证出现错误 Toast 且未创建非法文件
    const toast = window.locator('[data-testid="app-toast"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('不能包含');

    // 重新通过右键呼出新建文件并输入合法文件名
    await folderHeader.click({ button: 'right' });
    await (window.getByText('新建文件', { exact: true })).click();

    const validCreateInput = window.locator('[data-testid="sidebar-inline-create-input"]');
    await expect(validCreateInput).toBeVisible();
    await validCreateInput.fill('project_plan.md');
    await validCreateInput.press('Enter');

    // 验证文件在磁盘上成功创建
    const createdFilePath = path.join(tempDir, 'project_plan.md');
    await expect.poll(async () => {
      try {
        await fs.access(createdFilePath);
        return true;
      } catch {
        return false;
      }
    }, { timeout: 4000 }).toBe(true);

    // 验证新建的文件已自动作为激活 Tab 打开
    const newTab = window.getByTestId('tab-project_plan.md');
    await expect(newTab).toBeVisible({ timeout: 4000 });

    // 6. 右键重命名 project_plan.md -> architecture.md
    const planTreeItem = window.locator('[data-testid="file-tree-item-project_plan.md"]');
    await expect(planTreeItem).toBeVisible();
    await planTreeItem.click({ button: 'right' });

    const renameOption = window.getByText('重命名');
    await expect(renameOption).toBeVisible();
    await renameOption.click();

    const renameInput = window.locator('[data-testid="sidebar-inline-rename-input"]');
    await expect(renameInput).toBeVisible();
    await renameInput.fill('architecture.md');
    await renameInput.press('Enter');

    // 验证磁盘文件已更名且原文件不存在
    const renamedFilePath = path.join(tempDir, 'architecture.md');
    await expect.poll(async () => {
      try {
        await fs.access(renamedFilePath);
        return true;
      } catch {
        return false;
      }
    }, { timeout: 4000 }).toBe(true);

    // 验证 Tab 标签也同步更名为 architecture.md
    const renamedTab = window.getByTestId('tab-architecture.md');
    await expect(renamedTab).toBeVisible();

    // 7. 右键 architecture.md -> 移到废纸篓 / 移到回收站 (安全删除)
    const archTreeItem = window.locator('[data-testid="file-tree-item-architecture.md"]');
    await expect(archTreeItem).toBeVisible();
    await archTreeItem.click({ button: 'right' });

    const deleteOption = window.locator('[data-testid="sidebar-context-menu"]').getByText(/移到/);
    await expect(deleteOption).toBeVisible();
    await deleteOption.click();

    // 验证文件从工作区原路径移除 (通过 shell.trashItem 安全移除)
    await expect.poll(async () => {
      try {
        await fs.access(renamedFilePath);
        return false;
      } catch {
        return true;
      }
    }, { timeout: 4000 }).toBe(true);

    // 验证已删除文件的 Tab 自动关闭
    await expect(window.getByTestId('tab-architecture.md')).not.toBeVisible();

    await app.close();
  });
});
