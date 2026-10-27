import type { MilkdownPlugin } from '@milkdown/ctx';
import { $nodeSchema, $markSchema, $view, $remark } from '@milkdown/utils';
import remarkFrontmatter from 'remark-frontmatter';
import { FrontmatterView } from './FrontmatterView';
import { TocView } from './TocView';

/// 自定义 Remark 插件：支持 ==高亮==, ~下标~, ^上标^, [TOC] 及对应序列化规则
function remarkExtendedTypography(this: any) {
  const data = this.data();
  const toMarkdownExtensions =
    data.toMarkdownExtensions || (data.toMarkdownExtensions = []);

  // 1. 序列化器扩展：将 AST 节点转回标准 Markdown
  toMarkdownExtensions.push({
    handlers: {
      highlight(node: any, _: any, state: any, info: any) {
        const exit = state.enter('highlight');
        const tracker = state.createTracker(info);
        let value = tracker.move('==');
        value += state.containerPhrasing(node, {
          before: value,
          after: '==',
          ...tracker.current(),
        });
        value += tracker.move('==');
        exit();
        return value;
      },
      subscript(node: any, _: any, state: any, info: any) {
        const exit = state.enter('subscript');
        const tracker = state.createTracker(info);
        let value = tracker.move('~');
        value += state.containerPhrasing(node, {
          before: value,
          after: '~',
          ...tracker.current(),
        });
        value += tracker.move('~');
        exit();
        return value;
      },
      superscript(node: any, _: any, state: any, info: any) {
        const exit = state.enter('superscript');
        const tracker = state.createTracker(info);
        let value = tracker.move('^');
        value += state.containerPhrasing(node, {
          before: value,
          after: '^',
          ...tracker.current(),
        });
        value += tracker.move('^');
        exit();
        return value;
      },
      toc() {
        return '[TOC]';
      },
    },
  });

  // 2. AST 解析器转换：识别文本中的特殊标记并转化为对应 AST 节点
  return (tree: any) => {
    function walk(node: any) {
      if (!node.children) return;

      const newChildren: any[] = [];
      for (const child of node.children) {
        if (child.type === 'text') {
          const regex = /(==([^=\n]+)==)|(~([^~\n]+)~)|(\^([^\^\n]+)\^)/g;
          let lastIndex = 0;
          let match: RegExpExecArray | null;
          let matchedAny = false;

          while ((match = regex.exec(child.value)) !== null) {
            matchedAny = true;
            if (match.index > lastIndex) {
              newChildren.push({
                type: 'text',
                value: child.value.slice(lastIndex, match.index),
              });
            }
            if (match[1]) {
              // ==highlight==
              newChildren.push({
                type: 'highlight',
                children: [{ type: 'text', value: match[2] }],
              });
            } else if (match[3]) {
              // ~subscript~
              newChildren.push({
                type: 'subscript',
                children: [{ type: 'text', value: match[4] }],
              });
            } else if (match[5]) {
              // ^superscript^
              newChildren.push({
                type: 'superscript',
                children: [{ type: 'text', value: match[6] }],
              });
            }
            lastIndex = regex.lastIndex;
          }

          if (matchedAny) {
            if (lastIndex < child.value.length) {
              newChildren.push({
                type: 'text',
                value: child.value.slice(lastIndex),
              });
            }
          } else {
            newChildren.push(child);
          }
        } else if (child.type === 'delete') {
          // 区分单波浪号下标 ~sub~ 与双波浪号删除线 ~~del~~
          let isSingleTilde = false;
          if (
            child.position &&
            child.children?.length === 1 &&
            child.children[0].position &&
            child.position.start.offset !== undefined &&
            child.position.end.offset !== undefined &&
            child.children[0].position.start.offset !== undefined &&
            child.children[0].position.end.offset !== undefined
          ) {
            const parentLen = child.position.end.offset - child.position.start.offset;
            const childLen =
              child.children[0].position.end.offset - child.children[0].position.start.offset;
            if (parentLen - childLen === 2) {
              isSingleTilde = true;
            }
          }

          if (isSingleTilde) {
            newChildren.push({
              type: 'subscript',
              children: child.children,
            });
          } else {
            walk(child);
            newChildren.push(child);
          }
        } else if (
          child.type === 'paragraph' &&
          child.children?.length === 1 &&
          child.children[0].type === 'text' &&
          (child.children[0].value.trim() === '[TOC]' ||
            child.children[0].value.trim() === '[toc]')
        ) {
          // 独立 [TOC] 单行段落转为 toc 节点
          newChildren.push({ type: 'toc', value: '[TOC]' });
        } else {
          walk(child);
          newChildren.push(child);
        }
      }
      node.children = newChildren;
    }
    walk(tree);
  };
}

