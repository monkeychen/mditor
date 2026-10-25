export async function saveClipboardImage(
  docFilePath: string | null,
  file: File
): Promise<string | null> {
  if (!window.electronAPI?.saveImageBuffer) {
    return null;
  }

  const arrayBuffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  const ext = file.type.split('/')[1] || 'png';

  const res = await window.electronAPI.saveImageBuffer(docFilePath, uint8, ext);
  if (res && res.success) {
    return res.relativePath;
  }
  return null;
}

export async function copyDroppedImage(
  docFilePath: string | null,
  sourceFilePath: string
): Promise<string | null> {
  if (!window.electronAPI?.copyLocalImage) {
    return null;
  }

  const res = await window.electronAPI.copyLocalImage(docFilePath, sourceFilePath);
  if (res && res.success) {
    return res.relativePath;
  }
  return null;
}
