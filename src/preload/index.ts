import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI, FileOpenResult, FileSaveResult } from '../types';

const api: ElectronAPI = {
  openFile: (): Promise<FileOpenResult | null> => {
    return ipcRenderer.invoke('file:open');
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
  onMenuTrigger: (callback: (action: 'new' | 'open' | 'save' | 'saveAs') => void) => {
    const handler = (_event: Electron.IpcRendererEvent, action: 'new' | 'open' | 'save' | 'saveAs') => callback(action);
    ipcRenderer.on('menu:trigger', handler);
    return () => {
      ipcRenderer.removeListener('menu:trigger', handler);
    };
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);
