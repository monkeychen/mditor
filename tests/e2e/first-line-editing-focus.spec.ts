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

    // 6. 验证在新建空 Tab 下在第一行连续编辑的稳定性
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

    // 在新空 Tab 首行打字
    await window.keyboard.type('从第一行开始流畅书写');
    const firstParagraph = window.locator('.ProseMirror p').first();
    await expect(firstParagraph).toContainText('从第一行开始流畅书写');

    // 回车并写第二行
    await window.keyboard.press('Enter');
    await window.keyboard.type('这是紧接着的第二行');

    const paragraphs = window.locator('.ProseMirror p');
    await expect(paragraphs).toHaveCount(2);
    await expect(paragraphs.nth(0)).toContainText('从第一行开始流畅书写');
    await expect(paragraphs.nth(1)).toContainText('这是紧接着的第二行');

    await app.close();
  });
});
