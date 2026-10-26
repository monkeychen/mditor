import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';

export interface SourceEditorProps {
  content: string;
  onChange?: (content: string) => void;
  onCursorChange?: (line: number, col: number) => void;
  cursorLine?: number;
  className?: string;
}

export const SourceEditor: React.FC<SourceEditorProps> = ({
  content,
  onChange,
  onCursorChange,
  cursorLine,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && onChange) {
        onChange(update.state.doc.toString());
      }
      if (update.selectionSet && onCursorChange) {
        const head = update.state.selection.main.head;
        const line = update.state.doc.lineAt(head);
        onCursorChange(line.number, head - line.from + 1);
      }
    });

    const startState = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        markdown(),
        updateListener,
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '14px',
            fontFamily: '"SF Mono", Menlo, Monaco, Consolas, monospace',
            backgroundColor: 'transparent',
          },
          '.cm-scroller': {
            overflow: 'auto',
            padding: '16px 20px',
          },
          '.cm-content': {
            caretColor: '#2563EB',
            lineHeight: '1.6',
          },
          '.cm-gutters': {
            backgroundColor: 'transparent',
            color: '#9CA3AF',
            borderRight: '1px solid rgba(0, 0, 0, 0.06)',
            paddingRight: '8px',
          },
          '&.cm-focused': {
            outline: 'none',
          },
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    viewRef.current = view;

    // 若指定了初始跳转行
    if (cursorLine && cursorLine > 1 && cursorLine <= view.state.doc.lines) {
      const linePos = view.state.doc.line(cursorLine).from;
      view.dispatch({
        selection: { anchor: linePos, head: linePos },
        scrollIntoView: true,
      });
    }

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // 仅在挂载时初始化，避免重复渲染重置光标

  return (
    <div
      ref={containerRef}
      className={`source-editor-container w-full h-full overflow-hidden ${className}`}
    />
  );
};

SourceEditor.displayName = 'SourceEditor';
