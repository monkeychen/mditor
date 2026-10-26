import { describe, it, expect, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { generateStandaloneHtml } from '../../src/renderer/utils/htmlExporter';

describe('Export Pipeline Integration (AC7.1, AC7.2)', () => {
  const tempDir = path.join(os.tmpdir(), `mditor-export-test-${Date.now()}`);

  afterAll(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('exports valid standalone html file to local disk', async () => {
    await fs.mkdir(tempDir, { recursive: true });
    const markdown = '# 导出报告\n\n- 自动化测试通过\n- 性能无损';
    const html = generateStandaloneHtml('测试文档', markdown);

    const targetFile = path.join(tempDir, 'output.html');
    await fs.writeFile(targetFile, html, 'utf-8');

    const stat = await fs.stat(targetFile);
    expect(stat.isFile()).toBe(true);
    expect(stat.size).toBeGreaterThan(100);

    const content = await fs.readFile(targetFile, 'utf-8');
    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('导出报告');
    expect(content).toContain('性能无损');
  });
});
