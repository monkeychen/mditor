import { Plugin, PluginKey } from '@milkdown/prose/state';

export const mathKeymapPluginKey = new PluginKey('mditor_math_keymap_plugin');

export function createMathKeymapPlugin(): Plugin {
  return new Plugin({
    key: mathKeymapPluginKey,
    props: {
      handleKeyDown(view, event) {
        const isMod = event.metaKey || event.ctrlKey;
        const keyLower = event.key ? event.key.toLowerCase() : '';

        // 1. 快捷键 ⌥⌘M (或 Alt+Ctrl+M): 智能公式插入 (全面对标 Typora 行为)
        if (isMod && event.altKey && (keyLower === 'm' || event.code === 'KeyM')) {
          event.preventDefault();
          const { state, dispatch } = view;
          const { selection, schema } = state;
          const { from, to } = selection;
          const selectedText = from !== to ? state.doc.textBetween(from, to).trim() : '';

          if (selectedText) {
            // 选中文本时，视为行内公式包裹
            const inlineMathType = schema.nodes.inline_math;
            if (inlineMathType) {
              const node = inlineMathType.create({ value: selectedText });
              const tr = state.tr.replaceSelectionWith(node);
              dispatch(tr.scrollIntoView());
              return true;
            }
          } else {
            // 未选中文本时，创建独立公式块 (Math Block)
            const mathBlockType = schema.nodes.math_block;
            if (mathBlockType) {
              const node = mathBlockType.create({
                value: '\\int_{-\\infty}^{+\\infty} e^{-x^2} dx = \\sqrt{\\pi}',
              });
              const tr = state.tr.replaceSelectionWith(node);
              dispatch(tr.scrollIntoView());
              return true;
            }
          }
        }

        // 2. 行首输入 $$ 或 $$ formula $$ 并按回车 -> 转换为独立公式块
        if (event.key === 'Enter' && !event.shiftKey && !event.altKey && !isMod) {
          const { state, dispatch } = view;
          const { selection, schema } = state;
          const { $from } = selection;
          const parent = $from.parent;

          if (parent.type.name === 'paragraph') {
            const text = parent.textContent.trim();
            const mathBlockType = schema.nodes.math_block;

            if (mathBlockType && (text === '$$' || /^\$\$[\s\S]+\$\$$/.test(text))) {
              event.preventDefault();
              let formulaValue = '';
              const match = text.match(/^\$\$([\s\S]+)\$\$$/);
              if (match) {
                formulaValue = match[1].trim();
              } else {
                formulaValue = '\\int_{-\\infty}^{+\\infty} e^{-x^2} dx = \\sqrt{\\pi}';
              }

              const mathNode = mathBlockType.create({ value: formulaValue });

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
