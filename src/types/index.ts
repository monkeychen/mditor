export type EditorMode = 'wysiwyg' | 'source';

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
  mode?: EditorMode;
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

export interface FileTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileTreeNode[];
}

export interface ElectronAPI {
  openFile?: () => Promise<FileOpenResult | null>;
  readFileByPath?: (filePath: string) => Promise<FileOpenResult | null>;
  openFolder?: () => Promise<{ folderPath: string; tree: FileTreeNode[] } | null>;
  readDirectory?: (dirPath: string) => Promise<FileTreeNode[]>;
  saveFile?: (filePath: string, content: string) => Promise<FileSaveResult>;
  saveFileAs?: (defaultName: string, content: string) => Promise<FileOpenResult | null>;
  saveImageBuffer?: (docFilePath: string | null, buffer: Uint8Array, ext?: string) => Promise<SaveImageResult>;
  copyLocalImage?: (docFilePath: string | null, sourceFilePath: string) => Promise<SaveImageResult>;
  exportHtml?: (defaultName: string, htmlContent: string) => Promise<{ success: boolean; filePath?: string }>;
  exportPdf?: (defaultName: string, htmlContent: string) => Promise<{ success: boolean; filePath?: string }>;
  onMenuTrigger?: (callback: (action: 'new' | 'open' | 'save' | 'saveAs') => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
