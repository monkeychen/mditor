import { useEffect, useRef } from 'react';
import { EditorState, Extension } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { macosEditorTheme } from './theme';

export interface EditorProps {
  initialDoc?: string;
  extensions?: Extension[];
  onChange?: (doc: string) => void;
  onCursorChange?: (line: number, col: number) => void;
  className?: string;
}

export const Editor = ({
  initialDoc = '',
  extensions = [],
  onChange,
  onCursorChange,
  className = '',
}: EditorProps) => {
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
      doc: initialDoc,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        markdown(),
        macosEditorTheme,
        EditorView.lineWrapping,
        updateListener,
        ...extensions,
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className={`w-full h-full overflow-hidden ${className}`} />;
};

export default Editor;
