import { Plugin, PluginKey } from '@milkdown/prose/state';

export const mathKeymapPluginKey = new PluginKey('mditor_math_keymap_plugin');

export function createMathKeymapPlugin(): Plugin {
  return new Plugin({
    key: mathKeymapPluginKey,
    props: {
      handleKeyDown(view, event) {
        const isMod = event.metaKey || event.ctrlKey;
        const keyLower = event.key ? event.key.toLowerCase() : '';

        // 1. 快捷键 ⌥⌘M (或 Alt+Ctrl+M): 插入或包裹行内公式
        if (isMod && event.altKey && (keyLower === 'm' || event.code === 'KeyM')) {
          event.preventDefault();
          const { state, dispatch } = view;
          const { selection, schema } = state;
          const inlineMathType = schema.nodes.inline_math;
          if (!inlineMathType) return false;

          const { from, to } = selection;
          const selectedText = from !== to ? state.doc.textBetween(from, to) : '';
          const node = inlineMathType.create({ value: selectedText || 'f(x)' });
          const tr = state.tr.replaceSelectionWith(node);
          dispatch(tr.scrollIntoView());
          return true;
        }

        // 2. 行首输入 $$ 并按回车 -> 转换为独立公式块
        if (event.key === 'Enter' && !event.shiftKey && !event.altKey && !isMod) {
          const { state, dispatch } = view;
          const { selection, schema } = state;
          const { $from } = selection;
          const parent = $from.parent;

          if (parent.type.name === 'paragraph' && parent.textContent.trim() === '$$') {
            const mathBlockType = schema.nodes.math_block;
            if (mathBlockType) {
              event.preventDefault();
              const mathNode = mathBlockType.create({ value: '' });

              // 尝试直接替换当前段落
              try {
                const startPos = $from.before();
                const tr = state.tr.replaceWith(
                  startPos,
                  startPos + parent.nodeSize,
                  mathNode
                );
                dispatch(tr.scrollIntoView());
                return true;
              } catch {
                // 如果父级容器（如 list_item）对子节点类型有约束，替换外层列表项节点以提升为独立公式块
                try {
                  const ancestorDepth = $from.depth - 1;
                  const ancestorPos = $from.before(ancestorDepth);
                  const ancestorNode = $from.node(ancestorDepth);
                  const tr = state.tr.replaceWith(
                    ancestorPos,
                    ancestorPos + ancestorNode.nodeSize,
                    mathNode
                  );
                  dispatch(tr.scrollIntoView());
                  return true;
                } catch (e) {
                  console.error('[MathKeymap] Failed to insert math block:', e);
                }
              }
            }
          }
        }

        return false;
      },
    },
  });
}
