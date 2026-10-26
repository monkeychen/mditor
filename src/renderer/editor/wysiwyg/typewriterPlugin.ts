import { Plugin } from '@milkdown/prose/state';

/**
 * 打字机滚动模式插件（Typewriter Mode）：
 * 当外层开启 `.typewriter-mode-enabled` 时，在光标移动或输入文本时自动将当前行保持在滚动视口垂直中心。
 */
export function createTypewriterPlugin(): Plugin {
  return new Plugin({
    view() {
      return {
        update(view, prevState) {
          const container = view.dom.closest('.milkdown-wysiwyg-container') as HTMLElement | null;
          if (!container || !container.classList.contains('typewriter-mode-enabled')) {
            return;
          }

          const selectionChanged = !prevState.selection.eq(view.state.selection);
          const docChanged = !prevState.doc.eq(view.state.doc);
          if (!selectionChanged && !docChanged) {
            return;
          }

          try {
            const coords = view.coordsAtPos(view.state.selection.head);
            const containerRect = container.getBoundingClientRect();
            const targetY = containerRect.top + containerRect.height / 2;
            const deltaY = coords.top - targetY;

            if (Math.abs(deltaY) > 16) {
              container.scrollBy({
                top: deltaY,
                behavior: 'smooth',
              });
            }
          } catch {
            // 忽略在 DOM 尚未完成布局时的坐标计算异常
          }
        },
      };
    },
  });
}
