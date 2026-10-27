import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Extended Typography E2E (v0.3.0 M3: AC-21.1 ~ AC-21.4)', () => {
  test('verifies Front Matter card, highlight mark, sub/sup, TOC block, footnote hover tooltip, and dual-mode fidelity', async () => {
    const app = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main.js')],
    });

    const page = await app.firstWindow();
    await page.waitForLoadState('domcontentloaded');

    const wysiwygContainer = page.locator('.milkdown-wysiwyg-container');
    await expect(wysiwygContainer).toBeVisible();

    // 1. 新建空白标签页
    const newTabBtn = page.locator('button[title="新建标签 (Cmd+T)"]');
    await newTabBtn.click();
    await expect(page.locator('.tab-item:has-text("Untitled.md")').first()).toBeVisible();

    // 2. 切入源码模式输入 M3 全部复合扩展排版内容
    const modeBtn = page.locator('[data-testid="mode-toggle-btn"]');
    await modeBtn.click();

    const cmEditor = page.locator('.cm-editor');
    await expect(cmEditor).toBeVisible();

    const sampleContent = [
      '---',
      'title: mditor 排版演进实录',
      'author: 安哥',
      '---',
      '',
      '# 扩展排版规范与总览',
      '',
      '[TOC]',
      '',
      '## 第一章：核心排版样式',
      '',
      '第一性原理是：==后端可以很复杂，但用户触碰到的每一层必须丝滑==。',
      '化学反应需要水 H~2~O 参与，而质能公式则是 E=mc^2^。',
      '',
      '## 第二章：脚注引用体系',
      '',
      'mditor 坚持极致交互体验对标 Typora[^1]。',
      '',
      '[^1]: 沉浸写作无干扰，所见即所得打字丝滑。',
    ].join('\n');

    const cmContent = page.locator('.cm-content');
    await cmContent.click();
    await page.keyboard.press('Meta+a');
    await page.keyboard.type(sampleContent);

    // 3. 切回所见即所得 (WYSIWYG) 实时渲染模式
    await modeBtn.click();
    await expect(wysiwygContainer).toBeVisible();

    // 4. 验证 YAML Front Matter 卡片及折叠交互 (AC-21.2)
    const frontmatterCard = page.locator('.frontmatter-card');
    await expect(frontmatterCard).toBeVisible();
    await expect(frontmatterCard).toContainText('mditor 排版演进实录');
    await expect(frontmatterCard).toContainText('安哥');

    // 点击收起 Front Matter
    const foldBtn = frontmatterCard.locator('button');
    await foldBtn.click();
    await expect(foldBtn).toContainText('展开');
    await foldBtn.click();
    await expect(foldBtn).toContainText('收起');

    // 5. 验证高亮标记 (AC-21.1)
    const highlightEl = page.locator('mark.mditor-highlight, mark');
    await expect(highlightEl.first()).toBeVisible();
    await expect(highlightEl.first()).toContainText('后端可以很复杂，但用户触碰到的每一层必须丝滑');

    // 6. 验证下标与上标 (AC-21.1)
    const subEl = page.locator('.ProseMirror sub');
    await expect(subEl.first()).toBeVisible();
    await expect(subEl.first()).toHaveText('2');

    const supEl = page.locator('.ProseMirror sup').filter({ hasNotText: '1' });
    await expect(supEl.first()).toBeVisible();
    await expect(supEl.first()).toHaveText('2');

    // 7. 验证 [TOC] 自动目录块生成 (AC-21.2)
    const tocCard = page.locator('.toc-block-card');
    await expect(tocCard).toBeVisible();
    await expect(tocCard).toContainText('第一章：核心排版样式');
    await expect(tocCard).toContainText('第二章：脚注引用体系');

    // 8. 验证脚注悬停浮窗 Tooltip (AC-21.3)
    const footnoteRef = page.locator('.footnote-ref, [data-type="footnote_reference"]').first();
    await expect(footnoteRef).toBeVisible();
    await footnoteRef.hover();

    const footnoteTooltip = page.locator('.mditor-footnote-tooltip');
    await expect(footnoteTooltip).toBeVisible();
    await expect(footnoteTooltip).toContainText('沉浸写作无干扰，所见即所得打字丝滑');

    // 9. 验证双模式切换与保真度 (AC-21.4)
    await modeBtn.click();
    await expect(cmEditor).toBeVisible();
    const roundtripContent = await cmEditor.textContent();
    expect(roundtripContent).toContain('==后端可以很复杂，但用户触碰到的每一层必须丝滑==');
    expect(roundtripContent).toContain('H~2~O');
    expect(roundtripContent).toContain('E=mc^2^');
    expect(roundtripContent).toContain('[TOC]');
    expect(roundtripContent).toContain('[^1]: 沉浸写作无干扰，所见即所得打字丝滑。');

    // 切回实时渲染
    await modeBtn.click();
    await expect(wysiwygContainer).toBeVisible();
    await expect(page.locator('.frontmatter-card')).toBeVisible();

    await app.close();
  });
});
