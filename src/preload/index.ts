import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI, FileOpenResult, FileSaveResult, FileTreeNode, MenuAction } from '../types';

const api: ElectronAPI = {
  platform: process.platform as 'darwin' | 'win32' | 'linux',
  getWindowState: () => ipcRenderer.invoke('window:getState'),
  onWindowStateChange: (callback: (state: any) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: any) => callback(state);
    ipcRenderer.on('window:state-change', handler);
    return () => ipcRenderer.removeListener('window:state-change', handler);
  },
  onFullScreenChange: (callback: (isFullScreen: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, isFullScreen: boolean) => callback(isFullScreen);
    ipcRenderer.on('window:fullscreen-change', handler);
    return () => ipcRenderer.removeListener('window:fullscreen-change', handler);
  },
  onMaximizeChange: (callback: (isMaximized: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, isMaximized: boolean) => callback(isMaximized);
    ipcRenderer.on('window:maximize-change', handler);
    return () => ipcRenderer.removeListener('window:maximize-change', handler);
  },
  revealInExplorer: (filePath: string) => {
    return ipcRenderer.invoke('file:revealInExplorer', { filePath });
  },
  moveToTrash: (filePath: string) => {
    return ipcRenderer.invoke('file:moveToTrash', { filePath });
  },
  createFile: (parentDir: string, fileName: string) => {
    return ipcRenderer.invoke('file:create', { parentDir, fileName });
  },
  createFolder: (parentDir: string, folderName: string) => {
    return ipcRenderer.invoke('folder:create', { parentDir, folderName });
  },
  renameItem: (oldPath: string, newName: string) => {
    return ipcRenderer.invoke('file:rename', { oldPath, newName });
  },
  moveItem: (sourcePath: string, targetDirPath: string) => {
    return ipcRenderer.invoke('file:move', { sourcePath, targetDirPath });
  },
  openFile: (): Promise<FileOpenResult | null> => {
    return ipcRenderer.invoke('file:open');
  },
  readFileByPath: (filePath: string): Promise<FileOpenResult | null> => {
    return ipcRenderer.invoke('file:readByPath', { filePath });
  },
  openFolder: (): Promise<{ folderPath: string; tree: FileTreeNode[] } | null> => {
    return ipcRenderer.invoke('folder:open');
  },
  readDirectory: (dirPath: string): Promise<FileTreeNode[]> => {
    return ipcRenderer.invoke('folder:readDir', { dirPath });
  },
  saveFile: (filePath: string, content: string): Promise<FileSaveResult> => {
    return ipcRenderer.invoke('file:save', { filePath, content });
  },
  saveFileAs: (defaultName: string, content: string): Promise<FileOpenResult | null> => {
    return ipcRenderer.invoke('file:saveAs', { defaultName, content });
  },
  saveImageBuffer: (docFilePath: string | null, buffer: Uint8Array, ext?: string) => {
    return ipcRenderer.invoke('image:saveBuffer', { docFilePath, buffer, ext });
  },
  copyLocalImage: (docFilePath: string | null, sourceFilePath: string) => {
    return ipcRenderer.invoke('image:copyLocal', { docFilePath, sourceFilePath });
  },
  exportHtml: (defaultName: string, htmlContent: string) => {
    return ipcRenderer.invoke('export:html', { defaultName, htmlContent });
  },
  exportPdf: (defaultName: string, htmlContent: string, options?: any) => {
    return ipcRenderer.invoke('export:pdf', { defaultName, htmlContent, options });
  },
  exportDocx: (defaultName: string, markdown: string) => {
    return ipcRenderer.invoke('export:docx', { defaultName, markdown });
  },
  searchWorkspace: (options) => {
    return ipcRenderer.invoke('workspace:search', options);
  },
  openExternal: (url: string) => {
    return ipcRenderer.invoke('shell:openExternal', url);
  },
  onMenuTrigger: (callback: (action: MenuAction) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, action: MenuAction) => callback(action);
    ipcRenderer.on('menu:trigger', handler);
    return () => {
      ipcRenderer.removeListener('menu:trigger', handler);
    };
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);
