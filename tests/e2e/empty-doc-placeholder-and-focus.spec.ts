import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Empty Document Visual Affordance & Focus Experience', () => {
  test('creates new empty tab, verifies paper visual boundary, placeholder prompt, auto-focus, and typing behavior', async () => {
    const app = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main.js')],
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // 1. 点击 TabBar 上的「新建标签 (Cmd+T)」按钮新建空白文档
    const newTabBtn = window.locator('header button[title="新建标签 (Cmd+T)"]');
    await expect(newTabBtn).toBeVisible();
    await newTabBtn.click();

    // 2. 验证出现 Untitled.md 标签页
    const activeTab = window.locator('.tab-item:has-text("Untitled.md")');
    await expect(activeTab.first()).toBeVisible();

    // 3. 验证可视工作区与不可编辑区域有明确区分：纸张工作卡片 (.milkdown) 具备独立视觉边界
    const paper = window.locator('.milkdown-wysiwyg-container .milkdown');
    await expect(paper).toBeVisible();

    // 4. 验证首行优雅占位符 (Placeholder)
    const emptyParagraph = window.locator('.ProseMirror p.is-empty');
    await expect(emptyParagraph).toBeVisible();
    await expect(emptyParagraph).toHaveAttribute(
      'data-placeholder',
      '开始书写，或输入 # 创建标题、- 创建列表、| 创建表格...'
    );

    // 5. 验证自动聚焦 (Auto Focus)：ProseMirror 容器应处于聚焦状态
    const isEditorFocused = await window.evaluate(() => {
      const pm = document.querySelector('.ProseMirror') as HTMLElement | null;
      return pm ? document.activeElement === pm || pm.contains(document.activeElement) : false;
    });
    expect(isEditorFocused).toBe(true);

    // 6. 验证打字体验：用户无需在屏幕到处盲点，直接按键盘即可打字
    await window.keyboard.type('# 极速打字体验');

    // 验证占位符在输入内容后立即消失
    await expect(emptyParagraph).toHaveCount(0);

    // 验证标题正常渲染出来
    const heading = window.locator('.ProseMirror h1');
    await expect(heading).toContainText('极速打字体验');

    // 7. 验证全域点击落焦：点击外层空白区域后，光标仍然就位
    const container = window.locator('.milkdown-wysiwyg-container');
    await container.click({ position: { x: 20, y: 300 } });

    const isStillFocused = await window.evaluate(() => {
      const pm = document.querySelector('.ProseMirror') as HTMLElement | null;
      return pm ? document.activeElement === pm || pm.contains(document.activeElement) : false;
    });
    expect(isStillFocused).toBe(true);

    await app.close();
  });
});
