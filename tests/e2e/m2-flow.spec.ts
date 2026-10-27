import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Desktop Electron E2E Flow (M2: Tabs, Image & Outline)', () => {
  test('verifies tabs management, outline drawer and live image card', async () => {
    // 启动打包后的 Electron 主进程
    const app = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main.js')],
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // 1. 验证多标签栏存在初始 Tab，且记录默认窗口尺寸下的左侧起始坐标
    const tab1 = window.locator('.tab-item:has-text("macOS-Philosophy.md")');
    await expect(tab1).toBeVisible();
    const initialTabBox = await tab1.boundingBox();
    expect(initialTabBox).not.toBeNull();
    expect(initialTabBox!.x).toBeGreaterThanOrEqual(75);
    expect(initialTabBox!.x).toBeLessThanOrEqual(140);

    // 验证窗口最大化 / 拉伸至大屏宽度后，TabBar 自动扩展宽度且首个 Tab 保持在左侧原位，绝不往中间漂移
    await window.setViewportSize({ width: 1920, height: 1080 });
    const maximizedTabBox = await tab1.boundingBox();
    const tabBarContainerBox = await window.locator('[data-testid="tab-bar-container"]').boundingBox();
    expect(maximizedTabBox).not.toBeNull();
    expect(tabBarContainerBox).not.toBeNull();
    expect(Math.abs(maximizedTabBox!.x - initialTabBox!.x)).toBeLessThanOrEqual(2);
    expect(tabBarContainerBox!.width).toBeGreaterThan(1200);

    // 2. 点击新建标签按钮，生成第 2 个标签
    const newTabBtn = window.locator('header button[title="新建标签 (Cmd+T)"]');
    await newTabBtn.click();

    const tabs = window.locator('.tab-item');
    await expect(tabs).toHaveCount(2);

    // 3. 切回第 1 个标签
    await tab1.click();

    // 4. 验证左侧大纲抽屉
    const outlineDrawer = window.locator('aside');
    await expect(outlineDrawer).toBeVisible();
    await expect(outlineDrawer).toContainText('文档大纲');
    await expect(outlineDrawer).toContainText('核心交互特性');

    // 5. 点击切换大纲按钮进行折叠与展开
    const toggleOutlineBtn = window.locator('header button[title="切换大纲 (Cmd+Shift+O)"]');
    await toggleOutlineBtn.click();
    await expect(outlineDrawer).toHaveClass(/w-0/);

    // 再次点击展开
    await toggleOutlineBtn.click();
    await expect(outlineDrawer).toHaveClass(/w-60/);

    // 6. 验证排版内图片节点存在
    const imageElem = window.locator('.milkdown-wysiwyg-container img[src*="macos-window"]');
    await expect(imageElem).toHaveCount(1);

    await app.close();
  });
});
