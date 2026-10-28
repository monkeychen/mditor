import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TabBar from '../../src/renderer/components/TabBar';
import { useTabs, createDefaultTab } from '../../src/renderer/hooks/useTabs';
import type { TabItem } from '../../src/types';

describe('Tab Reorder Engine (T505 / F34 / AC-34.1 ~ AC-34.2)', () => {
  describe('useTabs hook reorderTabs', () => {
    it('reorders tabs correctly from fromIndex to toIndex without mutating active tab id', () => {
      const tab1: TabItem = { ...createDefaultTab('doc1.md'), id: 'tab-1' };

      const { result } = renderHook(() => useTabs(tab1));

      // Append tab2 and tab3
      act(() => {
        result.current.createNewTab('doc2.md', '', null);
      });
      act(() => {
        result.current.createNewTab('doc3.md', '', null);
      });

      // Initially 3 tabs: tab1, newTab2, newTab3
      expect(result.current.tabs).toHaveLength(3);
      const firstTabName = result.current.tabs[0].fileName;
      const lastTabName = result.current.tabs[2].fileName;

      // Move last tab to index 0
      act(() => {
        (result.current as any).reorderTabs(2, 0);
      });

      expect(result.current.tabs[0].fileName).toBe(lastTabName);
      expect(result.current.tabs[1].fileName).toBe(firstTabName);
    });

    it('ignores invalid fromIndex or toIndex out of bounds', () => {
      const tab1: TabItem = { ...createDefaultTab('doc1.md'), id: 'tab-1' };
      const { result } = renderHook(() => useTabs(tab1));

      const originalOrder = [...result.current.tabs];
      act(() => {
        (result.current as any).reorderTabs(-1, 5);
      });
      expect(result.current.tabs).toEqual(originalOrder);
    });
  });

  describe('TabBar drag and drop UI', () => {
    const mockTabs: TabItem[] = [
      { ...createDefaultTab('alpha.md'), id: 'tab-alpha' },
      { ...createDefaultTab('beta.md'), id: 'tab-beta' },
      { ...createDefaultTab('gamma.md'), id: 'tab-gamma' },
    ];

    it('renders tabs as draggable elements', () => {
      render(
        <TabBar
          tabs={mockTabs}
          activeTabId="tab-alpha"
          onSelectTab={vi.fn()}
          onCloseTab={vi.fn()}
          onNewTab={vi.fn()}
        />
      );

      const tabAlpha = screen.getByTestId('tab-alpha.md');
      const tabBeta = screen.getByTestId('tab-beta.md');
      expect(tabAlpha).toHaveAttribute('draggable', 'true');
      expect(tabBeta).toHaveAttribute('draggable', 'true');
    });

    it('triggers onReorderTabs when dragging tab and dropping onto another tab', () => {
      const handleReorder = vi.fn();
      render(
        <TabBar
          tabs={mockTabs}
          activeTabId="tab-alpha"
          onSelectTab={vi.fn()}
          onCloseTab={vi.fn()}
          onNewTab={vi.fn()}
          onReorderTabs={handleReorder}
        />
      );

      const tabAlpha = screen.getByTestId('tab-alpha.md');
      const tabGamma = screen.getByTestId('tab-gamma.md');

      // 1. Drag start on tab-alpha
      fireEvent.dragStart(tabAlpha, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: 'move',
        },
      });

      // 2. Drag over tab-gamma
      fireEvent.dragOver(tabGamma, {
        clientX: 300,
        currentTarget: {
          getBoundingClientRect: () => ({ left: 200, width: 100 }),
        },
      });

      // 3. Drop on tab-gamma
      fireEvent.drop(tabGamma, {
        clientX: 300,
        currentTarget: {
          getBoundingClientRect: () => ({ left: 200, width: 100 }),
        },
      });

      expect(handleReorder).toHaveBeenCalledWith(0, 2);
    });
  });
});
