import fs from 'fs/promises';
import path from 'path';
import type { FileTreeNode, FileOpenResult } from '../types';
import { isSupportedTextFile } from '../renderer/utils/languageClassifier';

const IGNORED_DIRS = new Set(['node_modules', 'dist', 'dist-electron', 'release', '.git', '.idea', '.vscode']);

export async function scanMarkdownDirectory(dirPath: string, currentDepth = 0, maxDepth = 4): Promise<FileTreeNode[]> {
  if (currentDepth > maxDepth) {
    return [];
  }

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const directories: FileTreeNode[] = [];
    const files: FileTreeNode[] = [];

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;

      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        const children = await scanMarkdownDirectory(fullPath, currentDepth + 1, maxDepth);
        if (children.length > 0) {
          directories.push({
            name: entry.name,
            path: fullPath,
            isDirectory: true,
            children,
          });
        }
      } else if (entry.isFile()) {
        if (isSupportedTextFile(entry.name)) {
          files.push({
            name: entry.name,
            path: fullPath,
            isDirectory: false,
          });
        }
      }
    }

    directories.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    return [...directories, ...files];
  } catch {
    return [];
  }
}

export async function readMarkdownFileByPath(filePath: string): Promise<FileOpenResult | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    return {
      filePath,
      fileName,
      content,
    };
  } catch {
    return null;
  }
}

export async function moveItem(
  sourcePath: string,
  targetDirPath: string
): Promise<{ success: boolean; newPath?: string; error?: string }> {
  try {
    const resolvedSource = path.resolve(sourcePath);
    const resolvedTargetDir = path.resolve(targetDirPath);

    // 1. 验证源是否存在
    let sourceStat;
    try {
      sourceStat = await fs.stat(resolvedSource);
    } catch {
      return { success: false, error: '源文件或文件夹不存在' };
    }

    // 2. 验证目标目录是否存在且是目录
    let targetStat;
    try {
      targetStat = await fs.stat(resolvedTargetDir);
      if (!targetStat.isDirectory()) {
        return { success: false, error: '目标路径不是有效目录' };
      }
    } catch {
      return { success: false, error: '目标目录不存在' };
    }

    // 3. 循环嵌套防范：若源为目录，目标目录不能是自身或其子目录
    if (sourceStat.isDirectory()) {
      if (
        resolvedTargetDir === resolvedSource ||
        resolvedTargetDir.startsWith(resolvedSource + path.sep)
      ) {
        return { success: false, error: '不能将文件夹移动到其自身或子文件夹中' };
      }
    }

    // 4. 原地放置处理 (In-place move)
    const currentParentDir = path.dirname(resolvedSource);
    if (currentParentDir === resolvedTargetDir) {
      return { success: true, newPath: resolvedSource };
    }

    // 5. 目标路径同名冲突检查
    const itemName = path.basename(resolvedSource);
    const newPath = path.join(resolvedTargetDir, itemName);
    try {
      await fs.access(newPath);
      return { success: false, error: '目标位置已存在同名文件或文件夹' };
    } catch {
      // 不存在同名项，允许移动
    }

    // 6. 原子物理移动
    await fs.rename(resolvedSource, newPath);
    return { success: true, newPath };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

