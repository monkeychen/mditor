import { describe, it, expect } from 'vitest';
import {
  fuzzyMatch,
  filterAndRankFuzzy,
  extractWorkspaceFiles,
  WorkspaceFileItem,
} from '../../src/renderer/utils/fuzzySearch';
import type { WorkspaceFolder } from '../../src/types';

describe('Fuzzy Search & Scoring Engine (T502 / F31 / AC-31.1 ~ AC-31.4)', () => {
  describe('fuzzyMatch', () => {
    it('returns empty matches with base score when pattern is empty', () => {
      const res = fuzzyMatch('', 'README.md');
      expect(res).not.toBeNull();
      expect(res?.score).toBe(0);
      expect(res?.matches).toEqual([]);
    });

    it('returns null when pattern does not match in order', () => {
      expect(fuzzyMatch('xyz', 'README.md')).toBeNull();
      expect(fuzzyMatch('mr', 'README.md')).toBeNull(); // 'r' appears before 'm' in 'rm', but 'mr' is reversed
    });

    it('matches case-insensitively and returns character match indices', () => {
      const res = fuzzyMatch('rm', 'README.md');
      expect(res).not.toBeNull();
      // 'R' is at index 0, 'M' is at index 4 (REA D M e . m d)
      expect(res?.matches).toEqual([0, 4]);
    });

    it('scores consecutive matches higher than spread out matches', () => {
      const consecutive = fuzzyMatch('read', 'README.md');
      const spread = fuzzyMatch('rdm', 'README.md');
      expect(consecutive).not.toBeNull();
      expect(spread).not.toBeNull();
      expect(consecutive!.score).toBeGreaterThan(spread!.score);
    });

    it('scores word boundary and slash matches with extra bonus', () => {
      // Matching 'doc' in 'my-doc.md' at word boundary '-' vs 'mydoc.md'
      const boundaryMatch = fuzzyMatch('doc', 'project-doc.md');
      const middleMatch = fuzzyMatch('doc', 'projectdoc.md');
      expect(boundaryMatch!.score).toBeGreaterThan(middleMatch!.score);
    });

    it('gives exact match the highest score', () => {
      const exact = fuzzyMatch('README.md', 'README.md');
      const partial = fuzzyMatch('read', 'README.md');
      expect(exact!.score).toBeGreaterThan(partial!.score);
    });
  });

  describe('filterAndRankFuzzy', () => {
    const fileList = [
      'src/renderer/components/OutlineDrawer.tsx',
      'src/renderer/utils/fuzzySearch.ts',
      'src/main/searchService.ts',
      'docs/prd/PRD-v0.5.0.md',
      'docs/spec/spec-v0.5.0-m1.md',
      'README.md',
    ];

    it('filters and sorts items by relevance score descending', () => {
      const results = filterAndRankFuzzy('spec', fileList, (x) => x);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item).toBe('docs/spec/spec-v0.5.0-m1.md');
      expect(results[0].matches.length).toBe(4);
    });

    it('ranks exact filename match above path matches', () => {
      const results = filterAndRankFuzzy('search', fileList, (x) => x);
      expect(results.length).toBe(2);
      // 'fuzzySearch.ts' and 'searchService.ts' both match 'search'
      expect(results.map((r) => r.item)).toContain('src/main/searchService.ts');
      expect(results.map((r) => r.item)).toContain('src/renderer/utils/fuzzySearch.ts');
    });

    it('returns empty array when query does not match any item', () => {
      const results = filterAndRankFuzzy('nonexistentkeyword123', fileList, (x) => x);
      expect(results).toEqual([]);
    });

    it('returns all items when query is blank', () => {
      const results = filterAndRankFuzzy('', fileList, (x) => x);
      expect(results.length).toBe(fileList.length);
    });
  });

  describe('extractWorkspaceFiles', () => {
    const mockFolders: WorkspaceFolder[] = [
      {
        id: '/Users/test/notes',
        name: 'notes',
        path: '/Users/test/notes',
        tree: [
          {
            name: '01-intro.md',
            path: '/Users/test/notes/01-intro.md',
            isDirectory: false,
          },
          {
            name: 'guides',
            path: '/Users/test/notes/guides',
            isDirectory: true,
            children: [
              {
                name: 'cheatsheet.md',
                path: '/Users/test/notes/guides/cheatsheet.md',
                isDirectory: false,
              },
            ],
          },
        ],
      },
      {
        id: '/Users/test/project',
        name: 'project',
        path: '/Users/test/project',
        tree: [
          {
            name: 'config.json',
            path: '/Users/test/project/config.json',
            isDirectory: false,
          },
        ],
      },
    ];

    it('flattens all files recursively while extracting relative paths and folder names', () => {
      const files = extractWorkspaceFiles(mockFolders);
      expect(files.length).toBe(3);

      expect(files[0]).toEqual({
        name: '01-intro.md',
        path: '/Users/test/notes/01-intro.md',
        relativePath: '01-intro.md',
        folderName: 'notes',
        isDirectory: false,
      });

      expect(files[1]).toEqual({
        name: 'cheatsheet.md',
        path: '/Users/test/notes/guides/cheatsheet.md',
        relativePath: 'guides/cheatsheet.md',
        folderName: 'notes',
        isDirectory: false,
      });

      expect(files[2]).toEqual({
        name: 'config.json',
        path: '/Users/test/project/config.json',
        relativePath: 'config.json',
        folderName: 'project',
        isDirectory: false,
      });
    });

    it('handles empty folders cleanly', () => {
      expect(extractWorkspaceFiles([])).toEqual([]);
    });
  });
});
