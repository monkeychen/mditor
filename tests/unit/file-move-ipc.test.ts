import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { moveItem } from '../../src/main/folderService';

describe('File Move IPC & Service (T506 / F33 / AC-33.1 ~ AC-33.4)', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mditor-move-test-'));
    // Setup directory structure:
    // tempDir/
    //   ├── fileA.md
    //   ├── dir1/
    //   │     └── fileB.md
    //   └── dir2/
    //         └── subDir2/
    await fs.writeFile(path.join(tempDir, 'fileA.md'), '# File A', 'utf-8');
    await fs.mkdir(path.join(tempDir, 'dir1'), { recursive: true });
    await fs.writeFile(path.join(tempDir, 'dir1', 'fileB.md'), '# File B', 'utf-8');
    await fs.mkdir(path.join(tempDir, 'dir2', 'subDir2'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('moves a file to a target directory successfully', async () => {
    const sourceFile = path.join(tempDir, 'fileA.md');
    const targetDir = path.join(tempDir, 'dir1');

    const result = await moveItem(sourceFile, targetDir);

    expect(result.success).toBe(true);
    expect(result.newPath).toBe(path.join(targetDir, 'fileA.md'));

    // Verify file actually moved on disk
    await expect(fs.access(path.join(targetDir, 'fileA.md'))).resolves.toBeUndefined();
    await expect(fs.access(sourceFile)).rejects.toThrow();
  });

  it('moves a directory into another directory successfully', async () => {
    const sourceDir = path.join(tempDir, 'dir1');
    const targetDir = path.join(tempDir, 'dir2');

    const result = await moveItem(sourceDir, targetDir);

    expect(result.success).toBe(true);
    const expectedPath = path.join(targetDir, 'dir1');
    expect(result.newPath).toBe(expectedPath);

    // Verify directory and its contents moved
    await expect(fs.access(expectedPath)).resolves.toBeUndefined();
    await expect(fs.access(path.join(expectedPath, 'fileB.md'))).resolves.toBeUndefined();
    await expect(fs.access(sourceDir)).rejects.toThrow();
  });

  it('returns success for in-place move without altering file', async () => {
    const sourceFile = path.join(tempDir, 'fileA.md');
    const result = await moveItem(sourceFile, tempDir);

    expect(result.success).toBe(true);
    expect(result.newPath).toBe(sourceFile);
    await expect(fs.access(sourceFile)).resolves.toBeUndefined();
  });

  it('rejects moving a folder into itself', async () => {
    const sourceDir = path.join(tempDir, 'dir2');
    const result = await moveItem(sourceDir, sourceDir);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/不能将文件夹移动到其自身或子文件夹中|Cannot move/);
  });

  it('rejects moving a folder into its own subfolder (circular containment prevention)', async () => {
    const sourceDir = path.join(tempDir, 'dir2');
    const targetSubDir = path.join(tempDir, 'dir2', 'subDir2');

    const result = await moveItem(sourceDir, targetSubDir);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/不能将文件夹移动到其自身或子文件夹中|Cannot move/);
  });

  it('rejects moving when a file or folder with the same name already exists in target directory', async () => {
    // Create conflicting file in dir1
    await fs.writeFile(path.join(tempDir, 'dir1', 'fileA.md'), '# Existing fileA', 'utf-8');

    const sourceFile = path.join(tempDir, 'fileA.md');
    const targetDir = path.join(tempDir, 'dir1');

    const result = await moveItem(sourceFile, targetDir);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/已存在同名|already exists/);
  });

  it('returns error when source file does not exist', async () => {
    const nonExistent = path.join(tempDir, 'not-found.md');
    const targetDir = path.join(tempDir, 'dir1');

    const result = await moveItem(nonExistent, targetDir);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns error when target directory does not exist or is not a directory', async () => {
    const sourceFile = path.join(tempDir, 'fileA.md');
    const nonExistentDir = path.join(tempDir, 'non-existent-dir');

    const result = await moveItem(sourceFile, nonExistentDir);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
