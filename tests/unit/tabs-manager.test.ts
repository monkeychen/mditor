import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTabs } from '../../src/renderer/hooks/useTabs';

describe('useTabs Hook (AC1.2, AC1.3, AC1.4)', () => {
  it('initializes with a single default untitled tab', () => {
    const { result } = renderHook(() => useTabs());
    expect(result.current.tabs.length).toBe(1);
    expect(result.current.activeTab.fileName).toBe('Untitled.md');
    expect(result.current.activeTab.isDirty).toBe(false);
  });

  it('creates new tabs and switches to them', () => {
    const { result } = renderHook(() => useTabs());

    act(() => {
      result.current.createNewTab('Notes.md', '# My Notes');
    });

    expect(result.current.tabs.length).toBe(2);
    expect(result.current.activeTab.fileName).toBe('Notes.md');
    expect(result.current.activeTab.content).toBe('# My Notes');
  });

  it('switches between tabs by id and by index', () => {
    const { result } = renderHook(() => useTabs());

    let tab2Id = '';
    act(() => {
      const newTab = result.current.createNewTab('Tab2.md', 'Content 2');
      tab2Id = newTab.id;
    });

    expect(result.current.activeTabId).toBe(tab2Id);

    // 切回第 1 个 tab (index 0)
    act(() => {
      result.current.selectTabByIndex(0);
    });
    expect(result.current.activeTab.fileName).toBe('Untitled.md');

    // 切到第 2 个 tab
    act(() => {
      result.current.selectTabByIndex(1);
    });
    expect(result.current.activeTab.fileName).toBe('Tab2.md');
  });

  it('closes a clean tab without prompt', () => {
    const { result } = renderHook(() => useTabs());

    let tab2Id = '';
    act(() => {
      const newTab = result.current.createNewTab('Clean.md', 'Clean text');
      tab2Id = newTab.id;
    });

    act(() => {
      result.current.requestCloseTab(tab2Id);
    });

    expect(result.current.tabs.length).toBe(1);
    expect(result.current.closePendingTab).toBeNull();
  });

  it('blocks closing dirty tab and requires confirmation (AC1.4)', () => {
    const { result } = renderHook(() => useTabs());

    let dirtyTabId = '';
    act(() => {
      const newTab = result.current.createNewTab('Dirty.md', 'Old');
      dirtyTabId = newTab.id;
      result.current.updateTabContent(dirtyTabId, 'Modified dirty text');
    });

    expect(result.current.activeTab.isDirty).toBe(true);

    // 请求关闭
    act(() => {
      result.current.requestCloseTab(dirtyTabId);
    });

    // 此时应该触发关闭挂起确认
    expect(result.current.closePendingTab).not.toBeNull();
    expect(result.current.closePendingTab?.id).toBe(dirtyTabId);
    // 标签本身尚未被移除
    expect(result.current.tabs.length).toBe(2);

    // 确认放弃更改并关闭
    act(() => {
      result.current.confirmDiscardAndClose();
    });

    expect(result.current.closePendingTab).toBeNull();
    expect(result.current.tabs.length).toBe(1);
  });
});
