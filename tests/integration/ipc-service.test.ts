import { describe, it, expect, afterAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Local File I/O Integration', () => {
  const tempDir = path.join(os.tmpdir(), `mditor-test-${Date.now()}`);
  const tempFile = path.join(tempDir, 'sample.md');

  afterAll(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  it('writes and reads real markdown file with utf-8 encoding', async () => {
    await fs.mkdir(tempDir, { recursive: true });
    const content = '# 标题\n\n测试中文与 UTF-8 内容保存。';
    await fs.writeFile(tempFile, content, 'utf-8');

    const readBack = await fs.readFile(tempFile, 'utf-8');
    expect(readBack).toBe(content);
  });
});
