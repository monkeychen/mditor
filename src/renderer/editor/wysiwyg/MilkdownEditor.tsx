import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import type { EditorView } from '@milkdown/prose/view';
import {
  Editor,
  rootCtx,
  defaultValueCtx,
  editorViewCtx,
  serializerCtx,
  parserCtx,
  editorStateCtx,
  prosePluginsCtx,
  remarkStringifyOptionsCtx,
} from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { createDelimiterPlugin } from './delimiterPlugin';
import { createAutoPairPlugin } from './autoPairPlugin';
import { createFormatKeymapPlugin } from './formatKeymapPlugin';
import { createTableToolbarPlugin, TableToolbarState } from './table/tableToolbarPlugin';
import { createTableNavKeymapPlugin } from './table/tableNavKeymap';
import { TableToolbar } from './table/TableToolbar';
import { createCodeBlockWidgetPlugin } from './code/codeBlockWidgetPlugin';
import { createCodeBlockKeymapPlugin } from './code/codeBlockKeymap';
import { createImageWidgetPlugin } from './image/imageWidgetPlugin';
import { createImagePastePlugin } from './image/imagePastePlugin';
import { createPlaceholderPlugin } from './placeholderPlugin';
import '../../styles/milkdown.css';

export interface MilkdownEditorProps {
  initialContent?: string;
  docFilePath?: string | null;
  autoFocus?: boolean;
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
  (
    {
      initialContent = '',
      docFilePath = null,
      autoFocus = true,
      onChange,
      onCursorChange: _onCursorChange,
      className = '',
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const editorInstanceRef = useRef<Editor | null>(null);
    const docFilePathRef = useRef<string | null>(docFilePath);

    useEffect(() => {
      docFilePathRef.current = docFilePath;
    }, [docFilePath]);

    const [tableToolbarState, setTableToolbarState] = useState<TableToolbarState>({
      visible: false,
      tablePos: -1,
      rect: { top: 0, left: 0, width: 0 },
    });
    const [editorView, setEditorView] = useState<EditorView | null>(null);

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
      const container = containerRef.current;
      if (!container) return;

      let isEffectCancelled = false;
      let pendingEditor: Editor | null = null;

      // 清理容器遗留 DOM，杜绝任何双实例并发挂载
      container.innerHTML = '';

      const editor = Editor.make()
        .config((ctx) => {
          ctx.set(rootCtx, container);
          ctx.set(defaultValueCtx, initialContent);
          ctx.update(remarkStringifyOptionsCtx, (prev) => ({
            ...prev,
            bullet: '-' as const,
            rule: '-' as const,
            emphasis: '*' as const,
            strong: '*' as const,
          }));
          ctx.update(prosePluginsCtx, (prev) => [
            ...prev,
            createPlaceholderPlugin('开始书写，或输入 # 创建标题、- 创建列表、| 创建表格...'),
            createDelimiterPlugin(),
            createAutoPairPlugin(),
            createFormatKeymapPlugin(),
            createTableToolbarPlugin(setTableToolbarState),
            createTableNavKeymapPlugin(),
            createCodeBlockWidgetPlugin(),
            createCodeBlockKeymapPlugin(),
            createImageWidgetPlugin(() => docFilePathRef.current),
            createImagePastePlugin(() => docFilePathRef.current),
          ]);
          ctx.get(listenerCtx).markdownUpdated((_, markdown) => {
            if (!isEffectCancelled && onChange) {
              onChange(markdown);
            }
          });
        })
        .use(commonmark)
        .use(gfm)
        .use(listener);

      pendingEditor = editor;

      editor.create().then((createdEditor) => {
        // 若在创建完成前该 effect 已被取消或卸载，立即彻底销毁
        if (isEffectCancelled) {
          createdEditor.destroy();
          return;
        }

        editorInstanceRef.current = createdEditor;
        try {
          const view = createdEditor.action((ctx) => ctx.get(editorViewCtx));
          setEditorView(view);
          // 仅在新建空文档时自动聚焦，已有文档不干扰默认光标
          if (autoFocus && !initialContent) {
            view.focus();
          }
        } catch {
          // ignore
        }
      }).catch((err) => {
        if (!isEffectCancelled) {
          console.error('[Milkdown] Failed to create editor instance:', err);
        }
      });

      return () => {
        isEffectCancelled = true;
        if (editorInstanceRef.current) {
          editorInstanceRef.current.destroy();
          editorInstanceRef.current = null;
        } else if (pendingEditor) {
          try {
            pendingEditor.destroy();
          } catch {
            // ignore
          }
        }
        if (container) {
          container.innerHTML = '';
        }
      };
    }, []); // 仅挂载一次，内容更新通过 setMarkdown 控制

    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;

      // 若点击已发生在 ProseMirror 可编辑正文内部，完全交给 ProseMirror 原生处理，外层绝不干预！
      if (target.closest('.ProseMirror')) {
        return;
      }

      // 避免点中按钮、工具栏等交互控件时干扰焦点
      if (
        target.closest('button') ||
        target.closest('.table-toolbar') ||
        target.closest('.image-source-pill') ||
        target.closest('.code-copy-btn') ||
        target.closest('.code-lang-selector')
      ) {
        return;
      }

      const editor = editorInstanceRef.current;
      if (!editor) return;

      try {
        editor.action((ctx) => {
          const view = ctx.get(editorViewCtx);
          view.focus();
        });
      } catch {
        // ignore
      }
    };

    return (
      <div className="relative w-full h-full overflow-hidden bg-white" onClick={handleContainerClick}>
        <TableToolbar
          toolbarState={tableToolbarState}
          editorView={editorView}
          containerRect={containerRef.current?.getBoundingClientRect()}
        />
        <div
          className={`milkdown-wysiwyg-container w-full h-full overflow-y-auto ${className}`}
          ref={containerRef}
        />
      </div>
    );
  }
);

MilkdownEditor.displayName = 'MilkdownEditor';
