import type { FileOpenResult, FileSaveResult, FileTreeNode } from '../../types';

export async function openDocument(): Promise<FileOpenResult | null> {
  if (window.electronAPI?.openFile) {
    return await window.electronAPI.openFile();
  }
  return null;
}

export async function openDocumentByPath(filePath: string): Promise<FileOpenResult | null> {
  if (window.electronAPI?.readFileByPath) {
    return await window.electronAPI.readFileByPath(filePath);
  }
  return null;
}

export async function openFolderDialog(): Promise<{ folderPath: string; tree: FileTreeNode[] } | null> {
  if (window.electronAPI?.openFolder) {
    return await window.electronAPI.openFolder();
  }
  return null;
}

export async function scanDirectoryTree(dirPath: string): Promise<FileTreeNode[]> {
  if (window.electronAPI?.readDirectory) {
    return await window.electronAPI.readDirectory(dirPath);
  }
  return [];
}

export async function saveDocument(
  filePath: string | null,
  content: string,
  defaultName: string = 'Untitled.md'
): Promise<FileSaveResult> {
  if (filePath && window.electronAPI?.saveFile) {
    return await window.electronAPI.saveFile(filePath, content);
  }

  // 若无路径，触发另存为
  const saveAsResult = await saveDocumentAs(defaultName, content);
  if (saveAsResult) {
    return {
      success: true,
      filePath: saveAsResult.filePath,
    };
  }

  return {
    success: false,
    error: 'Save canceled or unavailable',
  };
}

export async function saveDocumentAs(
  defaultName: string,
  content: string
): Promise<FileOpenResult | null> {
  if (window.electronAPI?.saveFileAs) {
    return await window.electronAPI.saveFileAs(defaultName, content);
  }
  return null;
}
