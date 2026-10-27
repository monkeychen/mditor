import React, { useEffect, useRef } from 'react';
import { EditorState, Compartment, Extension } from '@codemirror/state';
import { EditorView, lineNumbers, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { foldGutter, foldKeymap, bracketMatching, LanguageDescription } from '@codemirror/language';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import type { AppTheme } from '../../services/themeService';
import { getCodeMirrorTheme } from '../theme';
import { isMarkdownFile } from '../../utils/languageClassifier';

export interface SourceEditorProps {
  content: string;
  theme?: AppTheme;
  onChange?: (content: string) => void;
  onCursorChange?: (line: number, col: number) => void;
  cursorLine?: number;
  className?: string;
  filePath?: string | null;
  fileName?: string;
}

export async function resolveLanguageExtension(filePathOrName?: string | null): Promise<Extension> {
  if (!filePathOrName) {
    return markdown({ codeLanguages: languages });
  }

  if (isMarkdownFile(filePathOrName)) {
    return markdown({ codeLanguages: languages });
  }

  // Normalization for special file names like Dockerfile
  let lookupName = filePathOrName;
  const lastSlash = Math.max(lookupName.lastIndexOf('/'), lookupName.lastIndexOf('\\'));
  const baseName = lastSlash >= 0 ? lookupName.substring(lastSlash + 1) : lookupName;
  if (baseName.toLowerCase() === 'dockerfile') {
    lookupName = 'Dockerfile';
  }

  const desc = LanguageDescription.matchFilename(languages, lookupName);
  if (desc) {
    const support = await desc.load();
    return support;
  }

  // Fallback for plaintext, logs, diffs without lezer parser
  return [];
}

export const SourceEditor: React.FC<SourceEditorProps> = ({
  content,
  theme = 'macos-light',
  onChange,
  onCursorChange,
  cursorLine,
  className = '',
  filePath,
  fileName,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const themeCompartmentRef = useRef<Compartment>(new Compartment());
  const languageCompartmentRef = useRef<Compartment>(new Compartment());

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

    const isMd = !fileName && !filePath ? true : isMarkdownFile(fileName || filePath || '');
    const initialLang = isMd ? markdown({ codeLanguages: languages }) : [];

    const startState = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        foldGutter(),
        bracketMatching(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap]),
        languageCompartmentRef.current.of(initialLang),
        themeCompartmentRef.current.of(getCodeMirrorTheme(theme)),
        updateListener,
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
  }, []); // 仅在挂载时初始化

  // 监听主题变化
  useEffect(() => {
    if (viewRef.current && themeCompartmentRef.current) {
      viewRef.current.dispatch({
        effects: themeCompartmentRef.current.reconfigure(getCodeMirrorTheme(theme)),
      });
    }
  }, [theme]);

  // 监听语言与文件变化，动态加载对应语法解析包
  useEffect(() => {
    let cancelled = false;
    const target = fileName || filePath;

    resolveLanguageExtension(target).then((ext) => {
      if (!cancelled && viewRef.current && languageCompartmentRef.current) {
        viewRef.current.dispatch({
          effects: languageCompartmentRef.current.reconfigure(ext),
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [fileName, filePath]);

  // 外部内容变动同步
  useEffect(() => {
    if (viewRef.current && content !== viewRef.current.state.doc.toString()) {
      viewRef.current.dispatch({
        changes: { from: 0, to: viewRef.current.state.doc.length, insert: content },
      });
    }
  }, [content]);

  return (
    <div
      ref={containerRef}
      className={`source-editor-container w-full h-full overflow-hidden ${className}`}
    />
  );
};

SourceEditor.displayName = 'SourceEditor';
