import type { FileOpenResult, FileSaveResult } from '../../types';

export async function openDocument(): Promise<FileOpenResult | null> {
  if (window.electronAPI?.openFile) {
    return await window.electronAPI.openFile();
  }
  return null;
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
