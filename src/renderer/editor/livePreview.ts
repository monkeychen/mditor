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
export class TaskWidget extends WidgetType {
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

// 本地图片卡片 Widget (AC4.3)
export class ImageWidget extends WidgetType {
  constructor(readonly alt: string, readonly src: string, readonly pos: number) {
    super();
  }

  eq(other: ImageWidget): boolean {
    return other.src === this.src && other.alt === this.alt;
  }

  toDOM(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'cm-live-image-card my-3 max-w-[540px] rounded-lg border border-black/10 overflow-hidden shadow-2xs bg-white/70 p-2 cursor-pointer select-none';

    const imgWrap = document.createElement('div');
    imgWrap.className = 'w-full rounded bg-stone-100 flex items-center justify-center overflow-hidden min-h-[120px] max-h-[380px]';

    const img = document.createElement('img');
    img.src = this.src;
    img.alt = this.alt;
    img.className = 'max-w-full max-h-[380px] object-contain rounded';

    // 容错处理：若本地文件尚未就绪或路径相对显示，展示轻量占位
    img.onerror = () => {
      img.style.display = 'none';
      const placeholder = document.createElement('div');
      placeholder.className = 'py-6 px-4 text-center text-xs font-mono text-stone-500';
      placeholder.innerHTML = `🖼️ <span class="font-semibold text-stone-700">${this.alt || '本地图片'}</span><div class="text-[10px] text-stone-400 mt-1">${this.src}</div>`;
      imgWrap.appendChild(placeholder);
    };

    imgWrap.appendChild(img);
    card.appendChild(imgWrap);

    if (this.alt) {
      const caption = document.createElement('div');
      caption.className = 'text-[11px] text-stone-500 text-center mt-1.5 font-sans';
      caption.textContent = this.alt;
      card.appendChild(caption);
    }

    return card;
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
          const markNode = node.node.firstChild;
          if (markNode && markNode.name === 'HeaderMark') {
            const endPos = Math.min(markNode.to + 1, to);
            widgets.push(
              Decoration.replace({
                isPrefixHide: true,
              }).range(markNode.from, endPos)
            );
          }
        }
      }

      // 图片处理 (AC4.3)
      if (name === 'Image') {
        if (!isCursorOnLine) {
          const rawText = state.sliceDoc(from, to);
          const match = rawText.match(/!\[(.*?)\]\((.*?)\)/);
          const alt = match ? match[1] : '';
          const src = match ? match[2] : '';
          widgets.push(
            Decoration.replace({
              widget: new ImageWidget(alt, src, from),
            }).range(from, to)
          );
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
