import { useState, useCallback, useEffect } from 'react';
import type { TabItem, EditorMode } from '../../types';

export function createDefaultTab(
  fileName = 'Untitled.md',
  content = '',
  filePath: string | null = null
): TabItem {
  return {
    id: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    filePath,
    fileName,
    content,
    isDirty: false,
    saveStatus: 'saved',
    mode: 'wysiwyg',
    cursorLine: 1,
    cursorCol: 1,
  };
}

export function useTabs(initialTab?: TabItem) {
  const [tabs, setTabs] = useState<TabItem[]>(() => [initialTab || createDefaultTab()]);
  const [activeTabId, setActiveTabId] = useState<string>(() => (initialTab ? initialTab.id : tabs[0]?.id || ''));
  const [closePendingTab, setClosePendingTab] = useState<TabItem | null>(null);

  // 保证 activeTabId 有效
  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((t) => t.id === activeTabId)) {
      setActiveTabId(tabs[tabs.length - 1].id);
    }
  }, [tabs, activeTabId]);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // 新建 Tab
  const createNewTab = useCallback(
    (fileName = 'Untitled.md', content = '', filePath: string | null = null) => {
      const newTab = createDefaultTab(fileName, content, filePath);
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newTab.id);
      return newTab;
    },
    []
  );

  // 切换 Tab
  const switchTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  // 按索引切换 Tab (0-based)
  const selectTabByIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < tabs.length) {
        setActiveTabId(tabs[index].id);
      }
    },
    [tabs]
  );

  // 更新某个 Tab 的内容
  const updateTabContent = useCallback((tabId: string, newContent: string) => {
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id === tabId) {
          return {
            ...tab,
            content: newContent,
            isDirty: true,
            saveStatus: 'unsaved',
          };
        }
        return tab;
      })
    );
  }, []);

  // 更新 Tab 的模式 (wysiwyg / source)
  const updateTabMode = useCallback((tabId: string, mode: EditorMode) => {
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id === tabId) {
          return {
            ...tab,
            mode,
          };
        }
        return tab;
      })
    );
  }, []);

  // 更新 Tab 的光标位置
  const updateTabCursor = useCallback((tabId: string, line: number, col: number) => {
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id === tabId) {
          return {
            ...tab,
            cursorLine: line,
            cursorCol: col,
          };
        }
        return tab;
      })
    );
  }, []);

  // 更新 Tab 的文件持久化信息
  const updateTabFile = useCallback((tabId: string, filePath: string, fileName: string) => {
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id === tabId) {
          return {
            ...tab,
            filePath,
            fileName,
            isDirty: false,
            saveStatus: 'saved',
          };
        }
        return tab;
      })
    );
  }, []);

  // 直接执行关闭
  const forceCloseTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const nextTabs = prev.filter((t) => t.id !== tabId);
        if (nextTabs.length === 0) {
          const freshTab = createDefaultTab();
          setActiveTabId(freshTab.id);
          return [freshTab];
        }
        if (tabId === activeTabId) {
          const closedIndex = prev.findIndex((t) => t.id === tabId);
          const nextActive = nextTabs[Math.max(0, closedIndex - 1)];
          setActiveTabId(nextActive.id);
        }
        return nextTabs;
      });
      setClosePendingTab(null);
    },
    [activeTabId]
  );

  // 请求关闭 Tab
  const requestCloseTab = useCallback(
    (tabId: string) => {
      const target = tabs.find((t) => t.id === tabId);
      if (!target) return;

      if (target.isDirty) {
        setClosePendingTab(target);
      } else {
        forceCloseTab(tabId);
      }
    },
    [tabs, forceCloseTab]
  );

  // 放弃修改关闭
  const confirmDiscardAndClose = useCallback(() => {
    if (closePendingTab) {
      forceCloseTab(closePendingTab.id);
    }
  }, [closePendingTab, forceCloseTab]);

  // 取消关闭
  const cancelClose = useCallback(() => {
    setClosePendingTab(null);
  }, []);

  // 快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key === 't') {
        e.preventDefault();
        createNewTab();
      } else if (isMeta && e.key === 'w') {
        e.preventDefault();
        requestCloseTab(activeTabId);
      } else if (isMeta && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key, 10) - 1;
        selectTabByIndex(index);
      } else if (isMeta && e.shiftKey && (e.key === '[' || e.key === '{')) {
        e.preventDefault();
        const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
        const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        selectTabByIndex(prevIndex);
      } else if (isMeta && e.shiftKey && (e.key === ']' || e.key === '}')) {
        e.preventDefault();
        const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
        const nextIndex = (currentIndex + 1) % tabs.length;
        selectTabByIndex(nextIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [createNewTab, requestCloseTab, activeTabId, selectTabByIndex, tabs]);

  return {
    tabs,
    activeTabId,
    activeTab,
    closePendingTab,
    createNewTab,
    switchTab,
    selectTabByIndex,
    updateTabContent,
    updateTabFile,
    updateTabMode,
    updateTabCursor,
    requestCloseTab,
    confirmDiscardAndClose,
    cancelClose,
  };
}