/// 注册 Remark 插件
export const remarkFrontmatterPlugin = $remark('remark-frontmatter', () => remarkFrontmatter, ['yaml']);
export const remarkExtendedTypographyPlugin = $remark('remark-extended-typography', () => remarkExtendedTypography);

/// 高亮 Mark Schema
export const highlightSchema = $markSchema('highlight', () => ({
  parseDOM: [{ tag: 'mark.mditor-highlight' }],
  toDOM: () => ['mark', { class: 'mditor-highlight' }, 0],
  parseMarkdown: {
    match: (node) => node.type === 'highlight',
    runner: (state, node, markType) => {
      state.openMark(markType);
      state.next(node.children as any);
      state.closeMark(markType);
    },
  },
  toMarkdown: {
    match: (mark) => mark.type.name === 'highlight',
    runner: (state, mark) => {
      state.withMark(mark, 'highlight');
    },
  },
}));

/// 下标 Mark Schema
export const subscriptSchema = $markSchema('subscript', () => ({
  parseDOM: [{ tag: 'sub' }],
  toDOM: () => ['sub', 0],
  parseMarkdown: {
    match: (node) => node.type === 'subscript',
    runner: (state, node, markType) => {
      state.openMark(markType);
      state.next(node.children as any);
      state.closeMark(markType);
    },
  },
  toMarkdown: {
    match: (mark) => mark.type.name === 'subscript',
    runner: (state, mark) => {
      state.withMark(mark, 'subscript');
    },
  },
}));

/// 上标 Mark Schema
export const superscriptSchema = $markSchema('superscript', () => ({
  parseDOM: [{ tag: 'sup' }],
  toDOM: () => ['sup', 0],
  parseMarkdown: {
    match: (node) => node.type === 'superscript',
    runner: (state, node, markType) => {
      state.openMark(markType);
      state.next(node.children as any);
      state.closeMark(markType);
    },
  },
  toMarkdown: {
    match: (mark) => mark.type.name === 'superscript',
    runner: (state, mark) => {
      state.withMark(mark, 'superscript');
    },
  },
}));

/// Front Matter 块节点 Schema
export const frontmatterSchema = $nodeSchema('frontmatter', () => ({
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
      tag: 'div[data-type="frontmatter"]',
      getAttrs: (dom) => {
        if (!(dom instanceof HTMLElement)) return { value: '' };
        return { value: dom.getAttribute('data-value') || '' };
      },
    },
  ],
  toDOM: (node) => [
    'div',
    { 'data-type': 'frontmatter', 'data-value': node.attrs.value },
    0,
  ],
  parseMarkdown: {
    match: ({ type }) => type === 'yaml',
    runner: (state, node, type) => {
      state.addNode(type, {
        value: (node.value as string) || '',
      });
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === 'frontmatter',
    runner: (state, node) => {
      state.addNode('yaml', undefined, node.attrs.value || '');
    },
  },
}));

/// TOC 自动目录块节点 Schema
export const tocSchema = $nodeSchema('toc_block', () => ({
  group: 'block',
  selectable: true,
  draggable: false,
  atom: true,
  defining: true,
  isolating: true,
  attrs: {
    value: { default: '[TOC]', validate: 'string' },
  },
  parseDOM: [
    {
      tag: 'div[data-type="toc_block"]',
    },
  ],
  toDOM: () => ['div', { 'data-type': 'toc_block' }, 0],
  parseMarkdown: {
    match: ({ type }) => type === 'toc',
    runner: (state, _, type) => {
      state.addNode(type, { value: '[TOC]' });
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === 'toc_block',
    runner: (state) => {
      state.addNode('toc', undefined, '[TOC]');
    },
  },
}));

/// 注册 NodeView
export const frontmatterView = $view(frontmatterSchema.node, () => (node, view, getPos) => {
  return new FrontmatterView(node, view, getPos as () => number | undefined);
});

export const tocView = $view(tocSchema.node, () => (node, view, getPos) => {
  return new TocView(node, view, getPos as () => number | undefined);
});

/// 聚合扩展排版插件包
export const extendedTypographyPlugin: MilkdownPlugin[] = [
  remarkFrontmatterPlugin,
  remarkExtendedTypographyPlugin,
  highlightSchema,
  subscriptSchema,
  superscriptSchema,
  frontmatterSchema,
  tocSchema,
  frontmatterView,
  tocView,
].flat() as MilkdownPlugin[];
