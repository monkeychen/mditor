import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TabBar, { getTabTooltip } from '../../src/renderer/components/TabBar';
import { createDefaultTab } from '../../src/renderer/hooks/useTabs';
import type { TabItem } from '../../src/types';

describe('TabBar Smart Hover Tooltip & Title Detection (T518 / F39 / AC-39.1 ~ AC-39.4)', () => {
  describe('getTabTooltip utility logic', () => {
    it('AC-39.1: returns full physical filePath when document has a valid filePath', () => {
      const tab: TabItem = {
        ...createDefaultTab('README.md', '# Local Title', '/Users/chenzhian/docs/README.md'),
      };
      expect(getTabTooltip(tab)).toBe('/Users/chenzhian/docs/README.md');
    });

    it('AC-39.1: returns full physical filePath even when document is modified and dirty', () => {
      const tab: TabItem = {
        ...createDefaultTab('spec.md', '# Modified Spec', '/Users/chenzhian/projects/spec.md'),
        isDirty: true,
        saveStatus: 'unsaved',
      };
      expect(getTabTooltip(tab)).toBe('/Users/chenzhian/projects/spec.md');
    });

    it('AC-39.2: extracts first-line Markdown heading as title when document is unsaved (filePath is null)', () => {
      const tab: TabItem = {
        ...createDefaultTab('Untitled.md', '# 2026 年度研发规划\n\n这是正文内容...', null),
      };
      expect(getTabTooltip(tab)).toBe('2026 年度研发规划');
    });

    it('AC-39.2: strips multiple levels of heading hashes (##, ###) and clean inline formatting', () => {
      const tabH2: TabItem = {
        ...createDefaultTab('Untitled.md', '## 二级核心架构设计\n正文', null),
      };
      expect(getTabTooltip(tabH2)).toBe('二级核心架构设计');

      const tabFormatted: TabItem = {
        ...createDefaultTab('Untitled.md', '# **重要方案** 与 `核心` 指南\n内容', null),
      };
      expect(getTabTooltip(tabFormatted)).toBe('重要方案 与 核心 指南');
    });

    it('AC-39.2: skips leading empty lines to extract the first valid content line', () => {
      const tabWithLeadingNewlines: TabItem = {
        ...createDefaultTab('Untitled.md', '\n\n  \n# 延迟出现的标题\n细节内容', null),
      };
      expect(getTabTooltip(tabWithLeadingNewlines)).toBe('延迟出现的标题');
    });

    it('AC-39.2: extracts plain text first line when no markdown heading syntax is used', () => {
      const tabPlainText: TabItem = {
        ...createDefaultTab('Untitled.md', '这是一条随手记录的便签\n第二行内容', null),
      };
      expect(getTabTooltip(tabPlainText)).toBe('这是一条随手记录的便签');
    });

    it('AC-39.3: falls back to tab.fileName when content is empty or only whitespace', () => {
      const emptyTab: TabItem = {
        ...createDefaultTab('Untitled.md', '', null),
      };
      expect(getTabTooltip(emptyTab)).toBe('Untitled.md');

      const whitespaceTab: TabItem = {
        ...createDefaultTab('CustomDraft.md', '   \n\n  \t  \n', null),
      };
      expect(getTabTooltip(whitespaceTab)).toBe('CustomDraft.md');
    });
  });

  describe('TabBar DOM rendering and tooltip attributes (AC-39.4)', () => {
    it('sets tooltip title on both tab item container and inner text span', () => {
      const tabs: TabItem[] = [
        {
          ...createDefaultTab('SavedDoc.md', '# Saved', '/path/to/SavedDoc.md'),
          id: 'tab-saved',
        },
        {
          ...createDefaultTab('Untitled.md', '# 新建未保存草稿\n正文', null),
          id: 'tab-unsaved',
        },
      ];

      render(
        <TabBar
          tabs={tabs}
          activeTabId="tab-saved"
          onSelectTab={() => {}}
          onCloseTab={() => {}}
          onNewTab={() => {}}
        />
      );

      const savedTab = screen.getByTestId('tab-SavedDoc.md');
      expect(savedTab).toHaveAttribute('title', '/path/to/SavedDoc.md');

      const unsavedTab = screen.getByTestId('tab-Untitled.md');
      expect(unsavedTab).toHaveAttribute('title', '新建未保存草稿');
    });
  });
});
