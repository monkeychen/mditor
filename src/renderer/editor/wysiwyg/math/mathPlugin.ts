import type { MilkdownPlugin } from '@milkdown/ctx';
import { $nodeSchema, $view, $remark, $prose, $inputRule } from '@milkdown/utils';
import { InputRule } from '@milkdown/prose/inputrules';
import remarkMath from 'remark-math';
import { InlineMathView } from './InlineMathView';
import { MathBlockView } from './MathBlockView';
import { createMathKeymapPlugin } from './mathKeymapPlugin';

/// AST 级别格式归一化：若一个段落独占一行且仅包含由 $$...$$ 包裹的数学公式，归一化为独立公式块 (math)
function remarkBlockMathNormalizer() {
  return (tree: any) => {
    if (!tree || !Array.isArray(tree.children)) return;
    for (let i = 0; i < tree.children.length; i++) {
      const node = tree.children[i];
      if (
        node &&
        node.type === 'paragraph' &&
        Array.isArray(node.children) &&
        node.children.length === 1 &&
        node.children[0].type === 'inlineMath'
      ) {
        const child = node.children[0];
        const pos = child.position;
        if (pos) {
          const rawLength = pos.end.offset - pos.start.offset;
          // 若为 $$formula$$，rawLength 比 value.length 至少多 4（两头的 $$）
          if (rawLength >= child.value.length + 4) {
            tree.children[i] = {
              type: 'math',
              value: child.value,
              position: node.position,
            };
          }
        }
      }
    }
  };
}

/// 注册 remark-math 插件以在 mdast 层面解析 $formula$ 与 $$math$$
export const remarkMathPlugin = $remark('remark-math', () => remarkMath);

/// 注册块级公式归一化插件，确保单行 $$...$$ 精准归类为独立公式块而非行内公式
export const remarkMathBlockNormalizerPlugin = $remark(
  'remark-math-block-normalizer',
  () => remarkBlockMathNormalizer
);

/// 行内数学公式节点 Schema
export const inlineMathSchema = $nodeSchema('inline_math', () => ({
  inline: true,
  group: 'inline',
  selectable: true,
  draggable: false,
  atom: true,
  defining: true,
  isolating: true,
  attrs: {
    value: { default: '', validate: 'string' },
  },
  parseDOM: [
    {
      tag: 'span[data-inline-math]',
      getAttrs: (dom) => {
        if (!(dom instanceof HTMLElement)) return { value: '' };
        return {
          value: dom.getAttribute('data-inline-math') || dom.textContent || '',
        };
      },
    },
  ],
  toDOM: (node) => {
    return ['span', { 'data-inline-math': node.attrs.value, class: 'inline-math-container' }, 0];
  },
  parseMarkdown: {
    match: ({ type }) => type === 'inlineMath',
    runner: (state, node, type) => {
      state.addNode(type, {
        value: (node.value as string) || '',
      });
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === 'inline_math',
    runner: (state, node) => {
      state.addNode('inlineMath', undefined, node.attrs.value || '');
    },
  },
}));

/// 独立公式块节点 Schema
export const mathBlockSchema = $nodeSchema('math_block', () => ({
  group: 'block',
  selectable: true,
  draggable: false,
  atom: true,
  defining: true,
  isolating: true,
  attrs: {
    value: { default: '', validate: 'string' },
  },
  parseDOM: [
    {
      tag: 'div[data-math-block]',
      getAttrs: (dom) => {
        if (!(dom instanceof HTMLElement)) return { value: '' };
        return {
          value: dom.getAttribute('data-math-block') || dom.textContent || '',
        };
      },
    },
  ],
  toDOM: (node) => {
    return ['div', { 'data-math-block': node.attrs.value, class: 'math-block-container' }, 0];
  },
  parseMarkdown: {
    match: ({ type }) => type === 'math',
    runner: (state, node, type) => {
      state.addNode(type, {
        value: (node.value as string) || '',
      });
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === 'math_block',
    runner: (state, node) => {
      state.addNode('math', undefined, node.attrs.value || '');
    },
  },
}));

/// 行内公式交互视图
export const inlineMathView = $view(inlineMathSchema.node, () => (node, view, getPos) => {
  return new InlineMathView(node, view, getPos as () => number | undefined);
});

/// 独立公式块交互视图
export const mathBlockView = $view(mathBlockSchema.node, () => (node, view, getPos) => {
  return new MathBlockView(node, view, getPos as () => number | undefined);
});

/// 数学公式键盘快捷键插件
export const mathKeymap = $prose(() => createMathKeymapPlugin());

/// 行内公式输入规则：仅匹配单一 $ 包裹内容，使用负向断言绝不误拦截 $$
export const inlineMathInputRule = $inputRule((ctx) => {
  return new InputRule(/(?<!\$)\$(?!\$)([^$\n]+)(?<!\$)\$(?!\$)$/, (state, match, start, end) => {
    const inlineMathType = inlineMathSchema.type(ctx);
    if (!inlineMathType) return null;
    const value = match[1] ?? '';
    const node = inlineMathType.create({ value });
    return state.tr.replaceWith(start, end, node);
  });
});

/// 独立公式块输入规则：在新行键入 $$ 后按空格立即自动转换为独立公式块
export const mathBlockInputRule = $inputRule((ctx) => {
  return new InputRule(/^\$\$\s$/, (state, _match, start, end) => {
    const mathBlockType = mathBlockSchema.type(ctx);
    if (!mathBlockType) return null;
    const node = mathBlockType.create({
      value: '\\int_{-\\infty}^{+\\infty} e^{-x^2} dx = \\sqrt{\\pi}',
    });
    return state.tr.replaceWith(start, end, node);
  });
});

/// 聚合数学公式 Milkdown 插件包
export const mathPlugin: MilkdownPlugin[] = [
  remarkMathPlugin,
  remarkMathBlockNormalizerPlugin,
  inlineMathSchema,
  mathBlockSchema,
  inlineMathView,
  mathBlockView,
  mathKeymap,
  inlineMathInputRule,
  mathBlockInputRule,
].flat() as MilkdownPlugin[];
