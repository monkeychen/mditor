import { Range, EditorState, Extension } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  ViewPlugin,
  ViewUpdate,
  EditorView,
  WidgetType,
} from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';

// 任务复选框 Widget
class TaskWidget extends WidgetType {
  constructor(readonly checked: boolean, readonly pos: number) {
    super();
  }

  toDOM(view: EditorView): HTMLElement {
    const wrap = document.createElement('span');
    wrap.className = 'cm-live-task-widget';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = this.checked;
    input.className = 'w-4 h-4 rounded text-amber-600 focus:ring-0 border-stone-300 align-middle cursor-pointer mr-1.5';

    input.addEventListener('click', (e) => {
      e.stopPropagation();
      const newMarker = this.checked ? '[ ]' : '[x]';
      view.dispatch({
        changes: {
          from: this.pos,
          to: this.pos + 3,
          insert: newMarker,
        },
      });
    });

    wrap.appendChild(input);
    return wrap;
  }
}

export function computeLiveDecorations(state: EditorState): DecorationSet {
  const widgets: Range<Decoration>[] = [];
  const head = state.selection.main.head;
  const cursorLine = state.doc.lineAt(head);

  syntaxTree(state).iterate({
    enter: (node) => {
      const { name, from, to } = node;
      const nodeLine = state.doc.lineAt(from);
      const isCursorOnLine = cursorLine.number === nodeLine.number;

      // 标题处理 ATXHeading1 - ATXHeading6
      if (name.startsWith('ATXHeading')) {
        const level = parseInt(name.replace('ATXHeading', ''), 10) || 1;
        const lineDeco = Decoration.line({
          class: `cm-live-h${level}`,
        });
        widgets.push(lineDeco.range(nodeLine.from));

        if (!isCursorOnLine) {
          // 查找 HeaderMark 子节点 (如 '# ')
          const markNode = node.node.firstChild;
          if (markNode && markNode.name === 'HeaderMark') {
            // 包含 mark 后紧跟的空格
            const endPos = Math.min(markNode.to + 1, to);
            widgets.push(
              Decoration.replace({
                isPrefixHide: true,
              }).range(markNode.from, endPos)
            );
          }
        }
      }

      // 加粗处理 StrongEmphasis (**bold**)
      if (name === 'StrongEmphasis') {
        const isCursorInside = head >= from && head <= to;
        if (!isCursorInside) {
          const firstMark = node.node.firstChild;
          const lastMark = node.node.lastChild;
          if (firstMark && lastMark && firstMark !== lastMark) {
            widgets.push(Decoration.replace({ isPrefixHide: true }).range(firstMark.from, firstMark.to));
            widgets.push(
              Decoration.mark({ class: 'cm-live-bold' }).range(firstMark.to, lastMark.from)
            );
            widgets.push(Decoration.replace({ isPrefixHide: true }).range(lastMark.from, lastMark.to));
          }
        }
      }

      // 斜体处理 Emphasis (*italic*)
      if (name === 'Emphasis') {
        const isCursorInside = head >= from && head <= to;
        if (!isCursorInside) {
          const firstMark = node.node.firstChild;
          const lastMark = node.node.lastChild;
          if (firstMark && lastMark && firstMark !== lastMark) {
            widgets.push(Decoration.replace({ isPrefixHide: true }).range(firstMark.from, firstMark.to));
            widgets.push(
              Decoration.mark({ class: 'cm-live-italic' }).range(firstMark.to, lastMark.from)
            );
            widgets.push(Decoration.replace({ isPrefixHide: true }).range(lastMark.from, lastMark.to));
          }
        }
      }

      // 行内代码 InlineCode (`code`)
      if (name === 'InlineCode') {
        const isCursorInside = head >= from && head <= to;
        if (!isCursorInside) {
          const firstMark = node.node.firstChild;
          const lastMark = node.node.lastChild;
          if (firstMark && lastMark && firstMark !== lastMark) {
            widgets.push(Decoration.replace({ isPrefixHide: true }).range(firstMark.from, firstMark.to));
            widgets.push(
              Decoration.mark({ class: 'cm-live-inline-code' }).range(firstMark.to, lastMark.from)
            );
            widgets.push(Decoration.replace({ isPrefixHide: true }).range(lastMark.from, lastMark.to));
          } else {
            // 如果 lezer 没将反引号单独拆成 child，直接截取首尾各 1 个字符
            if (to - from >= 2) {
              widgets.push(Decoration.replace({ isPrefixHide: true }).range(from, from + 1));
              widgets.push(Decoration.mark({ class: 'cm-live-inline-code' }).range(from + 1, to - 1));
              widgets.push(Decoration.replace({ isPrefixHide: true }).range(to - 1, to));
            }
          }
        }
      }

      // 引用块 Blockquote
      if (name === 'Blockquote') {
        widgets.push(Decoration.line({ class: 'cm-live-quote' }).range(nodeLine.from));
      }

      // 任务列表 TaskMarker
      if (name === 'TaskMarker') {
        const markerText = state.sliceDoc(from, to);
        const isChecked = markerText.includes('x') || markerText.includes('X');
        widgets.push(
          Decoration.replace({
            widget: new TaskWidget(isChecked, from),
          }).range(from, to)
        );
      }

      // 分割线 HorizontalRule
      if (name === 'HorizontalRule' && !isCursorOnLine) {
        widgets.push(Decoration.line({ class: 'cm-live-hr' }).range(nodeLine.from));
      }
    },
  });

  return Decoration.set(widgets, true);
}

export const livePreviewPlugin: Extension = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = computeLiveDecorations(view.state);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.decorations = computeLiveDecorations(update.state);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);
