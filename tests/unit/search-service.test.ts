import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { searchWorkspaceFiles } from '../../src/main/searchService';

describe('Workspace Search Service (Main Process) (T504 / F32 / AC-32.1 ~ AC-32.4)', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mditor-search-test-'));

    // Create folder structure
    await fs.mkdir(path.join(tempDir, 'subfolder'), { recursive: true });
    await fs.mkdir(path.join(tempDir, '.git'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'node_modules'), { recursive: true });

    // Create files
    await fs.writeFile(
      path.join(tempDir, 'file1.md'),
      '# Introduction\nWelcome to mditor search!\nThis line has quick search keyword.\n'
    );
    await fs.writeFile(
      path.join(tempDir, 'subfolder', 'file2.ts'),
      'export const message = "Mditor is fast";\nconst other = "no match";\n'
    );
    // Ignored folder files
    await fs.writeFile(path.join(tempDir, '.git', 'HEAD'), 'ref: refs/heads/main\n');
    await fs.writeFile(
      path.join(tempDir, 'node_modules', 'dep.js'),
      'console.log("mditor in node_modules");\n'
    );
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('returns empty array when query is blank or rootDirs is empty', async () => {
    const res1 = await searchWorkspaceFiles({ rootDirs: [tempDir], query: '   ' });
    expect(res1).toEqual([]);

    const res2 = await searchWorkspaceFiles({ rootDirs: [], query: 'mditor' });
    expect(res2).toEqual([]);
  });

  it('finds matches recursively and ignores .git and node_modules', async () => {
    const results = await searchWorkspaceFiles({
      rootDirs: [tempDir],
      query: 'mditor',
      caseSensitive: false,
    });

    expect(results).toHaveLength(2);
    const fileNames = results.map((r) => r.fileName);
    expect(fileNames).toContain('file1.md');
    expect(fileNames).toContain('file2.ts');
    expect(fileNames).not.toContain('dep.js');

    const file1Res = results.find((r) => r.fileName === 'file1.md');
    expect(file1Res?.matches).toHaveLength(1);
    expect(file1Res?.matches[0].line).toBe(2);
    expect(file1Res?.matches[0].lineContent).toContain('Welcome to mditor search!');
  });

  it('honors caseSensitive: true option', async () => {
    const resSensitive = await searchWorkspaceFiles({
      rootDirs: [tempDir],
      query: 'Mditor',
      caseSensitive: true,
    });
    // Only file2.ts has capital 'Mditor'
    expect(resSensitive).toHaveLength(1);
    expect(resSensitive[0].fileName).toBe('file2.ts');
  });

  it('honors wholeWord: true option', async () => {
    await fs.writeFile(
      path.join(tempDir, 'word-test.txt'),
      'search and searching and researcher\n'
    );

    const resWord = await searchWorkspaceFiles({
      rootDirs: [tempDir],
      query: 'search',
      wholeWord: true,
    });

    const matchFile = resWord.find((r) => r.fileName === 'word-test.txt');
    expect(matchFile).toBeDefined();
    // Only 'search' is matched, not 'searching' or 'researcher'
    expect(matchFile?.matches).toHaveLength(1);
    expect(matchFile?.matches[0].matchStart).toBe(0);
    expect(matchFile?.matches[0].matchEnd).toBe(6);
  });
});
