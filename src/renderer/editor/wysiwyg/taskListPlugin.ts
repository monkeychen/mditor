import { Plugin } from '@milkdown/prose/state';
import { Decoration, DecorationSet } from '@milkdown/prose/view';

/**
 * 交互式任务列表插件（GFM Task List Checkbox）：
 * 识别 `list_item` 节点上的 `checked` 属性（boolean），
 * 渲染可点击切换的 `<input type="checkbox" class="task-list-checkbox" />`，
 * 点击后直接更新 ProseMirror 文档节点属性并触发 Markdown 序列化同步。
 */
export function createTaskListPlugin(): Plugin {
  return new Plugin({
    props: {
      decorations(state) {
        const decorations: Decoration[] = [];

        state.doc.descendants((node, pos) => {
          if (
            node.type.name === 'list_item' &&
            node.attrs &&
            typeof node.attrs.checked === 'boolean'
          ) {
            const isChecked = node.attrs.checked;
            const nodePos = pos;

            // 为 li 节点附加样式类，隐藏默认圆点并支持完成态样式
            decorations.push(
              Decoration.node(pos, pos + node.nodeSize, {
                class: isChecked
                  ? 'task-list-item task-list-item-checked'
                  : 'task-list-item',
              })
            );

            // 在列表项首个子节点（通常为 paragraph）开头插入交互式复选框
            const widgetPos = node.firstChild ? pos + 2 : pos + 1;
            decorations.push(
              Decoration.widget(
                widgetPos,
                (view) => {
                  const checkbox = document.createElement('input');
                  checkbox.type = 'checkbox';
                  checkbox.className = 'task-list-checkbox';
                  checkbox.checked = isChecked;
                  checkbox.setAttribute(
                    'aria-label',
                    isChecked ? '已完成任务项' : '待办任务项'
                  );

                  checkbox.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                  });

                  checkbox.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const currentNode = view.state.doc.nodeAt(nodePos);
                    if (!currentNode) return;
                    const nextChecked = !currentNode.attrs.checked;
                    const tr = view.state.tr.setNodeMarkup(nodePos, undefined, {
                      ...currentNode.attrs,
                      checked: nextChecked,
                    });
                    view.dispatch(tr);
                  });

                  return checkbox;
                },
                {
                  side: -1,
                  ignoreSelection: true,
                }
              )
            );
          }
        });

        return DecorationSet.create(state.doc, decorations);
      },
    },
  });
}
