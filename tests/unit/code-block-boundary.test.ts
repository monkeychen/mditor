import { describe, it, expect } from 'vitest';
import { Editor, defaultValueCtx, rootCtx, editorViewCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { Selection } from '@milkdown/prose/state';
import {
  handleCodeBlockArrowUp,
  handleCodeBlockArrowDown,
} from '../../src/renderer/editor/wysiwyg/code/codeBlockKeymap';

const CODE_DOC_MD = `
\`\`\`typescript
line1
line2
line3
\`\`\`
`.trim();

describe('CodeBlock Boundary Arrow Navigation (T214 / AC-12.4)', () => {
  it('exits code block upwards on first line, creating paragraph if at doc start', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, container);
        ctx.set(defaultValueCtx, CODE_DOC_MD);
      })
      .use(commonmark)
      .use(gfm)
      .create();

    const view = editor.action((ctx) => ctx.get(editorViewCtx));
    expect(view).toBeDefined();

    // 找到 code_block 节点
    let codePos = -1;
    view.state.doc.descendants((node, pos) => {
      if (node.type.name === 'code_block' && codePos === -1) {
        codePos = pos;
        return false;
      }
    });

    expect(codePos).toBeGreaterThanOrEqual(0);

    // 1. 光标置于首行 (line1 中的 'l')
    const firstLinePos = codePos + 1;
    view.dispatch(view.state.tr.setSelection(Selection.near(view.state.doc.resolve(firstLinePos))));

    // 在首行按 ArrowUp：应该跳出并自动在文档最前部创建空段落
    const handledUp = handleCodeBlockArrowUp(view.state, view.dispatch);
    expect(handledUp).toBe(true);

    // 验证文档第 0 个节点变成了 paragraph，光标进入了 paragraph
    expect(view.state.doc.child(0).type.name).toBe('paragraph');
    expect(view.state.selection.$from.parent.type.name).toBe('paragraph');

    // 2. 将光标定位在末行 (line3)
    // 重新查找 code_block 节点位置
    let newCodePos = -1;
    view.state.doc.descendants((node, pos) => {
      if (node.type.name === 'code_block' && newCodePos === -1) {
        newCodePos = pos;
        return false;
      }
    });

    const codeNode = view.state.doc.nodeAt(newCodePos)!;
    const lastLinePos = newCodePos + codeNode.nodeSize - 2; // 末行位置
    view.dispatch(view.state.tr.setSelection(Selection.near(view.state.doc.resolve(lastLinePos))));

    // 在末行按 ArrowDown：应该跳出并在后方追加空段落
    const handledDown = handleCodeBlockArrowDown(view.state, view.dispatch);
    expect(handledDown).toBe(true);

    // 验证代码块后追加了 paragraph，且光标在后方段落中
    const lastNode = view.state.doc.lastChild!;
    expect(lastNode.type.name).toBe('paragraph');
    expect(view.state.selection.$from.parent.type.name).toBe('paragraph');

    // 3. 测试中间行：把光标放回中间行 line2
    let codePos3 = -1;
    view.state.doc.descendants((node, pos) => {
      if (node.type.name === 'code_block' && codePos3 === -1) {
        codePos3 = pos;
        return false;
      }
    });
    // line2 位于中间，大约 codePos3 + 7
    const middleLinePos = codePos3 + 7;
    view.dispatch(view.state.tr.setSelection(Selection.near(view.state.doc.resolve(middleLinePos))));

    // 中间行按 ArrowUp 或 ArrowDown 应该返回 false（不拦截，允许默认多行光标移动）
    expect(handleCodeBlockArrowUp(view.state, view.dispatch)).toBe(false);
    expect(handleCodeBlockArrowDown(view.state, view.dispatch)).toBe(false);

    editor.destroy();
    document.body.removeChild(container);
  });
});
