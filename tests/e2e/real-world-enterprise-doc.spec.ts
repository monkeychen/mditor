import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REAL_DOC_PATH =
  '/Users/chenzhian/cmcc/002-自主研发/001-工作计划/2026/016-数据共享平台v2/03-数据共享平台建设与运营方案-阶段汇报稿-v0.3.0.md';

test.describe('Real-World Enterprise Production Document E2E', () => {
  test('opens real enterprise proposal document, verifies local-file images render with naturalWidth > 0, outline, and dual-mode switching', async () => {
    test.skip(!fs.existsSync(REAL_DOC_PATH), 'Skipping real-world local document test on CI runner');
    const realContent = fs.readFileSync(REAL_DOC_PATH, 'utf8');
    const fileName = path.basename(REAL_DOC_PATH);

    const app = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main.js')],
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // 1. 通过主进程模拟文件打开对话框返回真实文档
    await app.evaluate(
      ({ ipcMain }, { p, n, c }) => {
        ipcMain.removeHandler('file:open');
        ipcMain.handle('file:open', async () => ({
          filePath: p,
          fileName: n,
          content: c,
        }));
      },
      { p: REAL_DOC_PATH, n: fileName, c: realContent }
    );

    // 点击工具栏的「打开文档 (Cmd+O)」按钮
    const openBtn = window.locator('button[title="打开文档 (Cmd+O)"]');
    await expect(openBtn).toBeVisible();
    await openBtn.click();

    // 2. 验证激活的 Tab 标题为真实汇报稿文件名
    const activeTab = window.locator('.tab-item:has-text("03-数据共享平台建设与运营方案")');
    await expect(activeTab.first()).toBeVisible();

    // 3. 验证 WYSIWYG 容器渲染成功
    const wysiwygContainer = window.locator('.milkdown-wysiwyg-container');
    await expect(wysiwygContainer).toBeVisible();

    // 4. 验证大纲抽屉成功提取真实文档的大纲层级
    const outlineDrawer = window.locator('aside');
    await expect(outlineDrawer).toBeVisible();
    await expect(outlineDrawer).toContainText('1 领导指示解读与承接');
    await expect(outlineDrawer).toContainText('2 总体定位与建设目标');

    // 5. 核心：硬性断言全部 13 张本地相对路径图片在 Chromium 中真实加载并解码成功
    const imageWrappers = window.locator('.image-widget-wrapper');
    // 等待 13 张图片挂载
    await expect(imageWrappers).toHaveCount(13);

    // 在真实的 Chromium 渲染引擎中，直接评估每个 <img> 的自然宽高与加载状态
    const imageCheckResults = await window.evaluate(async () => {
      const wrappers = Array.from(document.querySelectorAll('.image-widget-wrapper'));
      const results = await Promise.all(
        wrappers.map((wrapper) => {
          return new Promise<{
            src: string;
            complete: boolean;
            naturalWidth: number;
            naturalHeight: number;
            errorCardVisible: boolean;
          }>((resolve) => {
            const img = wrapper.querySelector('img') as HTMLImageElement | null;
            const errorCard = wrapper.querySelector('.image-error-card') as HTMLElement | null;
            const isErrorCardVisible = !!(errorCard && !errorCard.classList.contains('hidden'));

            if (!img) {
              resolve({
                src: '',
                complete: false,
                naturalWidth: 0,
                naturalHeight: 0,
                errorCardVisible: isErrorCardVisible,
              });
              return;
            }

            if (img.complete && img.naturalWidth > 0) {
              resolve({
                src: img.src,
                complete: true,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                errorCardVisible: isErrorCardVisible,
              });
              return;
            }

            // 监听 load 与 error 事件
            const onLoad = () => {
              cleanup();
              const cardVisible = !!(errorCard && !errorCard.classList.contains('hidden'));
              resolve({
                src: img.src,
                complete: true,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                errorCardVisible: cardVisible,
              });
            };

            const onError = () => {
              cleanup();
              const cardVisible = !!(errorCard && !errorCard.classList.contains('hidden'));
              resolve({
                src: img.src,
                complete: true,
                naturalWidth: 0,
                naturalHeight: 0,
                errorCardVisible: cardVisible,
              });
            };

            const cleanup = () => {
              img.removeEventListener('load', onLoad);
              img.removeEventListener('error', onError);
            };

            img.addEventListener('load', onLoad);
            img.addEventListener('error', onError);

            // 兜底超时 5 秒
            setTimeout(() => {
              cleanup();
              const cardVisible = !!(errorCard && !errorCard.classList.contains('hidden'));
              resolve({
                src: img.src,
                complete: img.complete,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                errorCardVisible: cardVisible,
              });
            }, 5000);
          });
        })
      );
      return results;
    });

    // 严密断言：13 张图片全部通过 local-file 协议成功解码且宽高大于 0
    expect(imageCheckResults.length).toBe(13);
    for (let i = 0; i < imageCheckResults.length; i++) {
      const res = imageCheckResults[i];
      // 验证使用的是 local-file:// 安全特权协议
      expect(res.src.startsWith('local-file://')).toBe(true);
      // 绝对硬性验证：Chromium 渲染引擎成功完成位图解码，自然宽高真实大于 0
      expect(
        res.naturalWidth,
        `Image #${i + 1} (${res.src}) should have naturalWidth > 0, got ${res.naturalWidth}`
      ).toBeGreaterThan(0);
      expect(
        res.naturalHeight,
        `Image #${i + 1} (${res.src}) should have naturalHeight > 0, got ${res.naturalHeight}`
      ).toBeGreaterThan(0);
      // 验证未触发加载失败占位卡片
      expect(res.errorCardVisible, `Image #${i + 1} errorCard should not be visible`).toBe(false);
    }

    // 6. 双模式切换验证（在包含 13 张大图与复杂表格下顺滑切换）
    const modeBtn = window.locator('[data-testid="mode-toggle-btn"]');
    await expect(modeBtn).toContainText('实时渲染');

    // 切换到纯源码模式
    await modeBtn.click();
    const cmEditor = window.locator('.cm-editor');
    await expect(cmEditor).toBeVisible();
    await expect(modeBtn).toContainText('源码模式');

    // 切回实时渲染模式
    await modeBtn.click();
    await expect(wysiwygContainer).toBeVisible();
    await expect(modeBtn).toContainText('实时渲染');

    // 重新确认切回后图片仍然正常渲染
    const imageWrappersAfterSwitch = window.locator('.image-widget-wrapper');
    await expect(imageWrappersAfterSwitch).toHaveCount(13);

    await app.close();
  });
});
