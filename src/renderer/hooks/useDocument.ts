import { useState, useRef, useEffect, useCallback } from 'react';
import type { DocumentState } from '../../types';
import { saveDocument, openDocument } from '../services/fileService';
import { calculateDocumentStats } from '../utils/counter';

export interface UseDocumentOptions {
  filePath?: string | null;
  fileName?: string;
  content?: string;
}

export function useDocument(initialOptions: UseDocumentOptions = {}) {
  const [docState, setDocState] = useState<DocumentState>(() => {
    const initialContent = initialOptions.content || '';
    const stats = calculateDocumentStats(initialContent);
    return {
      filePath: initialOptions.filePath || null,
      fileName: initialOptions.fileName || 'Untitled.md',
      content: initialContent,
      isDirty: false,
      saveStatus: 'saved',
      wordCount: stats.charCount,
      cursorLine: 1,
      cursorCol: 1,
    };
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const docRef = useRef(docState);
  docRef.current = docState;

  // 手动保存
  const handleSave = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setDocState((prev) => ({ ...prev, saveStatus: 'saving' }));
    const result = await saveDocument(docRef.current.filePath, docRef.current.content, docRef.current.fileName);

    if (result.success && result.filePath) {
      const fileName = result.filePath.split('/').pop() || docRef.current.fileName;
      setDocState((prev) => ({
        ...prev,
        filePath: result.filePath || prev.filePath,
        fileName,
        isDirty: false,
        saveStatus: 'saved',
      }));
    } else {
      setDocState((prev) => ({
        ...prev,
        saveStatus: prev.isDirty ? 'unsaved' : 'saved',
      }));
    }
  }, []);

  // 更新内容并触发自动保存防抖
  const updateContent = useCallback((newContent: string) => {
    const stats = calculateDocumentStats(newContent);

    setDocState((prev) => {
      return {
        ...prev,
        content: newContent,
        isDirty: true,
        saveStatus: 'unsaved',
        wordCount: stats.charCount,
      };
    });

    // 防抖自动保存
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      if (docRef.current.filePath) {
        setDocState((prev) => ({ ...prev, saveStatus: 'saving' }));
        const result = await saveDocument(docRef.current.filePath, newContent, docRef.current.fileName);
        if (result.success) {
          setDocState((prev) => ({
            ...prev,
            isDirty: false,
            saveStatus: 'saved',
          }));
        }
      }
    }, 1500);
  }, []);

  // 打开文件
  const handleOpen = useCallback(async () => {
    const res = await openDocument();
    if (res) {
      const stats = calculateDocumentStats(res.content);
      setDocState({
        filePath: res.filePath,
        fileName: res.fileName,
        content: res.content,
        isDirty: false,
        saveStatus: 'saved',
        wordCount: stats.charCount,
        cursorLine: 1,
        cursorCol: 1,
      });
    }
  }, []);

  // 新建文件
  const handleNew = useCallback(() => {
    setDocState({
      filePath: null,
      fileName: 'Untitled.md',
      content: '',
      isDirty: false,
      saveStatus: 'saved',
      wordCount: 0,
      cursorLine: 1,
      cursorCol: 1,
    });
  }, []);

  // 更新光标位置
  const updateCursor = useCallback((line: number, col: number) => {
    setDocState((prev) => ({
      ...prev,
      cursorLine: line,
      cursorCol: col,
    }));
  }, []);

  // 快捷键全局监听 (Cmd+S / Cmd+O / Cmd+N)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if (isMeta && e.key === 'o') {
        e.preventDefault();
        handleOpen();
      } else if (isMeta && e.key === 'n') {
        e.preventDefault();
        handleNew();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [handleSave, handleOpen, handleNew]);

  return {
    document: docState,
    updateContent,
    updateCursor,
    save: handleSave,
    open: handleOpen,
    newDoc: handleNew,
  };
}
