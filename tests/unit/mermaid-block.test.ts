import { describe, it, expect } from 'vitest';
import { Editor, rootCtx, defaultValueCtx, editorViewCtx, serializerCtx, prosePluginsCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { createCodeBlockWidgetPlugin } from '../../src/renderer/editor/wysiwyg/code/codeBlockWidgetPlugin';

describe('Mermaid Code Block Integration (T202 / T203 / AC-20.1 ~ AC-20.3)', () => {
  it('renders mermaid code block with SVG diagram container and interactive toolbar', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const inputMd = '```mermaid\ngraph TD\n  A[客户端] --> B[服务端]\n```';

    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, container);
        ctx.set(defaultValueCtx, inputMd);
        ctx.update(prosePluginsCtx, (prev) => [
          ...prev,
          createCodeBlockWidgetPlugin(),
        ]);
      })
      .use(commonmark)
      .use(gfm)
      .create();

    const view = editor.action((ctx) => ctx.get(editorViewCtx));
    expect(view).toBeDefined();

    // 验证 AST 存在 language 为 mermaid 的 code_block 节点
    let hasMermaidNode = false;
    view.state.doc.descendants((node) => {
      if (node.type.name === 'code_block' && node.attrs.language === 'mermaid') {
        hasMermaidNode = true;
      }
    });
    expect(hasMermaidNode).toBe(true);

    // 轮询等待异步 Mermaid 渲染完成（兼容高并发测试运行环境）
    const mermaidWrapper = container.querySelector('.mermaid-block-wrapper');
    expect(mermaidWrapper).not.toBeNull();

    const diagramContainer = mermaidWrapper?.querySelector('.mermaid-diagram-container');
    expect(diagramContainer).not.toBeNull();

    let svgEl: SVGElement | null = null;
    const start = Date.now();
    while (Date.now() - start < 3000) {
      svgEl = diagramContainer?.querySelector('svg') || null;
      if (svgEl) break;
      await new Promise((r) => setTimeout(r, 50));
    }
    expect(svgEl).not.toBeNull();

    // 验证操作按钮与编辑抽屉
    const toggleBtn = mermaidWrapper?.querySelector('.mermaid-toggle-source-btn') as HTMLButtonElement | null;
    expect(toggleBtn).not.toBeNull();

    // 验证序列化回 Markdown 的保真度
    const serialized = editor.action((ctx) => {
      const v = ctx.get(editorViewCtx);
      const serializer = ctx.get(serializerCtx);
      return serializer(v.state.doc);
    });

    expect(serialized).toContain('```mermaid');
    expect(serialized).toContain('graph TD');
    expect(serialized).toContain('A[客户端] --> B[服务端]');

    editor.destroy();
    document.body.removeChild(container);
  });
});
