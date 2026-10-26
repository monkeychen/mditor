import { Plugin, PluginKey } from '@milkdown/prose/state';
import { Decoration, DecorationSet } from '@milkdown/prose/view';

export const delimiterPluginKey = new PluginKey('mditor_delimiter_plugin');

function createMarkerElement(text: string, className: string): HTMLElement {
  const span = document.createElement('span');
  span.className = className;
  span.textContent = text;
  span.style.color = '#D1D5DB';
  span.style.userSelect = 'none';
  span.style.fontFamily = '"SF Mono", Menlo, Monaco, Consolas, monospace';
  span.style.fontSize = '0.9em';
  span.style.opacity = '0.85';
  return span;
}

export function createDelimiterPlugin(): Plugin {
  return new Plugin({
    key: delimiterPluginKey,
    props: {
      decorations(state) {
        const { doc, selection } = state;
        const { $from, $to } = selection;
        const decos: Decoration[] = [];

        // 1. 检查光标是否在 Heading 节点内
        for (let d = $from.depth; d > 0; d--) {
          const node = $from.node(d);
          if (node.type.name === 'heading') {
            const startPos = $from.start(d);
            const level = (node.attrs.level as number) || 1;
            const prefix = '#'.repeat(level) + ' ';

            decos.push(
              Decoration.widget(
                startPos,
                () => createMarkerElement(prefix, 'milkdown-heading-marker heading-marker'),
                { side: -1, key: `h-marker-${startPos}` }
              )
            );
            break;
          }
        }

        // 2. 检查光标所在位置是否有 inline mark (strong, emphasis 等)
        // 只有光标处于选区两端范围内时才露出
        const marks = $from.marks();
        if (marks && marks.length > 0) {
          // 查找当前段落中包含该 mark 的范围
          const parent = $from.parent;
          const parentStart = $from.start();

          for (const mark of marks) {
            if (mark.type.name === 'strong' || mark.type.name === 'emphasis') {
              const delimiterText = mark.type.name === 'strong' ? '**' : '*';
              const markerClass = `milkdown-${mark.type.name}-marker delimiter-marker`;

              // 在 parent 内定位该 mark 连续文本的起点与终点
              let markStart = -1;
              let markEnd = -1;
              let offset = parentStart;

              parent.forEach((child) => {
                const childStart = offset;
                const childEnd = offset + child.nodeSize;

                if (child.isText && child.marks.some((m) => m.eq(mark))) {
                  // 只有当光标落在该 text 节点范围内时匹配
                  if ($from.pos >= childStart && $to.pos <= childEnd) {
                    if (markStart === -1) markStart = childStart;
                    markEnd = childEnd;
                  }
                }
                offset = childEnd;
              });

              if (markStart !== -1 && markEnd !== -1) {
                decos.push(
                  Decoration.widget(
                    markStart,
                    () => createMarkerElement(delimiterText, markerClass),
                    { side: -1, key: `mark-start-${markStart}` }
                  ),
                  Decoration.widget(
                    markEnd,
                    () => createMarkerElement(delimiterText, markerClass),
                    { side: 1, key: `mark-end-${markEnd}` }
                  )
                );
              }
            }
          }
        }

        if (decos.length === 0) return DecorationSet.empty;
        return DecorationSet.create(doc, decos);
      },
    },
  });
}
