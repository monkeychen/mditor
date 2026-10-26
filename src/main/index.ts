import { app, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath, pathToFileURL } from 'url';
import { saveImageBufferToDisk, copyLocalImageToAssets } from './imageService';
import { exportHtmlFile, exportPdfFile } from './exportService';
import { scanMarkdownDirectory, readMarkdownFileByPath } from './folderService';

// 注册安全特权协议（必须在 app.whenReady 之前执行）
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'local-file',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
      bypassCSP: true,
    },
  },
]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const iconPath = process.env.VITE_DEV_SERVER_URL
    ? path.join(__dirname, '../../resources/icon.png')
    : path.join(__dirname, '../dist/icon.png');

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 720,
    minWidth: 640,
    minHeight: 480,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 14 },
    backgroundColor: '#FAF8F5',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 注册 IPC 文件处理
ipcMain.handle('file:open', async () => {
  if (!mainWindow) return null;
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: '打开 Markdown 文件',
    filters: [
      { name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'txt'] },
      { name: '所有文件', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (canceled || filePaths.length === 0) {
    return null;
  }

  const targetPath = filePaths[0];
  try {
    const content = await fs.readFile(targetPath, 'utf-8');
    const fileName = path.basename(targetPath);
    return { filePath: targetPath, fileName, content };
  } catch (error) {
    return { error: (error as Error).message };
  }
});

ipcMain.handle('file:readByPath', async (_event, { filePath }: { filePath: string }) => {
  return await readMarkdownFileByPath(filePath);
});

ipcMain.handle('folder:open', async () => {
  if (!mainWindow) return null;
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: '打开文件夹',
    properties: ['openDirectory'],
  });
  if (canceled || filePaths.length === 0) {
    return null;
  }
  const folderPath = filePaths[0];
  const tree = await scanMarkdownDirectory(folderPath);
  return { folderPath, tree };
});

ipcMain.handle('folder:readDir', async (_event, { dirPath }: { dirPath: string }) => {
  return await scanMarkdownDirectory(dirPath);
});

ipcMain.handle('file:save', async (_event, { filePath, content }: { filePath: string; content: string }) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true, filePath };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('file:saveAs', async (_event, { defaultName, content }: { defaultName: string; content: string }) => {
  if (!mainWindow) return null;
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: '另存为',
    defaultPath: defaultName || 'Untitled.md',
    filters: [
      { name: 'Markdown', extensions: ['md', 'markdown'] },
      { name: '所有文件', extensions: ['*'] },
    ],
  });

  if (canceled || !filePath) {
    return null;
  }

  try {
    await fs.writeFile(filePath, content, 'utf-8');
    const fileName = path.basename(filePath);
    return { filePath, fileName, content };
  } catch (error) {
    return { error: (error as Error).message };
  }
});

// 图片落盘服务 IPC
ipcMain.handle(
  'image:saveBuffer',
  async (_event, { docFilePath, buffer, ext }: { docFilePath: string | null; buffer: Uint8Array; ext?: string }) => {
    return await saveImageBufferToDisk(docFilePath, buffer, ext);
  }
);

ipcMain.handle(
  'image:copyLocal',
  async (_event, { docFilePath, sourceFilePath }: { docFilePath: string | null; sourceFilePath: string }) => {
    return await copyLocalImageToAssets(docFilePath, sourceFilePath);
  }
);

// 导出文件 IPC
ipcMain.handle('export:html', async (_event, { defaultName, htmlContent }: { defaultName: string; htmlContent: string }) => {
  return await exportHtmlFile(mainWindow, defaultName, htmlContent);
});

ipcMain.handle('export:pdf', async (_event, { defaultName, htmlContent }: { defaultName: string; htmlContent: string }) => {
  return await exportPdfFile(mainWindow, defaultName, htmlContent);
});

app.whenReady().then(() => {
  // 注册 local-file 协议处理器，安全流式加载本地文件与图片资源
  protocol.handle('local-file', (request) => {
    try {
      const url = new URL(request.url);
      let filePath = decodeURIComponent(url.pathname);
      // 容错：若 hostname 存在且非 localhost，拼回根路径
      if (url.hostname && url.hostname !== 'localhost') {
        filePath = `/${url.hostname}${filePath}`;
      }
      if (process.platform === 'win32' && /^\/[a-zA-Z]:/.test(filePath)) {
        filePath = filePath.slice(1);
      }
      return net.fetch(pathToFileURL(filePath).toString());
    } catch (error) {
      console.error('[Protocol] Failed to handle local-file request:', error);
      return new Response(`Failed to load local file: ${(error as Error).message}`, { status: 404 });
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
