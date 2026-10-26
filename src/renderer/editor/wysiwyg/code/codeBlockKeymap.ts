import { Plugin, Selection } from '@milkdown/prose/state';
import { keymap } from '@milkdown/prose/keymap';
import type { EditorState, Transaction } from '@milkdown/prose/state';

/**
 * 判断代码块内光标是否处于首行
 */
export function isAtCodeBlockFirstLine(state: EditorState): boolean {
  const { $from } = state.selection;
  if ($from.parent.type.name !== 'code_block') return false;
  const textBefore = $from.parent.textBetween(0, $from.parentOffset, '\n');
  return !textBefore.includes('\n');
}

/**
 * 判断代码块内光标是否处于末行
 */
export function isAtCodeBlockLastLine(state: EditorState): boolean {
  const { $from } = state.selection;
  if ($from.parent.type.name !== 'code_block') return false;
  const textAfter = $from.parent.textBetween($from.parentOffset, $from.parent.content.size, '\n');
  return !textAfter.includes('\n');
}

/**
 * 首行按 ArrowUp 向上离开代码块
 */
export function handleCodeBlockArrowUp(
  state: EditorState,
  dispatch?: (tr: Transaction) => void
): boolean {
  if (!isAtCodeBlockFirstLine(state)) return false;

  const { $from } = state.selection;
  const codeBlockBeforePos = $from.before();

  if (dispatch) {
    const tr = state.tr;
    if (codeBlockBeforePos === 0) {
      // 位于文档最顶端，在前方插入一个空段落
      const paragraphNode = state.schema.nodes.paragraph.create();
      tr.insert(0, paragraphNode);
      const $newPos = tr.doc.resolve(1);
      tr.setSelection(Selection.near($newPos));
    } else {
      // 前方已有节点，光标移动到前方节点末尾
      const $newPos = tr.doc.resolve(codeBlockBeforePos - 1);
      tr.setSelection(Selection.near($newPos));
    }
    dispatch(tr);
  }

  return true;
}

/**
 * 末行按 ArrowDown 向下离开代码块
 */
export function handleCodeBlockArrowDown(
  state: EditorState,
  dispatch?: (tr: Transaction) => void
): boolean {
  if (!isAtCodeBlockLastLine(state)) return false;

  const { $from } = state.selection;
  const codeBlockAfterPos = $from.after();

  if (dispatch) {
    const tr = state.tr;
    if (codeBlockAfterPos >= state.doc.content.size) {
      // 位于文档最底端，在后方追加一个空段落
      const paragraphNode = state.schema.nodes.paragraph.create();
      tr.insert(codeBlockAfterPos, paragraphNode);
      const $newPos = tr.doc.resolve(codeBlockAfterPos + 1);
      tr.setSelection(Selection.near($newPos));
    } else {
      // 后方已有节点，光标移动到后方节点首部
      const $newPos = tr.doc.resolve(codeBlockAfterPos + 1);
      tr.setSelection(Selection.near($newPos));
    }
    dispatch(tr);
  }

  return true;
}

export function createCodeBlockKeymapPlugin(): Plugin {
  return keymap({
    ArrowUp: handleCodeBlockArrowUp,
    ArrowDown: handleCodeBlockArrowDown,
  });
}
