import { Plugin, PluginKey } from '@milkdown/prose/state';

export const formatKeymapPluginKey = new PluginKey('mditor_format_keymap_plugin');

export function createFormatKeymapPlugin(): Plugin {
  return new Plugin({
    key: formatKeymapPluginKey,
    props: {
      handleKeyDown(view, event) {
        const isMod = event.metaKey || event.ctrlKey;
        if (!isMod || event.shiftKey || event.altKey) {
          return false;
        }

        const { state, dispatch } = view;
        const { schema, selection } = state;
        const { from, to } = selection;

        // 1. Mod-1 ~ Mod-6: 转换为 Heading 1 ~ 6
        if (event.key >= '1' && event.key <= '6') {
          const level = parseInt(event.key, 10);
          const headingType = schema.nodes.heading;
          if (!headingType) return false;

          let tr = state.tr;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.isBlock && (node.type.name === 'paragraph' || node.type.name === 'heading')) {
              tr = tr.setNodeMarkup(pos, headingType, { level });
            }
          });
          dispatch(tr);
          return true;
        }

        // 2. Mod-0: 转换为普通段落 Paragraph
        if (event.key === '0') {
          const paragraphType = schema.nodes.paragraph;
          if (!paragraphType) return false;

          let tr = state.tr;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.isBlock && node.type.name === 'heading') {
              tr = tr.setNodeMarkup(pos, paragraphType, {});
            }
          });
          dispatch(tr);
          return true;
        }

        return false;
      },
    },
  });
}
