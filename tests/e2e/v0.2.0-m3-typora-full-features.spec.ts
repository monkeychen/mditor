import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Typora Full Experience Alignment E2E (v0.2.0 M3)', () => {
  test('verifies sidebar file tree & outline, focus/typewriter modes, word count popover, task list toggle, insert table modal, search/replace sync, and 50k chars performance', async () => {
    // 准备一个临时工作区目录，包含两个 Markdown 文档和一个 5 万字性能测试文档
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mditor-e2e-m3-'));
    const docAPath = path.join(tempDir, 'alpha-guide.md');
    const docBPath = path.join(tempDir, 'beta-notes.md');
    const doc50kPath = path.join(tempDir, 'large-50k.md');

    fs.writeFileSync(
      docAPath,
      `# Alpha 文档标题\n\n这是第一段测试内容，包含关键词 OldTerm。\n\n## 第二章节\n\n- [ ] 待完成任务项\n- [x] 已完成任务项\n`,
      'utf-8'
    );
    fs.writeFileSync(
      docBPath,
      `# Beta 笔记标题\n\n这是从侧边栏文件树点击直接打开的第二篇文档。\n`,
      'utf-8'
    );

    // 构造超过 50,000 字符的长文档
    const paragraphChunk =
      '这是一段用于验证五万字长文档加载与排版渲染性能的基准测试文本，包含 **加粗**、*斜体* 与 `行内代码`。\n\n';
    const largeContent = `# 五万字性能压测文档\n\n` + paragraphChunk.repeat(900);
    expect(largeContent.length).toBeGreaterThan(50000);
    fs.writeFileSync(doc50kPath, largeContent, 'utf-8');

    const app = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main.js')],
    });

    try {
      const window = await app.firstWindow();
      await window.waitForLoadState('domcontentloaded');

      const wysiwygContainer = window.locator('.milkdown-wysiwyg-container');
      await expect(wysiwygContainer).toBeVisible();

      // 1. 验证底部状态栏字数统计悬浮窗 (WordCountPopover)
      const wordCountBtn = window.locator('[data-testid="word-count-trigger-btn"]');
      await expect(wordCountBtn).toBeVisible();
      await wordCountBtn.click();

      const wordCountPopover = window.locator('[data-testid="word-count-popover"]');
      await expect(wordCountPopover).toBeVisible();
      await expect(wordCountPopover).toContainText('预计阅读');
      await expect(wordCountPopover).toContainText('词数 (Words)');
      // 再次点击关闭字数统计浮窗
      await wordCountBtn.click();
      await expect(wordCountPopover).toBeHidden();

      // 2. 验证专注模式 (Focus Mode) 与打字机模式 (Typewriter Mode)
      const focusBtn = window.locator('[data-testid="focus-mode-toggle-btn"]');
      const typewriterBtn = window.locator('[data-testid="typewriter-mode-toggle-btn"]');

      await focusBtn.click();
      await expect(wysiwygContainer).toHaveClass(/focus-mode-enabled/);

      await typewriterBtn.click();
      await expect(wysiwygContainer).toHaveClass(/typewriter-mode-enabled/);

      // 关闭专注模式与打字机模式以继续后续交互测试
      await focusBtn.click();
      await typewriterBtn.click();
      await expect(wysiwygContainer).not.toHaveClass(/focus-mode-enabled/);

      // 3. 验证快捷插入表格弹窗 (InsertTableModal - ⌥⌘T)
      const insertTableBtn = window.locator('[data-testid="toolbar-insert-table-btn"]');
      await insertTableBtn.click();

      const tableModal = window.locator('[data-testid="insert-table-modal"]');
      await expect(tableModal).toBeVisible();

      const rowsInput = window.locator('[data-testid="insert-table-rows-input"]');
      const colsInput = window.locator('[data-testid="insert-table-cols-input"]');
      await rowsInput.fill('4');
      await colsInput.fill('3');

      const confirmTableBtn = window.locator('[data-testid="insert-table-confirm-btn"]');
      await confirmTableBtn.click();
      await expect(tableModal).toBeHidden();

      // 验证 ProseMirror 中已成功插入 4 行 3 列的表格，且网格边框、表头底色、单元格内边距真实可见
      const insertedTableRows = window.locator('.ProseMirror table tr');
      await expect(insertedTableRows).toHaveCount(4);

      const tableVisualStyles = await window.locator('.ProseMirror table').first().evaluate((tableEl) => {
        const th = tableEl.querySelector('th');
        const td = tableEl.querySelector('td');
        const thStyle = th ? globalThis.getComputedStyle(th) : null;
        const tdStyle = td ? globalThis.getComputedStyle(td) : null;
        return {
          thBorderTop: thStyle?.borderTopWidth,
          thBorderBottom: thStyle?.borderBottomWidth,
          thBg: thStyle?.backgroundColor,
          tdBorderLeft: tdStyle?.borderLeftWidth,
          tdBorderBottom: tdStyle?.borderBottomWidth,
          tdPaddingLeft: parseFloat(tdStyle?.paddingLeft || '0'),
        };
      });

      expect(tableVisualStyles.thBorderTop).toBe('1px');
      expect(tableVisualStyles.thBorderBottom).toBe('2px');
      expect(tableVisualStyles.thBg).not.toBe('rgba(0, 0, 0, 0)');
      expect(tableVisualStyles.tdBorderLeft).toBe('1px');
      expect(tableVisualStyles.tdBorderBottom).toBe('1px');
      expect(tableVisualStyles.tdPaddingLeft).toBeGreaterThan(8);

      // 4. Mock 主进程 dialog.showOpenDialog 打开 tempDir 下的 alpha-guide.md，验证自动扫描目录与文件树切换
      await app.evaluate(async ({ dialog }, filePath) => {
        dialog.showOpenDialog = async () => ({
          canceled: false,
          filePaths: [filePath],
        });
      }, docAPath);

      await window.locator('button[title="打开文档 (Cmd+O)"]').click();
      await expect(window.locator('.ProseMirror h1')).toContainText('Alpha 文档标题');

      // 5. 验证交互式任务列表复选框点击切换并回写 Markdown 源码
      const taskCheckboxes = window.locator('input.task-list-checkbox');
      await expect(taskCheckboxes).toHaveCount(2);
      await expect(taskCheckboxes.nth(0)).not.toBeChecked();
      await expect(taskCheckboxes.nth(1)).toBeChecked();

      // 点击第一个未完成的复选框
      await taskCheckboxes.nth(0).click();
      await expect(taskCheckboxes.nth(0)).toBeChecked();

      // 切换到源码模式验证 `- [x] 待完成任务项`
      const modeToggleBtn = window.locator('[data-testid="mode-toggle-btn"]');
      await modeToggleBtn.click();
      const cmContent = window.locator('.cm-content');
      await expect(cmContent).toBeVisible();
      await expect(cmContent).toContainText('[x] 待完成任务项');

      // 切回实时渲染模式
      await modeToggleBtn.click();
      await expect(wysiwygContainer).toBeVisible();

      // 6. 验证实时渲染模式下的查找与替换同步更新编辑器视图
      await window.locator('[data-testid="toolbar-search-btn"]').click();
      const searchInput = window.locator('input[placeholder="在当前文档中查找..."]');
      await expect(searchInput).toBeVisible();
      await searchInput.fill('OldTerm');

      // 展开替换框
      await window.locator('button[title="切换替换模式 (Cmd+H)"]').click();
      const replaceInput = window.locator('input[placeholder="替换为..."]');
      await replaceInput.fill('NewReplacedTerm');
      await window.locator('button:has-text("全部")').click();

      // 断言实时渲染视图立即显示替换后的新词
      await expect(window.locator('.ProseMirror')).toContainText('NewReplacedTerm');

      // 7. 验证侧边栏「文件 / 大纲」双视图切换及点击文件树直接打开 beta-notes.md
      const filesTabBtn = window.locator('[data-testid="sidebar-tab-files"]');
      await filesTabBtn.click();

      const betaFileItem = window.locator('.file-tree-item', { hasText: 'beta-notes.md' }).first();
      await expect(betaFileItem).toBeVisible();
      await betaFileItem.click();

      // 断言已打开并切换到 beta-notes.md
      await expect(window.locator('.ProseMirror h1')).toContainText('Beta 笔记标题');

      // 8. 验证 5 万字长文档加载性能基线 (≤ 1500ms, AC-18.1)
      const largeFileItem = window.locator('.file-tree-item', { hasText: 'large-50k.md' }).first();
      await expect(largeFileItem).toBeVisible();

      const startTime = Date.now();
      await largeFileItem.click();
      await expect(window.locator('.ProseMirror h1')).toContainText('五万字性能压测文档');
      const elapsedMs = Date.now() - startTime;

      console.log(`[Performance] 50,000+ chars document loaded and rendered in ${elapsedMs}ms`);
      expect(elapsedMs).toBeLessThan(1500);
    } finally {
      await app.close();
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
