import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { Editor, defaultValueCtx, rootCtx, editorViewCtx, serializerCtx, remarkStringifyOptionsCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';

const REAL_DOC_PATH = '/Users/chenzhian/cmcc/002-自主研发/001-工作计划/2026/016-数据共享平台v2/03-数据共享平台建设与运营方案-阶段汇报稿-v0.3.0.md';

describe('Real-World Production Document Verification', () => {
  const original = fs.readFileSync(REAL_DOC_PATH, 'utf8').trim();

  it('successfully mounts and parses the enterprise architecture document', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, container);
        ctx.set(defaultValueCtx, original);
        ctx.update(remarkStringifyOptionsCtx, (prev) => ({
          ...prev,
          bullet: '-' as const,
          rule: '-' as const,
          emphasis: '*' as const,
          strong: '*' as const,
        }));
      })
      .use(commonmark)
      .use(gfm)
      .create();

    const view = editor.action((ctx) => ctx.get(editorViewCtx));
    expect(view).toBeDefined();

    // 验证文档根节点包含子节点且大小符合预期
    expect(view.state.doc.childCount).toBeGreaterThan(10);

    // 统计各块节点数量
    let headingCount = 0;
    let tableCount = 0;
    let imageCount = 0;
    let blockquoteCount = 0;

    view.state.doc.descendants((node) => {
      if (node.type.name === 'heading') headingCount++;
      if (node.type.name === 'table') tableCount++;
      if (node.type.name === 'image') imageCount++;
      if (node.type.name === 'blockquote') blockquoteCount++;
    });

    console.log(`[Document Stats] Headings: ${headingCount}, Tables: ${tableCount}, Images: ${imageCount}, Blockquotes: ${blockquoteCount}`);

    expect(headingCount).toBeGreaterThanOrEqual(10);
    expect(tableCount).toBeGreaterThanOrEqual(4);
    expect(imageCount).toBeGreaterThanOrEqual(8);
    expect(blockquoteCount).toBeGreaterThanOrEqual(1);

    // 验证序列化输出
    const serialized = editor.action((ctx) => {
      const v = ctx.get(editorViewCtx);
      const serializer = ctx.get(serializerCtx);
      return serializer(v.state.doc);
    }).trim();

    fs.writeFileSync('/tmp/real-doc-original.md', original);
    fs.writeFileSync('/tmp/real-doc-serialized.md', serialized);

    editor.destroy();
    document.body.removeChild(container);

    // 比对关键业务内容是否存在
    expect(serialized).toContain('# 新一代数据共享平台建设与运营方案');
    expect(serialized).toContain('L01');
    expect(serialized).toContain('五域五层两翼总体架构');
    expect(serialized).toContain('以用促准：用智能应用反馈检验归集与语义');
  });
});
