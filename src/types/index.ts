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

export interface WorkspaceFolder {
  id: string;
  name: string;
  path: string;
  tree: FileTreeNode[];
}

export interface WindowState {
  isFullScreen: boolean;
  isMaximized: boolean;
  platform: 'darwin' | 'win32' | 'linux';
}

export interface ElectronAPI {
  platform?: 'darwin' | 'win32' | 'linux';
  getWindowState?: () => Promise<WindowState>;
  onWindowStateChange?: (callback: (state: WindowState) => void) => () => void;
  onFullScreenChange?: (callback: (isFullScreen: boolean) => void) => () => void;
  onMaximizeChange?: (callback: (isMaximized: boolean) => void) => () => void;
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
  revealInExplorer?: (filePath: string) => Promise<boolean>;
  moveToTrash?: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  createFile?: (parentDir: string, fileName: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  createFolder?: (parentDir: string, folderName: string) => Promise<{ success: boolean; folderPath?: string; error?: string }>;
  renameItem?: (oldPath: string, newName: string) => Promise<{ success: boolean; newPath?: string; error?: string }>;
  searchWorkspace?: (options: WorkspaceSearchOptions) => Promise<WorkspaceSearchResult[]>;
}

export interface WorkspaceSearchMatch {
  line: number;
  lineContent: string;
  matchStart: number;
  matchEnd: number;
}

export interface WorkspaceSearchResult {
  filePath: string;
  fileName: string;
  relativePath: string;
  folderPath: string;
  folderName: string;
  matches: WorkspaceSearchMatch[];
}

export interface WorkspaceSearchOptions {
  rootDirs: string[];
  query: string;
  caseSensitive?: boolean;
  wholeWord?: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
