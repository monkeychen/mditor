import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('KaTeX Math System E2E (v0.3.0 M1: AC-19.1 ~ AC-19.3)', () => {
  test('verifies inline math rendering, inline editing, block math drawer, and mode toggle', async () => {
    const app = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main.js')],
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    const wysiwygContainer = window.locator('.milkdown-wysiwyg-container');
    await expect(wysiwygContainer).toBeVisible();

    // 1. 验证工具栏「插入数学公式」按钮存在并可点击
    const insertMathBtn = window.locator('[data-testid="toolbar-insert-math-btn"]');
    await expect(insertMathBtn).toBeVisible();
    await insertMathBtn.click();

    // 2. 验证行内公式节点已生成并包含 KaTeX 渲染矢量元素
    const inlineMath = window.locator('.inline-math-wrapper').first();
    await expect(inlineMath).toBeVisible();

    const inlineKatex = inlineMath.locator('.katex');
    await expect(inlineKatex).toBeVisible();

    // 3. 点击行内公式预览区域进入原地编辑状态
    const previewEl = inlineMath.locator('.inline-math-preview');
    await previewEl.click();

    const editorEl = inlineMath.locator('.inline-math-editor');
    await expect(editorEl).toBeVisible();

    const inputEl = inlineMath.locator('.inline-math-input');
    await expect(inputEl).toBeFocused();

    // 修改公式内容为 E=mc^2 并按 Enter 退出保存
    await inputEl.fill('E=mc^2');
    await inputEl.press('Enter');

    // 验证编辑框隐藏，KaTeX 重新渲染且包含新内容
    await expect(editorEl).toBeHidden();
    await expect(inlineMath.locator('.katex-html')).toBeVisible();

    // 4. 新建标签页并在空白文档中输入 $$ + 回车直接创建独立公式块
    const newTabBtn = window.locator('button[title="新建标签 (Cmd+T)"]');
    await newTabBtn.click();

    // 验证新文档就绪
    await expect(window.locator('.tab-item:has-text("Untitled.md")').first()).toBeVisible();

    // 输入 $$ 并按 Enter
    await window.keyboard.type('$$');
    await window.keyboard.press('Enter');

    // 验证生成独立公式块 .math-block-wrapper
    const mathBlock = window.locator('.math-block-wrapper').first();
    await expect(mathBlock).toBeVisible();

    // 点击公式块卡片展开编辑抽屉
    const blockCard = mathBlock.locator('.math-block-card');
    await blockCard.click();

    const drawer = mathBlock.locator('.math-block-drawer');
    await expect(drawer).toBeVisible();

    const textarea = drawer.locator('textarea');
    await expect(textarea).toBeFocused();
    await textarea.fill('\\int_0^1 x^2 dx = \\frac{1}{3}');

    // 验证实时重绘
    const displayKatex = mathBlock.locator('.katex-display');
    await expect(displayKatex).toBeVisible();

    // 点击收起按钮
    const closeBtn = drawer.locator('button', { hasText: '收起' });
    await closeBtn.click();
    await expect(drawer).toBeHidden();

    // 5. 源码模式双向验证 (⌘/)
    const modeBtn = window.locator('[data-testid="mode-toggle-btn"]');
    await modeBtn.click();

    const cmEditor = window.locator('.cm-editor');
    await expect(cmEditor).toBeVisible();
    const sourceContent = await cmEditor.textContent();
    expect(sourceContent).toContain('\\int_0^1 x^2 dx = \\frac{1}{3}');

    // 切回实时渲染
    await modeBtn.click();
    await expect(wysiwygContainer).toBeVisible();
    await expect(window.locator('.math-block-wrapper').first()).toBeVisible();

    // 切回第一个标签页验证行内公式保存完好
    const firstTab = window.locator('.tab-item:has-text("macOS-Philosophy.md")');
    await firstTab.click();
    await expect(window.locator('.inline-math-wrapper').first()).toBeVisible();

    await app.close();
  });
});
