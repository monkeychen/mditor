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
    await fs.writeFile(path.join(tempDir, 'server.py'), 'print("hello")', 'utf-8');
    await fs.writeFile(path.join(tempDir, 'config.json'), '{"port": 8080}', 'utf-8');
    await fs.writeFile(path.join(tempDir, 'query.sql'), 'SELECT * FROM users;', 'utf-8');
    await fs.writeFile(path.join(tempDir, 'app.log'), '[INFO] started', 'utf-8');
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

  it('scans directory recursively for markdown, code, data, and text files and ignores hidden/binary files', async () => {
    const tree = await scanMarkdownDirectory(tempDir);

    // 应包含 docs 目录，以及 01-intro.md, 02-guide.markdown, app.log, config.json, query.sql, server.py (共 1 个目录 + 6 个文本/代码文件 = 7 项)
    // 且不包含 .git 与 image.png
    expect(tree.length).toBe(7);

    // 文件夹排在前面
    expect(tree[0].name).toBe('docs');
    expect(tree[0].isDirectory).toBe(true);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children?.[0].name).toBe('nested.md');

    // 文件名按名称排序
    const fileNames = tree.slice(1).map((n) => n.name);
    expect(fileNames).toContain('01-intro.md');
    expect(fileNames).toContain('02-guide.markdown');
    expect(fileNames).toContain('app.log');
    expect(fileNames).toContain('config.json');
    expect(fileNames).toContain('query.sql');
    expect(fileNames).toContain('server.py');
    expect(fileNames).not.toContain('image.png');
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
