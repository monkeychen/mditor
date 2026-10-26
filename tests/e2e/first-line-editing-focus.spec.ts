import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('First-line Editing & Single Instance DOM Stability', () => {
  test('ensures editing on the first line preserves cursor position and produces no duplicate content or lower-window jumping', async () => {
    const app = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main.js')],
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // 1. 验证整个页面内绝对只有 1 个 .milkdown 和 1 个 .ProseMirror 实例（杜绝双实例并发挂载）
    const editorCounts = await window.evaluate(() => {
      return {
        containers: document.querySelectorAll('.milkdown-wysiwyg-container').length,
        milkdowns: document.querySelectorAll('.milkdown').length,
        prosemirrors: document.querySelectorAll('.ProseMirror').length,
      };
    });
    expect(editorCounts.containers).toBe(1);
    expect(editorCounts.milkdowns).toBe(1);
    expect(editorCounts.prosemirrors).toBe(1);

    // 2. 定位到第一行标题，点击并在第一行打字
    const firstHeading = window.locator('.ProseMirror h1').first();
    await expect(firstHeading).toBeVisible();
    await firstHeading.click();

    // 在第一行敲击文本
    await window.keyboard.type('【最新】');

    // 3. 验证输入后的内容在第一行标题中就地渲染，绝无焦点跳脱
    await expect(firstHeading).toContainText('【最新】');

    // 4. 严格断言焦点依然牢固停留在第一行（绝不跳到窗口下方）
    const isFocusStillInHeading = await window.evaluate(() => {
      const sel = document.getSelection();
      const h1 = document.querySelector('.ProseMirror h1');
      return h1 ? h1.contains(sel?.anchorNode || null) : false;
    });
    expect(isFocusStillInHeading).toBe(true);

    // 5. 严格断言文档中绝对没有出现重复内容（整篇文档只有一个 h1 标题）
    const h1Count = await window.locator('.ProseMirror h1').count();
    expect(h1Count).toBe(1);

    // 6. 验证在新建空 Tab 下输入 "#" 再输入空格转为 H1 标题时，光标绝不跳到下一行
    const newTabBtn = window.locator('header button[title="新建标签 (Cmd+T)"]');
    await newTabBtn.click();

    const emptyCounts = await window.evaluate(() => {
      return {
        milkdowns: document.querySelectorAll('.milkdown').length,
        prosemirrors: document.querySelectorAll('.ProseMirror').length,
      };
    });
    expect(emptyCounts.milkdowns).toBe(1);
    expect(emptyCounts.prosemirrors).toBe(1);

    // 输入 "#" 再输入空格
    await window.keyboard.type('# ');

    const afterHashSpace = await window.evaluate(() => {
      const h1 = document.querySelector('.ProseMirror h1');
      const sep = document.querySelector('.ProseMirror img.ProseMirror-separator');
      const sel = document.getSelection();
      const h1Rect = h1 ? h1.getBoundingClientRect() : null;
      const sepDisplay = sep ? globalThis.getComputedStyle(sep).display : 'inline';
      return {
        inH1: h1 ? h1.contains(sel?.anchorNode || null) : false,
        h1Height: h1Rect?.height || 0,
        sepDisplay,
      };
    });

    // 断言光标在 H1 内部、ProseMirror-separator 为 inline、且 H1 高度为单行 (< 52px，绝不因断行膨胀为 83px 双行)
    expect(afterHashSpace.inH1).toBe(true);
    expect(afterHashSpace.sepDisplay).toBe('inline');
    expect(afterHashSpace.h1Height).toBeGreaterThan(30);
    expect(afterHashSpace.h1Height).toBeLessThan(52);

    // 继续输入标题文字
    await window.keyboard.type('一级标题内容');
    await expect(window.locator('.ProseMirror h1')).toContainText('一级标题内容');

    // 回车并写第二行正文
    await window.keyboard.press('Enter');
    await window.keyboard.type('这是紧接着的第二行');

    await expect(window.locator('.ProseMirror p').first()).toContainText('这是紧接着的第二行');

    // 7. 验证 Cmd+S 保存快捷键生效
    await app.evaluate(async ({ dialog }) => {
      dialog.showSaveDialog = async () => ({
        canceled: false,
        filePath: '/tmp/mditor-shortcut-save-test.md',
      });
    });
    await window.keyboard.press('Meta+s');
    const toast = window.locator('#app-toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('文档已成功存盘');

    await app.close();
  });
});
