import React, { useEffect, useRef } from 'react';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, lineNumbers, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import type { AppTheme } from '../../services/themeService';
import { getCodeMirrorTheme } from '../theme';

export interface SourceEditorProps {
  content: string;
  theme?: AppTheme;
  onChange?: (content: string) => void;
  onCursorChange?: (line: number, col: number) => void;
  cursorLine?: number;
  className?: string;
}

export const SourceEditor: React.FC<SourceEditorProps> = ({
  content,
  theme = 'macos-light',
  onChange,
  onCursorChange,
  cursorLine,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const themeCompartmentRef = useRef<Compartment>(new Compartment());

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
        markdown({ codeLanguages: languages }),
        updateListener,
        themeCompartmentRef.current.of(getCodeMirrorTheme(theme)),
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

  useEffect(() => {
    if (viewRef.current && themeCompartmentRef.current) {
      viewRef.current.dispatch({
        effects: themeCompartmentRef.current.reconfigure(getCodeMirrorTheme(theme)),
      });
    }
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className={`source-editor-container w-full h-full overflow-hidden ${className}`}
    />
  );
};

SourceEditor.displayName = 'SourceEditor';
