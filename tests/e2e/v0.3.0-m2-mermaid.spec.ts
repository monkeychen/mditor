import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Mermaid Diagram System E2E (v0.3.0 M2: AC-20.1 ~ AC-20.3)', () => {
  test('verifies flowchart SVG rendering, source code drawer toggle, copy code, and dual-mode switching', async () => {
    const app = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main.js')],
    });

    const page = await app.firstWindow();
    await page.waitForLoadState('domcontentloaded');

    const wysiwygContainer = page.locator('.milkdown-wysiwyg-container');
    await expect(wysiwygContainer).toBeVisible();

    // 1. 新建空白文档标签页进行 Mermaid 图表测试
    const newTabBtn = page.locator('button[title="新建标签 (Cmd+T)"]');
    await newTabBtn.click();
    await expect(page.locator('.tab-item:has-text("Untitled.md")').first()).toBeVisible();

    // 2. 切入源码模式输入 Mermaid 流程图代码块
    const modeBtn = page.locator('[data-testid="mode-toggle-btn"]');
    await modeBtn.click();

    const cmEditor = page.locator('.cm-editor');
    await expect(cmEditor).toBeVisible();

    const cmContent = page.locator('.cm-content');
    await cmContent.click();
    await page.keyboard.press('Meta+a');
    await page.keyboard.type('```mermaid\ngraph TD\n  A[客户端] --> B[核心网关]\n```\n\n正文结束。');

    // 切回实时渲染 (WYSIWYG) 模式
    await modeBtn.click();
    await expect(wysiwygContainer).toBeVisible();

    // 3. 验证生成 Mermaid 图表卡片容器与 SVG 矢量节点 (AC-20.1)
    const mermaidWrapper = page.locator('.mermaid-block-wrapper').first();
    await expect(mermaidWrapper).toBeVisible();

    const diagramContainer = mermaidWrapper.locator('.mermaid-diagram-container');
    await expect(diagramContainer).toBeVisible();

    const svgEl = diagramContainer.locator('svg').first();
    await expect(svgEl).toBeVisible();

    // 验证 SVG 矢量图具有合理的渲染尺寸 (消除假阳性断言)
    const bbox = await svgEl.boundingBox();
    expect(bbox).not.toBeNull();
    expect(bbox!.width).toBeGreaterThan(40);
    expect(bbox!.height).toBeGreaterThan(20);

    // 4. 验证右上角工具栏与「查看/编辑源码」抽屉交互 (AC-20.2)
    const toggleBtn = mermaidWrapper.locator('.mermaid-toggle-source-btn');
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();

    // 验证源码抽屉展开并可见
    const sourceDrawer = mermaidWrapper.locator('.mermaid-source-drawer');
    await expect(sourceDrawer).toBeVisible();

    // 点击复制代码按钮
    const copyBtn = mermaidWrapper.locator('.code-copy-btn');
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    await expect(copyBtn).toContainText('已复制');

    // 验证导出 SVG 按钮
    const exportSvgBtn = mermaidWrapper.locator('.mermaid-export-svg-btn');
    await expect(exportSvgBtn).toBeVisible();

    // 再次点击收起源码抽屉
    await toggleBtn.click();
    await expect(sourceDrawer).toHaveClass(/max-h-0/);

    // 5. 验证双模式切换下 Markdown 文本的保真度
    await modeBtn.click();
    await expect(cmEditor).toBeVisible();
    const sourceText = await cmEditor.textContent();
    expect(sourceText).toContain('```mermaid');
    expect(sourceText).toContain('graph TD');
    expect(sourceText).toContain('A[客户端] --> B[核心网关]');

    // 再次切回实时渲染
    await modeBtn.click();
    await expect(wysiwygContainer).toBeVisible();
    await expect(page.locator('.mermaid-block-wrapper').first()).toBeVisible();

    await app.close();
  });
});
