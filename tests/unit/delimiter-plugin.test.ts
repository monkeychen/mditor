import { describe, it, expect } from 'vitest';
import { EditorState, TextSelection } from '@milkdown/prose/state';
import { Schema } from '@milkdown/prose/model';
import { DecorationSet } from '@milkdown/prose/view';
import { createDelimiterPlugin } from '../../src/renderer/editor/wysiwyg/delimiterPlugin';

const testSchema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { content: 'inline*', group: 'block' },
    heading: { content: 'inline*', group: 'block', attrs: { level: { default: 1 } } },
    text: { group: 'inline' },
  },
  marks: {
    strong: {},
    emphasis: {},
  },
});

describe('Delimiter Plugin (T202 / AC-8.2 / AC-8.3)', () => {
  it('creates heading markers only when cursor is inside the heading node', () => {
    // 构造包含 Heading 与 Paragraph 的 ProseMirror doc
    const headingNode = testSchema.nodes.heading.create({ level: 1 }, testSchema.text('标题测试'));
    const pNode = testSchema.nodes.paragraph.create({}, testSchema.text('正文段落'));
    const doc = testSchema.nodes.doc.create({}, [headingNode, pNode]);

    const plugin = createDelimiterPlugin();

    // 1. 光标在正文段落内 (pos = 8)
    const stateInParagraph = EditorState.create({
      schema: testSchema,
      doc,
      plugins: [plugin],
      selection: TextSelection.create(doc, 8),
    });

    const decosOutside = plugin.props.decorations?.call(plugin, stateInParagraph) as DecorationSet | undefined;
    // 光标不在标题内，装饰器集合中不应该有 heading marker
    const headingDecosOutside = decosOutside?.find(0, doc.content.size);
    expect(headingDecosOutside?.length || 0).toBe(0);

    // 2. 光标在标题内部 (pos = 2)
    const stateInHeading = EditorState.create({
      schema: testSchema,
      doc,
      plugins: [plugin],
      selection: TextSelection.create(doc, 2),
    });

    const decosInside = plugin.props.decorations?.call(plugin, stateInHeading) as DecorationSet | undefined;
    const headingDecosInside = decosInside?.find(0, doc.content.size);
    // 光标进入标题，应当生成 1 个前缀定界符 widget
    expect(headingDecosInside?.length).toBe(1);
    const deco = headingDecosInside?.[0] as any;
    expect(deco?.type?.toDOM).toBeDefined();
    const dom = deco.type.toDOM() as HTMLElement;
    expect(dom.textContent).toBe('# ');
    expect(dom.className).toContain('heading-marker');
  });

  it('reveals strong delimiters when cursor is inside strong mark (AC-8.3)', () => {
    // 构造带 strong mark 的段落: 这是 [加粗文字] 内容
    const strongMark = testSchema.marks.strong.create();
    const text1 = testSchema.text('这是');
    const textBold = testSchema.text('加粗文字', [strongMark]);
    const text2 = testSchema.text('内容');
    const pNode = testSchema.nodes.paragraph.create({}, [text1, textBold, text2]);
    const doc = testSchema.nodes.doc.create({}, [pNode]);

    const plugin = createDelimiterPlugin();

    // 光标在加粗文字中间 (pos = 5)
    const stateInBold = EditorState.create({
      schema: testSchema,
      doc,
      plugins: [plugin],
      selection: TextSelection.create(doc, 5),
    });

    const decos = plugin.props.decorations?.call(plugin, stateInBold) as DecorationSet | undefined;
    const boldDecos = decos?.find(0, doc.content.size);
    // 应该在开头和结尾各生成 1 个 ** 标记
    expect(boldDecos?.length).toBe(2);
    const domStart = (boldDecos?.[0] as any)?.type?.toDOM() as HTMLElement;
    const domEnd = (boldDecos?.[1] as any)?.type?.toDOM() as HTMLElement;
    expect(domStart.textContent).toBe('**');
    expect(domEnd.textContent).toBe('**');
  });
});

