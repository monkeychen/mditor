import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDocument } from '../../src/renderer/hooks/useDocument';

describe('useDocument Hook (AC3.3)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with default untitled document', () => {
    const { result } = renderHook(() => useDocument());
    expect(result.current.document.fileName).toBe('Untitled.md');
    expect(result.current.document.isDirty).toBe(false);
    expect(result.current.document.saveStatus).toBe('saved');
  });

  it('marks document as dirty and unsaved on content change', () => {
    const { result } = renderHook(() => useDocument());

    act(() => {
      result.current.updateContent('# New Content');
    });

    expect(result.current.document.isDirty).toBe(true);
    expect(result.current.document.saveStatus).toBe('unsaved');
    expect(result.current.document.content).toBe('# New Content');
  });

  it('debounces auto-save when filePath exists', async () => {
    window.electronAPI = {
      openFile: vi.fn(),
      saveFile: vi.fn().mockResolvedValue({ success: true, filePath: '/test/notes.md' }),
      saveFileAs: vi.fn(),
    };

    const { result } = renderHook(() =>
      useDocument({
        filePath: '/test/notes.md',
        fileName: 'notes.md',
        content: '# Old',
      })
    );

    act(() => {
      result.current.updateContent('# Changed 1');
    });

    // 还没到 1500ms
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(window.electronAPI.saveFile).not.toHaveBeenCalled();

    // 再次修改，防抖重置
    act(() => {
      result.current.updateContent('# Changed 2');
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(window.electronAPI.saveFile).not.toHaveBeenCalled();

    // 走完 1500ms
    await act(async () => {
      vi.advanceTimersByTime(600);
      await Promise.resolve();
    });

    expect(window.electronAPI.saveFile).toHaveBeenCalledWith('/test/notes.md', '# Changed 2');
    expect(result.current.document.saveStatus).toBe('saved');
    expect(result.current.document.isDirty).toBe(false);
  });
});
