import { Plugin, PluginKey, TextSelection } from '@milkdown/prose/state';

export const autoPairPluginKey = new PluginKey('mditor_auto_pair_plugin');

const PAIRS: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
  '"': '"',
  "'": "'",
  '`': '`',
};

const CLOSING_CHARS = new Set([')', ']', '}', '"', "'", '`']);

export function createAutoPairPlugin(): Plugin {
  return new Plugin({
    key: autoPairPluginKey,
    props: {
      handleKeyDown(view, event) {
        // 忽略组合键快捷键（例如 ⌘B, Ctrl+C 等）
        if (event.metaKey || event.ctrlKey || event.altKey) {
          return false;
        }

        const { state, dispatch } = view;
        const { selection } = state;
        const { from, to, empty } = selection;
        const key = event.key;

        // 1. 成对符号自动包裹或补全
        if (PAIRS[key]) {
          const close = PAIRS[key];

          if (!empty) {
            // 有选区：自动包裹选区内容
            const text = state.doc.textBetween(from, to);
            const wrappedText = key + text + close;
            const tr = state.tr.replaceWith(from, to, state.schema.text(wrappedText));
            // 选区保持包裹内容
            tr.setSelection(TextSelection.create(tr.doc, from + 1, to + 1));
            dispatch(tr);
            return true;
          } else {
            // 无选区：补全成对字符，并将光标置于中间
            const tr = state.tr.insertText(key + close, from);
            tr.setSelection(TextSelection.create(tr.doc, from + 1));
            dispatch(tr);
            return true;
          }
        }

        // 2. 闭合符跳过 (Overtype)
        if (CLOSING_CHARS.has(key) && empty && from < state.doc.content.size) {
          const nextChar = state.doc.textBetween(from, from + 1);
          if (nextChar === key) {
            // 光标直接向后移动一位
            const tr = state.tr.setSelection(TextSelection.create(state.doc, from + 1));
            dispatch(tr);
            return true;
          }
        }

        return false;
      },
    },
  });
}
