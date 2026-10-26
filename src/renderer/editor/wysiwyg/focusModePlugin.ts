import { Plugin } from '@milkdown/prose/state';
import { Decoration, DecorationSet } from '@milkdown/prose/view';

/**
 * 专注模式插件（Focus Mode）：
 * 为当前光标所在的顶层块节点（depth === 1）附加 `focus-mode-active` 类名。
 * 当外层开启 `.focus-mode-enabled` 时，非活动顶层块淡化（opacity: 0.25），活动块 100% 清晰。
 */
export function createFocusModePlugin(): Plugin {
  return new Plugin({
    props: {
      decorations(state) {
        const { doc, selection } = state;
        const { $from } = selection;

        if ($from.depth >= 1) {
          const start = $from.before(1);
          const end = $from.after(1);
          return DecorationSet.create(doc, [
            Decoration.node(start, end, {
              class: 'focus-mode-active',
            }),
          ]);
        }

        return DecorationSet.empty;
      },
    },
  });
}
