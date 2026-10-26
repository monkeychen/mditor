import fs from 'fs/promises';
import path from 'path';
import type { FileTreeNode, FileOpenResult } from '../types';

const IGNORED_DIRS = new Set(['node_modules', 'dist', 'dist-electron', 'release', '.git', '.idea', '.vscode']);
const MD_EXTENSIONS = new Set(['.md', '.markdown', '.mdown', '.txt']);

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
        const ext = path.extname(entry.name).toLowerCase();
        if (MD_EXTENSIONS.has(ext)) {
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
