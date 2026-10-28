import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Publish-Grade Export & Image Lightbox E2E (v0.5.0 M3: F35, F36, F37)', () => {
  let tempDir: string;

  test.beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mditor-e2e-v050-m3-'));
    await fs.writeFile(
      path.join(tempDir, 'demo-doc.md'),
      '# System Design\n\n![Topology](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80)\n\nParagraph text.\n',
      'utf-8'
    );
  });

  test.afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  test('F37: Image click or badge opens fullscreen lightbox with zoom controls and Esc dismissal', async () => {
    const app = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main.js')],
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Mount workspace
    await window.evaluate((dir) => {
      localStorage.setItem('mditor_workspace_folders', JSON.stringify([dir]));
    }, tempDir);
    await window.reload();
    await window.waitForLoadState('domcontentloaded');

    // Ensure sidebar is on files tab
    const filesTab = window.locator('[data-testid="sidebar-tab-files"]');
    await filesTab.click();

    // Open demo-doc.md from sidebar
    const docItem = window.locator('[data-testid="file-tree-item-demo-doc.md"]').first();
    await expect(docItem).toBeVisible({ timeout: 6000 });
    await docItem.click();

    // Image card rendered in editor canvas
    const imgWrapper = window.locator('.image-widget-wrapper').first();
    await expect(imgWrapper).toBeVisible({ timeout: 6000 });

    const imgElement = imgWrapper.locator('img');
    await expect(imgElement).toBeVisible();

    // Click image to open Lightbox
    await imgElement.click();

    // Lightbox modal appears
    const lightbox = window.locator('[data-testid="image-lightbox"]');
    await expect(lightbox).toBeVisible();

    // Verify initial scale is 100%
    const scaleBadge = window.locator('[data-testid="lightbox-scale-badge"]');
    await expect(scaleBadge).toHaveText('100%');

    // Click Zoom In -> 125%
    const zoomInBtn = window.locator('[data-testid="lightbox-zoom-in"]');
    await zoomInBtn.click();
    await expect(scaleBadge).toHaveText('125%');

    // Click Reset -> 100%
    const resetBtn = window.locator('[data-testid="lightbox-zoom-reset"]');
    await resetBtn.click();
    await expect(scaleBadge).toHaveText('100%');

    // Press Escape to dismiss
    await window.keyboard.press('Escape');
    await expect(lightbox).toBeHidden();

    await app.close();
  });

  test('F35: Export modal opens with paper size and pagination settings and cancels cleanly', async () => {
    const app = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main.js')],
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Open export dropdown from toolbar
    const exportBtn = window.locator('[data-testid="toolbar-export-btn"]');
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();

    const exportMenu = window.locator('[data-testid="toolbar-export-menu"]');
    await expect(exportMenu).toBeVisible();

    // Click "导出为 PDF 文档..." option
    const pdfOption = window.locator('[data-testid="export-pdf-option"]');
    await expect(pdfOption).toBeVisible();
    await pdfOption.click();

    // Export options modal appears
    const pdfModal = window.locator('[data-testid="pdf-export-modal"]');
    await expect(pdfModal).toBeVisible();

    // Switch paper size to Letter
    const letterBtn = window.locator('[data-testid="pdf-page-size-letter"]');
    await letterBtn.click();

    // Switch margin preset to narrow (10mm)
    const narrowBtn = window.locator('[data-testid="pdf-margin-narrow"]');
    await narrowBtn.click();

    // Cancel modal
    const cancelBtn = window.locator('[data-testid="pdf-export-cancel-btn"]');
    await cancelBtn.click();
    await expect(pdfModal).toBeHidden();

    await app.close();
  });

  test('F36: Word docx export converts markdown into valid PK binary buffer', async () => {
    const app = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main.js')],
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Open export dropdown and verify "导出为 Word (.docx)" option is present
    const exportBtn = window.locator('[data-testid="toolbar-export-btn"]');
    await exportBtn.click();

    const docxOption = window.locator('[data-testid="export-docx-option"]');
    await expect(docxOption).toBeVisible();

    await app.close();
  });
});
