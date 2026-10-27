import type { MilkdownPlugin } from '@milkdown/ctx';
import { $nodeSchema, $view, $remark, $prose, $inputRule } from '@milkdown/utils';
import { InputRule } from '@milkdown/prose/inputrules';
import remarkMath from 'remark-math';
import { InlineMathView } from './InlineMathView';
import { MathBlockView } from './MathBlockView';
import { createMathKeymapPlugin } from './mathKeymapPlugin';

/// 注册 remark-math 插件以在 mdast 层面解析 $formula$ 与 $$math$$
export const remarkMathPlugin = $remark('remark-math', () => remarkMath);

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

/// 行内公式输入规则：当输入 $formula$ 时自动转换为 inline_math 节点
export const inlineMathInputRule = $inputRule((ctx) => {
  return new InputRule(/(?:\$)([^$\n]+)(?:\$)$/, (state, match, start, end) => {
    const inlineMathType = inlineMathSchema.type(ctx);
    if (!inlineMathType) return null;
    const value = match[1] ?? '';
    const node = inlineMathType.create({ value });
    return state.tr.replaceWith(start, end, node);
  });
});

/// 聚合数学公式 Milkdown 插件包
export const mathPlugin: MilkdownPlugin[] = [
  remarkMathPlugin,
  inlineMathSchema,
  mathBlockSchema,
  inlineMathView,
  mathBlockView,
  mathKeymap,
  inlineMathInputRule,
].flat() as MilkdownPlugin[];
