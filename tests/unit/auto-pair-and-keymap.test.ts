import { describe, it, expect } from 'vitest';
import { EditorState, TextSelection } from '@milkdown/prose/state';
import { Schema } from '@milkdown/prose/model';
import { createAutoPairPlugin } from '../../src/renderer/editor/wysiwyg/autoPairPlugin';

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

describe('Auto Pair & Keymap Plugin (T203 / AC-9.3)', () => {
  it('wraps selected text when typing opening bracket or quote (AC-9.3)', () => {
    // 文本内容: "Hello World"
    const pNode = testSchema.nodes.paragraph.create({}, testSchema.text('Hello World'));
    const doc = testSchema.nodes.doc.create({}, [pNode]);
    const plugin = createAutoPairPlugin();

    // 选中 "World" (pos 7 到 12)
    let state = EditorState.create({
      schema: testSchema,
      doc,
      plugins: [plugin],
      selection: TextSelection.create(doc, 7, 12),
    });

    let handled = false;
    let dispatchedTr: any = null;
    const viewMock = {
      state,
      dispatch: (tr: any) => {
        dispatchedTr = tr;
        state = state.apply(tr);
      },
    };

    // 模拟键入 '('
    const event = new KeyboardEvent('keydown', { key: '(' });
    handled = plugin.props.handleKeyDown?.call(plugin, viewMock as any, event) || false;

    expect(handled).toBe(true);
    expect(dispatchedTr).not.toBeNull();
    // 包装后文本应该变为 "Hello (World)"
    expect(state.doc.textContent).toBe('Hello (World)');
  });

  it('auto-completes pair and places cursor in between when typing opening bracket without selection (AC-9.3)', () => {
    const pNode = testSchema.nodes.paragraph.create({}, testSchema.text('Test '));
    const doc = testSchema.nodes.doc.create({}, [pNode]);
    const plugin = createAutoPairPlugin();

    // 光标在末尾 (pos = 6)
    let state = EditorState.create({
      schema: testSchema,
      doc,
      plugins: [plugin],
      selection: TextSelection.create(doc, 6),
    });

    let dispatchedTr: any = null;
    const viewMock = {
      state,
      dispatch: (tr: any) => {
        dispatchedTr = tr;
        state = state.apply(tr);
      },
    };

    const event = new KeyboardEvent('keydown', { key: '[' });
    const handled = plugin.props.handleKeyDown?.call(plugin, viewMock as any, event) || false;

    expect(handled).toBe(true);
    expect(dispatchedTr).not.toBeNull();
    // 文本变为 "Test []"
    expect(state.doc.textContent).toBe('Test []');
    // 光标位于 '[' 和 ']' 中间 (pos = 7)
    expect(state.selection.from).toBe(7);
  });

  it('skips over closing bracket if typed directly before it (overtype)', () => {
    const pNode = testSchema.nodes.paragraph.create({}, testSchema.text('Test ()'));
    const doc = testSchema.nodes.doc.create({}, [pNode]);
    const plugin = createAutoPairPlugin();

    // 光标在 '(' 和 ')' 中间 (pos = 7)
    let state = EditorState.create({
      schema: testSchema,
      doc,
      plugins: [plugin],
      selection: TextSelection.create(doc, 7),
    });

    const viewMock = {
      state,
      dispatch: (tr: any) => {
        state = state.apply(tr);
      },
    };

    const event = new KeyboardEvent('keydown', { key: ')' });
    const handled = plugin.props.handleKeyDown?.call(plugin, viewMock as any, event) || false;

    expect(handled).toBe(true);
    // 文本不变，光标跳过 ')' 到末尾 (pos = 8)
    expect(state.doc.textContent).toBe('Test ()');
    expect(state.selection.from).toBe(8);
  });
});
