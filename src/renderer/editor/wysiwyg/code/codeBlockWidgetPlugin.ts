import { Plugin, PluginKey } from '@milkdown/prose/state';
import type { Node } from '@milkdown/prose/model';
import type { EditorView } from '@milkdown/prose/view';
import { CodeBlockView } from './CodeBlockView';

export const codeBlockWidgetPluginKey = new PluginKey('MDITOR_CODE_BLOCK_WIDGET');

export function createCodeBlockWidgetPlugin(): Plugin {
  return new Plugin({
    key: codeBlockWidgetPluginKey,
    props: {
      nodeViews: {
        code_block: (
          node: Node,
          view: EditorView,
          getPos: () => number | undefined
        ) => {
          return new CodeBlockView(node, view, getPos);
        },
      },
    },
  });
}
