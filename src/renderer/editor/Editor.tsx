import { useEffect, useRef } from 'react';
import { EditorState, Extension } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { macosEditorTheme } from './theme';
import { livePreviewPlugin } from './livePreview';
import { imageDropAndPasteExtension } from './imageHandler';

export interface EditorProps {
  initialDoc?: string;
  docFilePath?: string | null;
  extensions?: Extension[];
  onChange?: (doc: string) => void;
  onCursorChange?: (line: number, col: number) => void;
  className?: string;
}

export const Editor = ({
  initialDoc = '',
  docFilePath = null,
  extensions = [],
  onChange,
  onCursorChange,
  className = '',
}: EditorProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const docPathRef = useRef<string | null>(docFilePath);
  docPathRef.current = docFilePath;

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
        livePreviewPlugin,
        imageDropAndPasteExtension(() => docPathRef.current),
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
