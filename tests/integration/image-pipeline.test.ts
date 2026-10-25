import { describe, it, expect, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { saveImageBufferToDisk, copyLocalImageToAssets } from '../../src/main/imageService';

describe('Image Local Pipeline Integration (AC4.1, AC4.2)', () => {
  const tempDir = path.join(os.tmpdir(), `mditor-img-test-${Date.now()}`);
  const sampleDocPath = path.join(tempDir, 'docs', 'my-post.md');

  afterAll(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('creates ./assets/ in doc directory and writes png buffer', async () => {
    await fs.mkdir(path.dirname(sampleDocPath), { recursive: true });
    await fs.writeFile(sampleDocPath, '# Post', 'utf-8');

    // 模拟一段 png buffer (简单字节)
    const fakePng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    const result = await saveImageBufferToDisk(sampleDocPath, fakePng);
    expect(result.success).toBe(true);
    expect(result.relativePath).toMatch(/^\.\/assets\/img-\d{8}-\d{6}-[a-z0-9]+\.png$/);

    // 检查实际文件是否写到磁盘
    const exists = await fs.stat(result.absolutePath);
    expect(exists.isFile()).toBe(true);
  });

  it('falls back to user cache directory when docPath is null', async () => {
    const fakePng = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

    const result = await saveImageBufferToDisk(null, fakePng);
    expect(result.success).toBe(true);
    expect(result.absolutePath).toContain('.mditor');

    const exists = await fs.stat(result.absolutePath);
    expect(exists.isFile()).toBe(true);
  });

  it('copies external image file to ./assets/', async () => {
    const externalImg = path.join(tempDir, 'external.jpg');
    await fs.writeFile(externalImg, 'fake-jpeg-data');

    const result = await copyLocalImageToAssets(sampleDocPath, externalImg);
    expect(result.success).toBe(true);
    expect(result.relativePath).toMatch(/^\.\/assets\/img-.*\.jpg$/);

    const exists = await fs.stat(result.absolutePath);
    expect(exists.isFile()).toBe(true);
  });
});
