import { Plugin, PluginKey } from '@milkdown/prose/state';
import type { Node } from '@milkdown/prose/model';
import type { EditorView } from '@milkdown/prose/view';
import { ImageView, resolveImageSource } from './ImageView';

export { resolveImageSource };

export const imageWidgetPluginKey = new PluginKey('MDITOR_IMAGE_WIDGET');

export function createImageWidgetPlugin(getDocFilePath: () => string | null): Plugin {
  return new Plugin({
    key: imageWidgetPluginKey,
    props: {
      nodeViews: {
        image: (
          node: Node,
          view: EditorView,
          getPos: () => number | undefined
        ) => {
          return new ImageView(node, view, getPos, getDocFilePath);
        },
      },
    },
  });
}
