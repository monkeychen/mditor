import { describe, it, expect } from 'vitest';
import { Editor, defaultValueCtx, rootCtx, editorViewCtx, serializerCtx, prosePluginsCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { resolveImageSource, createImageWidgetPlugin } from '../../src/renderer/editor/wysiwyg/image/imageWidgetPlugin';

describe('Image Widget & Multi-Source Path Resolution (T215 / AC-13.1 ~ AC-13.3)', () => {
  it('correctly resolves relative, absolute, and web image URLs', () => {
    // 1. 网络图片
    expect(resolveImageSource('https://cdn.example.com/avatar.png', null)).toBe('https://cdn.example.com/avatar.png');
    expect(resolveImageSource('http://cdn.example.com/avatar.png', '/Users/test/doc.md')).toBe('http://cdn.example.com/avatar.png');

    // 2. 本地绝对路径
    expect(resolveImageSource('/Users/test/pic.png', null)).toBe('file:///Users/test/pic.png');
    expect(resolveImageSource('file:///Users/test/pic.png', null)).toBe('file:///Users/test/pic.png');

    // 3. 本地相对路径 (基于 docFilePath)
    const docPath = '/Users/chenzhian/workspace/project/README.md';
    expect(resolveImageSource('./assets/logo.png', docPath)).toBe('file:///Users/chenzhian/workspace/project/assets/logo.png');
    expect(resolveImageSource('assets/logo.png', docPath)).toBe('file:///Users/chenzhian/workspace/project/assets/logo.png');
  });

  it('renders custom ImageView and handles image error with placeholder card', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const docPath = '/Users/chenzhian/workspace/ai/mditor/docs/spec.md';
    const sampleMd = `![示例图](./assets/non-existent.png)`;

    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, container);
        ctx.set(defaultValueCtx, sampleMd);
        ctx.update(prosePluginsCtx, (prev) => [
          ...prev,
          createImageWidgetPlugin(() => docPath),
        ]);
      })
      .use(commonmark)
      .use(gfm)
      .create();

    const view = editor.action((ctx) => ctx.get(editorViewCtx));
    expect(view).toBeDefined();

    // 验证渲染了自定义图片包装容器
    const wrapper = container.querySelector('.image-widget-wrapper');
    expect(wrapper).not.toBeNull();

    // 验证源码悬浮卡片存在且展示 Markdown 图片语法
    const pill = container.querySelector('.image-source-pill');
    expect(pill).not.toBeNull();
    expect(pill?.textContent).toContain('![示例图](./assets/non-existent.png)');

    // 验证初始 img 节点存在且 src 解析为 file:// 绝对路径
    const img = wrapper?.querySelector('img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.src).toBe('file:///Users/chenzhian/workspace/ai/mditor/docs/assets/non-existent.png');

    // 模拟图片加载失败触发 error 事件
    img.dispatchEvent(new Event('error'));

    // 验证错误占位卡片被激活显示
    const errorCard = wrapper?.querySelector('.image-error-card');
    expect(errorCard).not.toBeNull();
    expect(errorCard?.textContent).toContain('图片无法加载');
    expect(errorCard?.textContent).toContain('./assets/non-existent.png');

    // 验证能够更新图片属性
    let imgPos = -1;
    view.state.doc.descendants((node, pos) => {
      if (node.type.name === 'image' && imgPos === -1) {
        imgPos = pos;
        return false;
      }
    });

    const tr = view.state.tr.setNodeMarkup(imgPos, undefined, {
      src: 'https://images.unsplash.com/photo-1.png',
      alt: '新网络图片',
    });
    view.dispatch(tr);

    const serialized = editor.action((ctx) => {
      const v = ctx.get(editorViewCtx);
      const serializer = ctx.get(serializerCtx);
      return serializer(v.state.doc);
    });

    expect(serialized).toContain('![新网络图片](https://images.unsplash.com/photo-1.png)');

    editor.destroy();
    document.body.removeChild(container);
  });
});
