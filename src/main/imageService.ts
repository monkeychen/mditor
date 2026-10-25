import path from 'path';
import fs from 'fs/promises';
import os from 'os';

export interface SaveImageResult {
  success: boolean;
  relativePath: string;
  absolutePath: string;
  error?: string;
}

export function generateImageFileName(ext = 'png'): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const randomStr = Math.random().toString(36).slice(2, 6);
  const cleanExt = ext.replace(/^\./, '');
  return `img-${dateStr}-${timeStr}-${randomStr}.${cleanExt}`;
}

export function getAssetsDirectory(docFilePath: string | null): string {
  if (docFilePath) {
    return path.join(path.dirname(docFilePath), 'assets');
  }
  return path.join(os.homedir(), '.mditor', 'cache', 'assets');
}

export async function saveImageBufferToDisk(
  docFilePath: string | null,
  buffer: Buffer | Uint8Array,
  ext = 'png'
): Promise<SaveImageResult> {
  try {
    const assetsDir = getAssetsDirectory(docFilePath);
    await fs.mkdir(assetsDir, { recursive: true });

    const fileName = generateImageFileName(ext);
    const absolutePath = path.join(assetsDir, fileName);

    await fs.writeFile(absolutePath, Buffer.from(buffer));

    const relativePath = `./assets/${fileName}`;
    return {
      success: true,
      relativePath,
      absolutePath,
    };
  } catch (error) {
    return {
      success: false,
      relativePath: '',
      absolutePath: '',
      error: (error as Error).message,
    };
  }
}

export async function copyLocalImageToAssets(
  docFilePath: string | null,
  sourceFilePath: string
): Promise<SaveImageResult> {
  try {
    const assetsDir = getAssetsDirectory(docFilePath);
    await fs.mkdir(assetsDir, { recursive: true });

    const ext = path.extname(sourceFilePath) || '.png';
    const fileName = generateImageFileName(ext);
    const absolutePath = path.join(assetsDir, fileName);

    await fs.copyFile(sourceFilePath, absolutePath);

    const relativePath = `./assets/${fileName}`;
    return {
      success: true,
      relativePath,
      absolutePath,
    };
  } catch (error) {
    return {
      success: false,
      relativePath: '',
      absolutePath: '',
      error: (error as Error).message,
    };
  }
}
