import { describe, it, expect } from 'vitest';
import { EditorState, TextSelection } from '@milkdown/prose/state';
import { Schema } from '@milkdown/prose/model';
import { createFormatKeymapPlugin } from '../../src/renderer/editor/wysiwyg/formatKeymapPlugin';

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

describe('Format Keymap Plugin (T203 / AC-9.4)', () => {
  it('converts current block to Heading 1 when pressing Mod-1', () => {
    const pNode = testSchema.nodes.paragraph.create({}, testSchema.text('段落内容'));
    const doc = testSchema.nodes.doc.create({}, [pNode]);
    const plugin = createFormatKeymapPlugin();

    let state = EditorState.create({
      schema: testSchema,
      doc,
      plugins: [plugin],
      selection: TextSelection.create(doc, 3),
    });

    const viewMock = {
      state,
      dispatch: (tr: any) => {
        state = state.apply(tr);
      },
    };

    const event = new KeyboardEvent('keydown', { key: '1', metaKey: true });
    const handled = plugin.props.handleKeyDown?.call(plugin, viewMock as any, event) || false;

    expect(handled).toBe(true);
    // 检查第 1 个节点变成了 heading 且 level = 1
    const firstNode = state.doc.child(0);
    expect(firstNode.type.name).toBe('heading');
    expect(firstNode.attrs.level).toBe(1);
    expect(firstNode.textContent).toBe('段落内容');
  });

  it('converts current Heading back to Paragraph when pressing Mod-0', () => {
    const headingNode = testSchema.nodes.heading.create({ level: 2 }, testSchema.text('标题二'));
    const doc = testSchema.nodes.doc.create({}, [headingNode]);
    const plugin = createFormatKeymapPlugin();

    let state = EditorState.create({
      schema: testSchema,
      doc,
      plugins: [plugin],
      selection: TextSelection.create(doc, 2),
    });

    const viewMock = {
      state,
      dispatch: (tr: any) => {
        state = state.apply(tr);
      },
    };

    const event = new KeyboardEvent('keydown', { key: '0', metaKey: true });
    const handled = plugin.props.handleKeyDown?.call(plugin, viewMock as any, event) || false;

    expect(handled).toBe(true);
    const firstNode = state.doc.child(0);
    expect(firstNode.type.name).toBe('paragraph');
    expect(firstNode.textContent).toBe('标题二');
  });
});
