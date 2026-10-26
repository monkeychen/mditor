import { describe, it, expect, vi } from 'vitest';
import { Editor, defaultValueCtx, rootCtx, editorViewCtx, prosePluginsCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { createImagePastePlugin } from '../../src/renderer/editor/wysiwyg/image/imagePastePlugin';
import * as imageService from '../../src/renderer/services/imageService';

describe('Image Paste & Drop Auto-Save Plugin (T216 / AC-13.4)', () => {
  it('handles paste event with image data and inserts image node', async () => {
    const saveClipboardImageSpy = vi
      .spyOn(imageService, 'saveClipboardImage')
      .mockResolvedValue('./assets/pasted-test.png');

    const container = document.createElement('div');
    document.body.appendChild(container);

    const docPath = '/Users/test/workspace/doc.md';

    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, container);
        ctx.set(defaultValueCtx, '正文段落');
        ctx.update(prosePluginsCtx, (prev) => [
          ...prev,
          createImagePastePlugin(() => docPath),
        ]);
      })
      .use(commonmark)
      .use(gfm)
      .create();

    const view = editor.action((ctx) => ctx.get(editorViewCtx));

    // 构造包含图片的 Paste 事件
    const mockFile = new File(['fake-image-bytes'], 'screenshot.png', { type: 'image/png' });
    const mockItem = {
      type: 'image/png',
      getAsFile: () => mockFile,
    };
    const pasteEvent = new Event('paste') as unknown as ClipboardEvent;
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: {
        items: [mockItem],
      },
    });

    // 触发 ProseMirror 的 paste handler
    const handled = view.someProp('handlePaste', (f) => f(view, pasteEvent, view.state.selection.content()));
    expect(handled).toBe(true);

    expect(saveClipboardImageSpy).toHaveBeenCalledWith(docPath, mockFile);

    // 等待异步落盘与插入
    await vi.waitFor(() => {
      let foundImage = false;
      view.state.doc.descendants((node) => {
        if (node.type.name === 'image' && node.attrs.src === './assets/pasted-test.png') {
          foundImage = true;
        }
      });
      expect(foundImage).toBe(true);
    });

    editor.destroy();
    document.body.removeChild(container);
  });
});
