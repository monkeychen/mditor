import { Plugin } from '@milkdown/prose/state';
import { Decoration, DecorationSet } from '@milkdown/prose/view';

export function createPlaceholderPlugin(
  placeholder = '开始书写，或输入 # 创建标题、- 创建列表、| 创建表格...'
): Plugin {
  return new Plugin({
    props: {
      decorations(state) {
        const { doc } = state;
        // 若文档仅有一个子节点，且为空段落（尚未转换为标题/列表/代码块等），渲染首行输入引导
        if (
          doc.childCount === 1 &&
          doc.firstChild?.type.name === 'paragraph' &&
          doc.firstChild.content.size === 0
        ) {
          return DecorationSet.create(doc, [
            Decoration.node(0, doc.firstChild.nodeSize, {
              class: 'is-empty',
              'data-placeholder': placeholder,
            }),
          ]);
        }
        return DecorationSet.empty;
      },
    },
  });
}
