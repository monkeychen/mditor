import type { WorkspaceFolder, FileTreeNode } from '../../types';

export interface FuzzyMatchResult<T> {
  item: T;
  score: number;
  matches: number[];
}

export interface WorkspaceFileItem {
  name: string;
  path: string;
  relativePath: string;
  folderName: string;
  isDirectory: boolean;
}

const SEPARATORS = new Set(['/', '\\', '-', '_', '.', ' ', ':']);

/**
 * Checks if a character index in text is a word boundary:
 * e.g., index 0, or preceded by separator, or camelCase transition.
 */
function isWordBoundary(text: string, index: number): boolean {
  if (index === 0) return true;
  const prevChar = text[index - 1];
  if (SEPARATORS.has(prevChar)) return true;
  const currChar = text[index];
  if (currChar >= 'A' && currChar <= 'Z' && prevChar >= 'a' && prevChar <= 'z') {
    return true;
  }
  return false;
}

/**
 * Fuzzy matches a pattern against target text, returning score and matching character indices.
 * Returns null if the pattern cannot match in sequential order.
 */
export function fuzzyMatch(
  pattern: string,
  text: string
): { score: number; matches: number[] } | null {
  const q = pattern.trim();
  if (q.length === 0) {
    return { score: 0, matches: [] };
  }

  const pLower = q.toLowerCase();
  const tLower = text.toLowerCase();

  // Quick check: exact match
  if (pLower === tLower) {
    return {
      score: 1000,
      matches: Array.from({ length: text.length }, (_, i) => i),
    };
  }

  let pIdx = 0;
  let tIdx = 0;
  const matches: number[] = [];
  let score = 0;
  let consecutiveMatches = 0;
  let prevMatchIndex = -1;

  // Last separator index to identify filename part
  const lastSlashIdx = Math.max(text.lastIndexOf('/'), text.lastIndexOf('\\'));

  while (pIdx < pLower.length && tIdx < tLower.length) {
    const pChar = pLower[pIdx];
    const tChar = tLower[tIdx];

    if (pChar === tChar) {
      matches.push(tIdx);

      // Base match score
      let charScore = 10;

      // Word boundary bonus
      if (isWordBoundary(text, tIdx)) {
        charScore += 25;
      }

      // Filename bonus (occurs after the last slash)
      if (tIdx > lastSlashIdx) {
        charScore += 15;
      }

      // Consecutive match bonus
      if (prevMatchIndex !== -1 && tIdx === prevMatchIndex + 1) {
        consecutiveMatches++;
        charScore += 20 * consecutiveMatches;
      } else {
        consecutiveMatches = 0;
        if (prevMatchIndex !== -1) {
          // Gap penalty
          const gap = tIdx - prevMatchIndex - 1;
          charScore -= Math.min(gap, 10);
        }
      }

      score += charScore;
      prevMatchIndex = tIdx;
      pIdx++;
      tIdx++;
    } else {
      tIdx++;
    }
  }

  // If pattern was not fully matched
  if (pIdx < pLower.length) {
    return null;
  }

  // Exact prefix bonus
  if (tLower.startsWith(pLower)) {
    score += 50;
  }

  return { score, matches };
}

/**
 * Filters items by fuzzy matching and sorts them in descending score order.
 */
export function filterAndRankFuzzy<T>(
  query: string,
  items: T[],
  getText: (item: T) => string
): Array<FuzzyMatchResult<T>> {
  const q = query.trim();
  if (!q) {
    return items.map((item) => ({ item, score: 0, matches: [] }));
  }

  const results: Array<FuzzyMatchResult<T>> = [];

  for (const item of items) {
    const text = getText(item);
    const match = fuzzyMatch(q, text);
    if (match !== null) {
      results.push({
        item,
        score: match.score,
        matches: match.matches,
      });
    }
  }

  // Sort descending by score
  results.sort((a, b) => b.score - a.score);

  return results;
}

/**
 * Extracts and flattens all non-directory files across all workspace folders.
 */
export function extractWorkspaceFiles(folders: WorkspaceFolder[]): WorkspaceFileItem[] {
  const result: WorkspaceFileItem[] = [];

  function traverseNodes(
    nodes: FileTreeNode[],
    folderPath: string,
    folderName: string
  ) {
    for (const node of nodes) {
      if (node.isDirectory) {
        if (node.children && node.children.length > 0) {
          traverseNodes(node.children, folderPath, folderName);
        }
      } else {
        let relativePath = node.name;
        if (node.path.startsWith(folderPath)) {
          relativePath = node.path
            .slice(folderPath.length)
            .replace(/^[/\\]+/, '');
        }
        result.push({
          name: node.name,
          path: node.path,
          relativePath,
          folderName,
          isDirectory: false,
        });
      }
    }
  }

  for (const folder of folders) {
    if (folder.tree && folder.tree.length > 0) {
      traverseNodes(folder.tree, folder.path, folder.name);
    }
  }

  return result;
}
