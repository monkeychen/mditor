import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  Editor,
  rootCtx,
  defaultValueCtx,
  editorViewCtx,
  serializerCtx,
  parserCtx,
  editorStateCtx,
  prosePluginsCtx,
} from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { createDelimiterPlugin } from './delimiterPlugin';
import { createAutoPairPlugin } from './autoPairPlugin';
import { createFormatKeymapPlugin } from './formatKeymapPlugin';
import '../../styles/milkdown.css';

export interface MilkdownEditorProps {
  initialContent?: string;
  onChange?: (markdown: string) => void;
  onCursorChange?: (line: number, col: number) => void;
  className?: string;
}

export interface MilkdownEditorRef {
  getMarkdown: () => string;
  setMarkdown: (markdown: string) => void;
  focus: () => void;
  getCursorPosition: () => { line: number; col: number };
  setCursorPosition: (line: number, col: number) => void;
}

export const MilkdownEditor = forwardRef<MilkdownEditorRef, MilkdownEditorProps>(
  ({ initialContent = '', onChange, onCursorChange: _onCursorChange, className = '' }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const editorInstanceRef = useRef<Editor | null>(null);
    const isDestroyedRef = useRef(false);

    useImperativeHandle(ref, () => ({
      getMarkdown: () => {
        const editor = editorInstanceRef.current;
        if (!editor) return '';
        try {
          return editor.action((ctx) => {
            const view = ctx.get(editorViewCtx);
            const serializer = ctx.get(serializerCtx);
            return serializer(view.state.doc);
          });
        } catch (e) {
          console.error('[Milkdown] Failed to get markdown:', e);
          return '';
        }
      },
      setMarkdown: (markdown: string) => {
        const editor = editorInstanceRef.current;
        if (!editor) return;
        try {
          editor.action((ctx) => {
            const view = ctx.get(editorViewCtx);
            const parser = ctx.get(parserCtx);
            const doc = parser(markdown);
            if (!doc) return;
            const state = ctx.get(editorStateCtx);
            const tr = state.tr.replaceWith(0, state.doc.content.size, doc.content);
            view.dispatch(tr);
          });
        } catch (e) {
          console.error('[Milkdown] Failed to set markdown:', e);
        }
      },
      focus: () => {
        const editor = editorInstanceRef.current;
        if (!editor) return;
        try {
          editor.action((ctx) => {
            const view = ctx.get(editorViewCtx);
            view.focus();
          });
        } catch (e) {
          // ignore
        }
      },
      getCursorPosition: () => {
        const editor = editorInstanceRef.current;
        if (!editor) return { line: 1, col: 1 };
        try {
          return editor.action((ctx) => {
            const view = ctx.get(editorViewCtx);
            const { from } = view.state.selection;
            const textBefore = view.state.doc.textBetween(0, from, '\n');
            const lines = textBefore.split('\n');
            const line = lines.length;
            const col = lines[lines.length - 1].length + 1;
            return { line, col };
          });
        } catch {
          return { line: 1, col: 1 };
        }
      },
      setCursorPosition: (_line: number, _col: number) => {
        // 后续可通过 ProseMirror doc 遍历具体位置设置选区
      },
    }));

    useEffect(() => {
      if (!containerRef.current) return;
      isDestroyedRef.current = false;

      const editor = Editor.make()
        .config((ctx) => {
          ctx.set(rootCtx, containerRef.current!);
          ctx.set(defaultValueCtx, initialContent);
          ctx.update(prosePluginsCtx, (prev) => [
            ...prev,
            createDelimiterPlugin(),
            createAutoPairPlugin(),
            createFormatKeymapPlugin(),
          ]);
          ctx.get(listenerCtx).markdownUpdated((_, markdown) => {
            if (!isDestroyedRef.current && onChange) {
              onChange(markdown);
            }
          });
        })
        .use(commonmark)
        .use(gfm)
        .use(listener);

      editor.create().then((createdEditor) => {
        if (isDestroyedRef.current) {
          createdEditor.destroy();
        } else {
          editorInstanceRef.current = createdEditor;
        }
      }).catch((err) => {
        console.error('[Milkdown] Failed to create editor instance:', err);
      });

      return () => {
        isDestroyedRef.current = true;
        if (editorInstanceRef.current) {
          editorInstanceRef.current.destroy();
          editorInstanceRef.current = null;
        }
      };
    }, []); // 仅挂载一次，内容更新通过 setMarkdown 控制

    return (
      <div
        className={`milkdown-wysiwyg-container w-full h-full overflow-y-auto px-8 md:px-20 lg:px-32 py-10 text-stone-800 ${className}`}
        ref={containerRef}
      />
    );
  }
);

MilkdownEditor.displayName = 'MilkdownEditor';
