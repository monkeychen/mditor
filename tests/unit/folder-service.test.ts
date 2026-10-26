import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { scanMarkdownDirectory, readMarkdownFileByPath } from '../../src/main/folderService';

describe('Folder Tree & File Reader Service (T301 / AC-15.2)', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mditor-folder-test-'));
    // 创建测试文件与子目录
    await fs.writeFile(path.join(tempDir, '01-intro.md'), '# Intro', 'utf-8');
    await fs.writeFile(path.join(tempDir, '02-guide.markdown'), '# Guide', 'utf-8');
    await fs.writeFile(path.join(tempDir, 'image.png'), 'binary', 'utf-8');
    await fs.mkdir(path.join(tempDir, '.git'));
    await fs.writeFile(path.join(tempDir, '.git', 'config.md'), 'hidden', 'utf-8');

    const subDir = path.join(tempDir, 'docs');
    await fs.mkdir(subDir);
    await fs.writeFile(path.join(subDir, 'nested.md'), '# Nested Doc', 'utf-8');
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('scans directory recursively for markdown files and ignores hidden/non-md files', async () => {
    const tree = await scanMarkdownDirectory(tempDir);

    // 应包含 docs 目录、01-intro.md、02-guide.markdown，且不包含 .git 与 image.png
    expect(tree.length).toBe(3);

    // 文件夹排在前面
    expect(tree[0].name).toBe('docs');
    expect(tree[0].isDirectory).toBe(true);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children?.[0].name).toBe('nested.md');

    // 文件按名称排序
    expect(tree[1].name).toBe('01-intro.md');
    expect(tree[1].isDirectory).toBe(false);
    expect(tree[2].name).toBe('02-guide.markdown');
  });

  it('reads markdown file by path directly', async () => {
    const target = path.join(tempDir, '01-intro.md');
    const result = await readMarkdownFileByPath(target);

    expect(result).not.toBeNull();
    expect(result?.fileName).toBe('01-intro.md');
    expect(result?.filePath).toBe(target);
    expect(result?.content).toBe('# Intro');
  });
});
