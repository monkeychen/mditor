export interface DocumentState {
  filePath: string | null;
  fileName: string;
  content: string;
  isDirty: boolean;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  wordCount: number;
  cursorLine: number;
  cursorCol: number;
}

export interface TabItem {
  id: string;
  filePath: string | null;
  fileName: string;
  content: string;
  isDirty: boolean;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  cursorLine: number;
  cursorCol: number;
}

export interface FileOpenResult {
  filePath: string;
  fileName: string;
  content: string;
}

export interface FileSaveResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export interface SaveImageResult {
  success: boolean;
  relativePath: string;
  absolutePath: string;
  error?: string;
}

export interface ElectronAPI {
  openFile?: () => Promise<FileOpenResult | null>;
  saveFile?: (filePath: string, content: string) => Promise<FileSaveResult>;
  saveFileAs?: (defaultName: string, content: string) => Promise<FileOpenResult | null>;
  saveImageBuffer?: (docFilePath: string | null, buffer: Uint8Array, ext?: string) => Promise<SaveImageResult>;
  copyLocalImage?: (docFilePath: string | null, sourceFilePath: string) => Promise<SaveImageResult>;
  onMenuTrigger?: (callback: (action: 'new' | 'open' | 'save' | 'saveAs') => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
