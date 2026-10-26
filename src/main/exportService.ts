import { BrowserWindow, dialog } from 'electron';
import fs from 'fs/promises';

export async function exportHtmlFile(
  window: BrowserWindow | null,
  defaultName: string,
  htmlContent: string
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  if (!window) return { success: false, error: 'No active window' };

  const defaultPath = (defaultName || 'Untitled').replace(/\.[^/.]+$/, '') + '.html';
  const { canceled, filePath } = await dialog.showSaveDialog(window, {
    title: '导出为 HTML',
    defaultPath,
    filters: [
      { name: 'HTML Document', extensions: ['html', 'htm'] },
      { name: '所有文件', extensions: ['*'] },
    ],
  });

  if (canceled || !filePath) {
    return { success: false };
  }

  try {
    await fs.writeFile(filePath, htmlContent, 'utf-8');
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function exportPdfFile(
  window: BrowserWindow | null,
  defaultName: string,
  htmlContent: string
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  if (!window) return { success: false, error: 'No active window' };

  const defaultPath = (defaultName || 'Untitled').replace(/\.[^/.]+$/, '') + '.pdf';
  const { canceled, filePath } = await dialog.showSaveDialog(window, {
    title: '导出为 PDF',
    defaultPath,
    filters: [
      { name: 'PDF Document', extensions: ['pdf'] },
      { name: '所有文件', extensions: ['*'] },
    ],
  });

  if (canceled || !filePath) {
    return { success: false };
  }

  // 创建一个无头隐藏窗口专用渲染打印
  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      sandbox: false,
    },
  });

  try {
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    const pdfData = await printWindow.webContents.printToPDF({
      printBackground: true,
      margins: {
        marginType: 'custom',
        top: 0.8,
        bottom: 0.8,
        left: 0.8,
        right: 0.8,
      },
    });

    await fs.writeFile(filePath, pdfData);
    printWindow.destroy();
    return { success: true, filePath };
  } catch (err) {
    printWindow.destroy();
    return { success: false, error: (err as Error).message };
  }
}
