import fs from 'fs/promises';
import path from 'path';
import type { WorkspaceSearchOptions, WorkspaceSearchResult, WorkspaceSearchMatch } from '../types';

const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  '.output',
  '.turbo',
  '.cache',
  '.vscode',
  '.idea',
  '.DS_Store',
  'release-build',
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_MATCHES_PER_FILE = 100;
const MAX_TOTAL_FILES = 200;

/**
 * Scans directories recursively and finds full-text matches in workspace files.
 */
export async function searchWorkspaceFiles(
  options: WorkspaceSearchOptions
): Promise<WorkspaceSearchResult[]> {
  const { rootDirs, query, caseSensitive = false, wholeWord = false } = options;
  const q = query.trim();
  if (!q || !rootDirs || rootDirs.length === 0) {
    return [];
  }

  let regex: RegExp;
  try {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = wholeWord ? `\\b${escaped}\\b` : escaped;
    const flags = caseSensitive ? 'g' : 'gi';
    regex = new RegExp(pattern, flags);
  } catch {
    return [];
  }

  const results: WorkspaceSearchResult[] = [];

  async function scanFile(filePath: string, folderPath: string, folderName: string) {
    if (results.length >= MAX_TOTAL_FILES) return;

    try {
      const stats = await fs.stat(filePath);
      if (stats.size > MAX_FILE_SIZE) return;

      const content = await fs.readFile(filePath, 'utf-8');
      // Quick check before line splitting
      if (caseSensitive ? !content.includes(q) : !content.toLowerCase().includes(q.toLowerCase())) {
        return;
      }

      const lines = content.split('\n');
      const matches: WorkspaceSearchMatch[] = [];

      for (let i = 0; i < lines.length; i++) {
        const lineContent = lines[i];
        regex.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(lineContent)) !== null) {
          matches.push({
            line: i + 1,
            lineContent: lineContent.trimEnd(),
            matchStart: match.index,
            matchEnd: match.index + match[0].length,
          });

          if (matches.length >= MAX_MATCHES_PER_FILE) break;
          if (regex.lastIndex === match.index) {
            regex.lastIndex++;
          }
        }

        if (matches.length >= MAX_MATCHES_PER_FILE) break;
      }

      if (matches.length > 0) {
        const relativePath = filePath.startsWith(folderPath)
          ? filePath.slice(folderPath.length).replace(/^[/\\]+/, '')
          : path.basename(filePath);

        results.push({
          filePath,
          fileName: path.basename(filePath),
          relativePath,
          folderPath,
          folderName,
          matches,
        });
      }
    } catch {
      // Ignore unreadable / binary files
    }
  }

  async function scanDir(dirPath: string, folderPath: string, folderName: string) {
    if (results.length >= MAX_TOTAL_FILES) return;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') && entry.name !== '.env') {
          continue;
        }
        if (IGNORED_DIRS.has(entry.name)) {
          continue;
        }

        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          await scanDir(fullPath, folderPath, folderName);
        } else if (entry.isFile()) {
          await scanFile(fullPath, folderPath, folderName);
        }
      }
    } catch {
      // Ignore unreadable directories
    }
  }

  for (const rootDir of rootDirs) {
    const folderName = path.basename(rootDir) || rootDir;
    await scanDir(rootDir, rootDir, folderName);
  }

  return results;
}
