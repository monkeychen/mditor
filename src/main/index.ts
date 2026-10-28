import { app, BrowserWindow, ipcMain, dialog, protocol, net, shell } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath, pathToFileURL } from 'url';
import { saveImageBufferToDisk, copyLocalImageToAssets } from './imageService';
import { exportHtmlFile, exportPdfFile } from './exportService';
import { exportDocxFile } from './docxExportService';
import { scanMarkdownDirectory, readMarkdownFileByPath, moveItem } from './folderService';
import { searchWorkspaceFiles } from './searchService';
import { setupAboutPanel, setupApplicationMenu } from './menuService';
import type { WorkspaceSearchOptions, PdfExportOptions } from '../types';

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

  const sendWindowState = () => {
    if (!mainWindow) return;
    mainWindow.webContents.send('window:state-change', {
      isFullScreen: mainWindow.isFullScreen(),
      isMaximized: mainWindow.isMaximized(),
      platform: process.platform,
    });
  };

  mainWindow.on('enter-full-screen', () => {
    mainWindow?.webContents.send('window:fullscreen-change', true);
    sendWindowState();
  });

  mainWindow.on('leave-full-screen', () => {
    mainWindow?.webContents.send('window:fullscreen-change', false);
    sendWindowState();
  });

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximize-change', true);
    sendWindowState();
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximize-change', false);
    sendWindowState();
  });

  mainWindow.on('resized', sendWindowState);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  setupAboutPanel(app.getVersion());
  setupApplicationMenu(mainWindow, app.getVersion());
}

// 注册 IPC 文件处理
ipcMain.handle('file:open', async () => {
  if (!mainWindow) return null;
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: '打开文档或代码文件',
    filters: [
      {
        name: '所有支持格式',
        extensions: [
          'md', 'markdown', 'mdown', 'txt', 'text', 'log', 'diff', 'patch',
          'json', 'jsonc', 'yaml', 'yml', 'toml', 'xml', 'ini', 'env', 'csv', 'properties',
          'html', 'htm', 'css', 'scss', 'less', 'svg',
          'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
          'py', 'pyw', 'sql', 'java', 'kt', 'kts', 'go', 'rs', 'c', 'cpp', 'cc', 'h', 'hpp', 'cs',
          'sh', 'bash', 'zsh', 'php', 'rb', 'swift', 'dockerfile'
        ],
      },
      { name: 'Markdown 文档', extensions: ['md', 'markdown', 'mdown'] },
      {
        name: '源代码与脚本',
        extensions: [
          'py', 'pyw', 'sql', 'java', 'kt', 'kts', 'go', 'rs', 'c', 'cpp', 'cc', 'h', 'hpp', 'cs',
          'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'sh', 'bash', 'zsh', 'php', 'rb', 'swift', 'dockerfile'
        ],
      },
      {
        name: '数据与配置',
        extensions: ['json', 'jsonc', 'yaml', 'yml', 'toml', 'xml', 'ini', 'env', 'csv', 'properties'],
      },
      {
        name: '文本与日志',
        extensions: ['txt', 'text', 'log', 'diff', 'patch'],
      },
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

ipcMain.handle(
  'export:pdf',
  async (
    _event,
    { defaultName, htmlContent, options }: { defaultName: string; htmlContent: string; options?: PdfExportOptions }
  ) => {
    return await exportPdfFile(mainWindow, defaultName, htmlContent, options);
  }
);

ipcMain.handle(
  'export:docx',
  async (_event, { defaultName, markdown }: { defaultName: string; markdown: string }) => {
    return await exportDocxFile(mainWindow, defaultName, markdown);
  }
);

// 窗口状态查询 IPC
ipcMain.handle('window:getState', () => {
  return {
    isFullScreen: mainWindow?.isFullScreen() ?? false,
    isMaximized: mainWindow?.isMaximized() ?? false,
    platform: process.platform,
  };
});

// 在系统原生文件管理器中定位高亮文件 (Finder / Explorer)
ipcMain.handle('file:revealInExplorer', async (_event, { filePath }: { filePath: string }) => {
  try {
    shell.showItemInFolder(filePath);
    return true;
  } catch (error) {
    console.error('Failed to reveal file:', error);
    return false;
  }
});

// 安全移到废纸篓 / 回收站 (严禁硬删除)
ipcMain.handle('file:moveToTrash', async (_event, { filePath }: { filePath: string }) => {
  try {
    await shell.trashItem(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// 新建文件
ipcMain.handle('file:create', async (_event, { parentDir, fileName }: { parentDir: string; fileName: string }) => {
  try {
    const targetPath = path.join(parentDir, fileName);
    try {
      await fs.access(targetPath);
      return { success: false, error: '同名文件已存在' };
    } catch {
      // 不存在，正常创建
    }
    await fs.writeFile(targetPath, '', 'utf-8');
    return { success: true, filePath: targetPath };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// 重命名文件或目录
ipcMain.handle('file:rename', async (_event, { oldPath, newName }: { oldPath: string; newName: string }) => {
  try {
    const parentDir = path.dirname(oldPath);
    const newPath = path.join(parentDir, newName);
    if (newPath !== oldPath) {
      try {
        await fs.access(newPath);
        return { success: false, error: '同名文件或文件夹已存在' };
      } catch {
        // 不存在，正常重命名
      }
      await fs.rename(oldPath, newPath);
    }
    return { success: true, newPath };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// 跨目录原子移动文件或文件夹 (F33)
ipcMain.handle('file:move', async (_event, { sourcePath, targetDirPath }: { sourcePath: string; targetDirPath: string }) => {
  return await moveItem(sourcePath, targetDirPath);
});

// 新建文件夹
ipcMain.handle('folder:create', async (_event, { parentDir, folderName }: { parentDir: string; folderName: string }) => {
  try {
    const targetPath = path.join(parentDir, folderName);
    await fs.mkdir(targetPath, { recursive: true });
    return { success: true, folderPath: targetPath };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// 全工作区全文检索 (F32)
ipcMain.handle('workspace:search', async (_event, options: WorkspaceSearchOptions) => {
  try {
    return await searchWorkspaceFiles(options);
  } catch (error) {
    console.error('workspace:search error:', error);
    return [];
  }
});

// 安全打开外部链接
ipcMain.handle('shell:openExternal', async (_event, url: string) => {
  if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('mailto:'))) {
    await shell.openExternal(url);
    return true;
  }
  return false;
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
