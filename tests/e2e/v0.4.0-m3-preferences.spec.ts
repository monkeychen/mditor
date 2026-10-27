import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Preferences Panel & Canvas Hot Reload E2E (v0.4.0 M3: AC-27.1 ~ AC-27.3)', () => {
  test('opens preferences modal, updates font size, max width and theme with live reload and persistence', async () => {
    const app = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main.js')],
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // 1. 点击顶栏设置按钮唤起偏好设置面板
    const prefsBtn = window.locator('[data-testid="header-preferences-btn"]');
    await expect(prefsBtn).toBeVisible();
    await prefsBtn.click();

    const prefsModal = window.locator('[data-testid="preferences-modal"]');
    await expect(prefsModal).toBeVisible();

    // 2. 切换至编辑器 Tab
    const editorTabBtn = window.locator('[data-testid="tab-btn-editor"]');
    await expect(editorTabBtn).toBeVisible();
    await editorTabBtn.click();

    // 3. 修改字号为 18px
    const fontSizeSelect = window.locator('[data-testid="prefs-font-size-select"]');
    await expect(fontSizeSelect).toBeVisible();
    await fontSizeSelect.selectOption('18');

    // 4. 修改最大行宽为 1024px
    const maxWidthSelect = window.locator('[data-testid="prefs-max-width-select"]');
    await expect(maxWidthSelect).toBeVisible();
    await maxWidthSelect.selectOption('1024');

    // 5. 修改行高为 1.8
    const lineHeightSelect = window.locator('[data-testid="prefs-line-height-select"]');
    await expect(lineHeightSelect).toBeVisible();
    await lineHeightSelect.selectOption('1.8');

    // 6. 验证 DOM CSS 变量即时热重载
    const htmlStyles = await window.evaluate(() => {
      const el = document.documentElement;
      return {
        fontSize: el.style.getPropertyValue('--editor-font-size'),
        maxWidth: el.style.getPropertyValue('--editor-max-width'),
        lineHeight: el.style.getPropertyValue('--editor-line-height'),
      };
    });

    expect(htmlStyles.fontSize).toBe('18px');
    expect(htmlStyles.maxWidth).toBe('1024px');
    expect(htmlStyles.lineHeight).toBe('1.8');

    // 7. 切换至外观 Tab 并选择 Night (暗黑) 主题
    const appearanceTabBtn = window.locator('[data-testid="tab-btn-appearance"]');
    await appearanceTabBtn.click();

    const nightCard = window.locator('[data-testid="theme-card-night"]');
    await expect(nightCard).toBeVisible();
    await nightCard.click();

    // 验证暗黑主题即时生效
    const themeAttr = await window.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(themeAttr).toBe('night');

    // 8. 关闭偏好设置面板 (Esc)
    await window.keyboard.press('Escape');
    await expect(prefsModal).not.toBeVisible();

    // 9. 刷新窗口验证持久化恢复
    await window.reload();
    await window.waitForLoadState('domcontentloaded');

    const persistedStyles = await window.evaluate(() => {
      const el = document.documentElement;
      return {
        fontSize: el.style.getPropertyValue('--editor-font-size'),
        maxWidth: el.style.getPropertyValue('--editor-max-width'),
        lineHeight: el.style.getPropertyValue('--editor-line-height'),
        theme: el.getAttribute('data-theme'),
      };
    });

    expect(persistedStyles.fontSize).toBe('18px');
    expect(persistedStyles.maxWidth).toBe('1024px');
    expect(persistedStyles.lineHeight).toBe('1.8');
    expect(persistedStyles.theme).toBe('night');

    await app.close();
  });
});
