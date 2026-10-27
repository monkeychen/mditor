import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useTabs } from './hooks/useTabs';
import { MilkdownEditor, MilkdownEditorRef } from './editor/wysiwyg/MilkdownEditor';
import { SourceEditor } from './editor/source/SourceEditor';
import TabBar from './components/TabBar';
import OutlineDrawer from './components/OutlineDrawer';
import UnsavedConfirmModal from './components/UnsavedConfirmModal';
import SearchPanel from './components/SearchPanel';
import { WordCountPopover } from './components/WordCountPopover';
import { InsertTableModal } from './components/InsertTableModal';
import { ThemeSelectorPopover } from './components/ThemeSelectorPopover';
import {
  AppTheme,
  getStoredTheme,
  setAppTheme,
  applyThemeToDOM,
  THEME_LIST,
} from './services/themeService';
import { extractOutline, OutlineItem } from './utils/outline';
import { calculateDocumentStats } from './utils/counter';
import { findMatches, replaceSingle, replaceAll } from './utils/search';
import { copyWechatHtmlToClipboard } from './utils/wechatFormatter';
import { exportToHtml, exportToPdf } from './services/exportService';
import {
  openDocument,
  openDocumentByPath,
  openFolderDialog,
  scanDirectoryTree,
  saveDocument,
  saveDocumentAs,
} from './services/fileService';
import type { FileTreeNode } from '../types';
import {
  FolderOpen,
  Save,
  AlignLeft,
  Search,
  Share2,
  Check,
  FileCode,
  FileText,
  Table,
  Eye,
  AlignCenter,
  Sigma,
  Palette,
} from 'lucide-react';

const INITIAL_CONTENT = `# 设计第一性原理与 macOS 手感

用户体验是所有产品的最高准则。**后端可以很复杂，但用户触碰到的每一层必须丝滑。** 在 \`mditor\` 中，我们拒绝一切形式的交互迟滞。

## 核心交互特性

> 系统承担复杂性：能自动化的不手动，能推断的不让用户填，能一步完成的不拆成三步。

- [x] 基于 CodeMirror 6 纯文本架构，坚决不破坏 Markdown 源语法
- [x] 多标签页（Tab）与快捷键导航 (⌘T, ⌘W, ⌘1..9)
- [x] 本地图片直接粘贴自动存入 ./assets/
- [x] 悬浮式查找与替换 (⌘F, ⌘H)
- [x] 微信公众号/知乎 Inline CSS 一键富文本复制

## 本地图片自动落盘与渲染

![macOS 原生沉浸式无边框窗口布局](./assets/macos-window.png)

## 代码块高级渲染与一键复制

\`\`\`typescript
interface EditorConfig {
  livePreview: boolean;
  autoSave: boolean;
  theme: 'macos-light' | 'macos-dark';
}

export function initMditor(config: EditorConfig) {
  console.log("mditor started smoothly.");
}
\`\`\`

---

按快捷键 <kbd>⌘S</kbd> 即可即时存盘，无需担心文档意外丢失。`;

export const App: React.FC = () => {
  const {
    tabs,
    activeTabId,
    activeTab,
    closePendingTab,
    createNewTab,
    switchTab,
    updateTabContent,
    updateTabFile,
    updateTabMode,
    updateTabCursor,
    requestCloseTab,
    confirmDiscardAndClose,
    cancelClose,
  } = useTabs({
    id: 'tab-init',
    filePath: null,
    fileName: 'macOS-Philosophy.md',
    content: INITIAL_CONTENT,
    isDirty: false,
    saveStatus: 'saved',
    cursorLine: 1,
    cursorCol: 1,
  });

  const milkdownRef = useRef<MilkdownEditorRef | null>(null);

  const [isOutlineOpen, setIsOutlineOpen] = useState(true);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  // 文件树状态 (Typora 双视图侧边栏：文件 / 大纲)
  const [currentFolderPath, setCurrentFolderPath] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);

  // 专注模式 (F8) 与打字机滚动模式 (F9)
  const [focusMode, setFocusMode] = useState(false);
  const [typewriterMode, setTypewriterMode] = useState(false);

  // 经典多主题视觉系统 (v0.3.0 M4: AC-22.1 ~ AC-22.3)
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(getStoredTheme);
  const [isThemePopoverOpen, setIsThemePopoverOpen] = useState(false);

  useEffect(() => {
    applyThemeToDOM(currentTheme);
  }, [currentTheme]);

  const handleSelectTheme = useCallback((theme: AppTheme) => {
    setCurrentTheme(theme);
    setAppTheme(theme);
  }, []);

  // 字数统计浮窗与插入表格弹窗
  const [isWordCountOpen, setIsWordCountOpen] = useState(false);
  const [isInsertTableOpen, setIsInsertTableOpen] = useState(false);

  // 编辑器模式 (即时渲染 vs 纯源码)
  const currentMode = activeTab.mode || 'wysiwyg';

  const handleToggleMode = useCallback(() => {
    if (currentMode === 'wysiwyg' && milkdownRef.current) {
      const latestMd = milkdownRef.current.getMarkdown();
      if (latestMd && latestMd !== activeTab.content) {
        updateTabContent(activeTab.id, latestMd);
      }
    }
    const nextMode = currentMode === 'wysiwyg' ? 'source' : 'wysiwyg';
    updateTabMode(activeTab.id, nextMode);
  }, [currentMode, activeTab.id, activeTab.content, updateTabContent, updateTabMode]);

  const handleSwitchTab = useCallback(
    (targetTabId: string) => {
      if (currentMode === 'wysiwyg' && milkdownRef.current) {
        const latestMd = milkdownRef.current.getMarkdown();
        if (latestMd && latestMd !== activeTab.content) {
          updateTabContent(activeTab.id, latestMd);
        }
      }
      switchTab(targetTabId);
    },
    [currentMode, activeTab.id, activeTab.content, updateTabContent, switchTab]
  );

  const handleCreateNewTab = useCallback(
    (fileName?: string, content?: string, filePath?: string | null) => {
      if (currentMode === 'wysiwyg' && milkdownRef.current) {
        const latestMd = milkdownRef.current.getMarkdown();
        if (latestMd && latestMd !== activeTab.content) {
          updateTabContent(activeTab.id, latestMd);
        }
      }
      createNewTab(fileName, content, filePath);
    },
    [currentMode, activeTab.id, activeTab.content, updateTabContent, createNewTab]
  );

  // 搜索替换状态
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // 导出菜单与 Toast 状态
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, []);

  // 提取大纲与文档详细字数统计
  const outline = useMemo(() => {
    return extractOutline(activeTab.content);
  }, [activeTab.content]);

  const docStats = useMemo(() => {
    return calculateDocumentStats(activeTab.content);
  }, [activeTab.content]);

  // 当打开了具有本地路径的文档且当前尚未加载其父目录时，自动扫描所在目录填充侧边栏文件树
  useEffect(() => {
    if (!activeTab.filePath) return;
    const lastSlash = activeTab.filePath.lastIndexOf('/');
    if (lastSlash <= 0) return;
    const parentDir = activeTab.filePath.substring(0, lastSlash);
    if (!currentFolderPath || !activeTab.filePath.startsWith(currentFolderPath)) {
      setCurrentFolderPath(parentDir);
      scanDirectoryTree(parentDir).then((tree) => {
        setFileTree(tree);
      });
    }
  }, [activeTab.filePath, currentFolderPath]);

  // 搜索匹配计算
  const matches = useMemo(() => {
    return findMatches(activeTab.content, searchQuery);
  }, [activeTab.content, searchQuery]);

  useEffect(() => {
    if (matches.length > 0 && currentMatchIndex >= matches.length) {
      setCurrentMatchIndex(0);
    }
  }, [matches, currentMatchIndex]);

  // 保存当前 Tab (⌘S)
  const handleSaveActiveTab = useCallback(async () => {
    let contentToSave = activeTab.content;
    if (currentMode === 'wysiwyg' && milkdownRef.current) {
      const latestMd = milkdownRef.current.getMarkdown();
      if (latestMd) {
        contentToSave = latestMd;
        if (latestMd !== activeTab.content) {
          updateTabContent(activeTab.id, latestMd);
        }
      }
    }
    const res = await saveDocument(activeTab.filePath, contentToSave, activeTab.fileName);
    if (res.success && res.filePath) {
      const fileName = res.filePath.split('/').pop() || activeTab.fileName;
      updateTabFile(activeTab.id, res.filePath, fileName);
      showToast('文档已成功存盘');
    }
  }, [activeTab, currentMode, updateTabContent, updateTabFile, showToast]);

  // 另存为当前 Tab (⇧⌘S)
  const handleSaveAsActiveTab = useCallback(async () => {
    let contentToSave = activeTab.content;
    if (currentMode === 'wysiwyg' && milkdownRef.current) {
      const latestMd = milkdownRef.current.getMarkdown();
      if (latestMd) {
        contentToSave = latestMd;
      }
    }
    const res = await saveDocumentAs(activeTab.fileName, contentToSave);
    if (res && res.filePath) {
      const fileName = res.filePath.split('/').pop() || activeTab.fileName;
      updateTabFile(activeTab.id, res.filePath, fileName);
      showToast('文档已另存为新文件');
    }
  }, [activeTab, currentMode, updateTabFile, showToast]);

  // 打开本地文件并新建 Tab (⌘O)
  const handleOpenLocalFile = useCallback(async () => {
    const res = await openDocument();
    if (res) {
      handleCreateNewTab(res.fileName, res.content, res.filePath);
    }
  }, [handleCreateNewTab]);

  // 复制微信公众号富文本 (⇧⌘C)
  const handleCopyWechat = useCallback(async () => {
    setIsExportMenuOpen(false);
    const success = await copyWechatHtmlToClipboard(activeTab.content);
    if (success) {
      showToast('已复制为公众号/知乎排版 (直接 Cmd+V 粘贴)');
    }
  }, [activeTab.content, showToast]);

  // 插入数学公式 (⌥⌘M)
  const handleInsertMath = useCallback(() => {
    if (currentMode === 'wysiwyg' && milkdownRef.current) {
      milkdownRef.current.insertInlineMath();
      showToast('已插入数学公式 (⌥⌘M)');
    } else {
      updateTabContent(activeTab.id, activeTab.content + ' $f(x)$ ');
      showToast('已插入数学公式 (⌥⌘M)');
    }
  }, [currentMode, activeTab, updateTabContent, showToast]);

  // 快捷键监听 (全面对齐 Typora / macOS 常用快捷键)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      const keyLower = e.key.toLowerCase();

      if (isMeta && !e.shiftKey && !e.altKey && keyLower === 's') {
        e.preventDefault();
        handleSaveActiveTab();
      } else if (isMeta && e.shiftKey && !e.altKey && keyLower === 's') {
        e.preventDefault();
        handleSaveAsActiveTab();
      } else if (isMeta && !e.shiftKey && !e.altKey && keyLower === 'o') {
        e.preventDefault();
        handleOpenLocalFile();
      } else if (isMeta && !e.shiftKey && !e.altKey && keyLower === 'n') {
        e.preventDefault();
        handleCreateNewTab();
      } else if (isMeta && e.shiftKey && !e.altKey && keyLower === 'c') {
        e.preventDefault();
        handleCopyWechat();
      } else if (isMeta && e.key === '/') {
        e.preventDefault();
        handleToggleMode();
      } else if (isMeta && e.shiftKey && !e.altKey && (keyLower === 'o' || keyLower === 'l')) {
        e.preventDefault();
        setIsOutlineOpen((prev) => !prev);
      } else if (isMeta && e.altKey && (keyLower === 't' || e.code === 'KeyT')) {
        e.preventDefault();
        setIsInsertTableOpen(true);
      } else if (isMeta && e.altKey && (keyLower === 'm' || e.code === 'KeyM')) {
        e.preventDefault();
        handleInsertMath();
      } else if (e.key === 'F8') {
        e.preventDefault();
        setFocusMode((prev) => !prev);
      } else if (e.key === 'F9') {
        e.preventDefault();
        setTypewriterMode((prev) => !prev);
      } else if (isMeta && !e.altKey && keyLower === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (
        isMeta &&
        (keyLower === 'h' || (e.altKey && (keyLower === 'f' || e.code === 'KeyF')))
      ) {
        e.preventDefault();
        setIsSearchOpen(true);
        setIsReplaceOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleSaveActiveTab,
    handleSaveAsActiveTab,
    handleOpenLocalFile,
    handleCreateNewTab,
    handleCopyWechat,
    handleToggleMode,
    handleInsertMath,
  ]);

  // 搜索上一个 / 下一个
  const handleNextMatch = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
  }, [matches]);

  const handlePrevMatch = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
  }, [matches]);

  // 替换单个 (同时同步 Tab 状态与 Milkdown WYSIWYG 视图)
  const handleReplaceSingle = useCallback(() => {
    if (matches.length === 0) return;
    const currentMatch = matches[currentMatchIndex] || matches[0];
    const newContent = replaceSingle(activeTab.content, currentMatch, replaceText);
    updateTabContent(activeTab.id, newContent);
    if (currentMode === 'wysiwyg') {
      milkdownRef.current?.setMarkdown(newContent);
    }
    showToast('已替换 1 处匹配文本');
  }, [activeTab, matches, currentMatchIndex, replaceText, currentMode, updateTabContent, showToast]);

  // 全部替换 (同时同步 Tab 状态与 Milkdown WYSIWYG 视图)
  const handleReplaceAll = useCallback(() => {
    if (!searchQuery) return;
    const res = replaceAll(activeTab.content, searchQuery, replaceText);
    if (res.count > 0) {
      updateTabContent(activeTab.id, res.content);
      if (currentMode === 'wysiwyg') {
        milkdownRef.current?.setMarkdown(res.content);
      }
      showToast(`已完成 ${res.count} 处全部替换`);
    }
  }, [activeTab, searchQuery, replaceText, currentMode, updateTabContent, showToast]);

  // 打开本地文件夹至侧边栏文件树
  const handleOpenFolder = useCallback(async () => {
    const res = await openFolderDialog();
    if (res) {
      setCurrentFolderPath(res.folderPath);
      setFileTree(res.tree);
    }
  }, []);

  // 点击侧边栏文件树中的 Markdown 文件直接打开或切换
  const handleSelectSidebarFile = useCallback(
    async (filePath: string) => {
      const existing = tabs.find((t) => t.filePath === filePath);
      if (existing) {
        handleSwitchTab(existing.id);
        return;
      }
      const res = await openDocumentByPath(filePath);
      if (res) {
        handleCreateNewTab(res.fileName, res.content, res.filePath);
      }
    },
    [tabs, handleSwitchTab, handleCreateNewTab]
  );

  // 点击侧边栏大纲项跳转至对应章节
  const handleSelectOutlineHeading = useCallback(
    (item: OutlineItem) => {
      setActiveHeadingId(item.id);
      const idx = outline.findIndex((o) => o.id === item.id);
      if (currentMode === 'wysiwyg' && idx >= 0) {
        milkdownRef.current?.scrollToHeading(idx);
      } else {
        updateTabCursor(activeTab.id, item.line, 1);
      }
    },
    [outline, currentMode, activeTab.id, updateTabCursor]
  );

  // 插入指定行列数的 GFM 表格
  const handleInsertTable = useCallback(
    (rows: number, cols: number) => {
      if (currentMode === 'wysiwyg' && milkdownRef.current) {
        milkdownRef.current.insertTable(rows, cols);
        showToast(`已插入 ${rows} 行 × ${cols} 列表格`);
      } else {
        const headers = Array.from({ length: cols }, (_, i) => `表头 ${i + 1}`).join(' | ');
        const dividers = Array.from({ length: cols }, () => '---').join(' | ');
        const bodyRows = Array.from({ length: Math.max(1, rows - 1) }, () =>
          Array.from({ length: cols }, () => '内容').join(' | ')
        )
          .map((r) => `| ${r} |`)
          .join('\n');
        const tableMd = `\n| ${headers} |\n| ${dividers} |\n${bodyRows}\n`;
        updateTabContent(activeTab.id, activeTab.content + tableMd);
        showToast(`已插入 ${rows} 行 × ${cols} 列表格`);
      }
    },
    [currentMode, activeTab, updateTabContent, showToast]
  );

  // 导出为 HTML
  const handleExportHtml = useCallback(async () => {
    setIsExportMenuOpen(false);
    const success = await exportToHtml(activeTab.fileName, activeTab.content);
    if (success) {
      showToast('已成功导出为独立 HTML 文件');
    }
  }, [activeTab, showToast]);

  // 导出为 PDF
  const handleExportPdf = useCallback(async () => {
    setIsExportMenuOpen(false);
    const success = await exportToPdf(activeTab.fileName, activeTab.content);
    if (success) {
      showToast('已成功导出为 PDF 文档');
    }
  }, [activeTab, showToast]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#FAF8F5] select-none text-[#1D1D1F] overflow-hidden relative">
      {/* 顶部标题栏 + 多标签栏一体化 Header */}
      <header
        className="h-11 bg-[#FAF8F5] border-b border-black/5 flex items-center px-3 z-30 select-none"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* 左侧：避让 macOS 交通灯 (固定 72px，不随窗口拉伸偏移) */}
        <div className="w-[72px] shrink-0 h-full flex items-center" />

        {/* 中间：多标签页管理组件 (TabBar 自适应撑满剩余宽度，始终左对齐紧贴交通灯右侧) */}
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={handleSwitchTab}
          onCloseTab={requestCloseTab}
          onNewTab={() => handleCreateNewTab()}
        />

        {/* 右侧：常用工具入口 */}
        <div
          className="shrink-0 flex items-center space-x-1 text-stone-500 relative pl-2"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={() => setIsOutlineOpen((prev) => !prev)}
            title="切换大纲 (Cmd+Shift+O)"
            data-testid="sidebar-toggle-btn"
            className={`p-1.5 rounded-md transition ${
              isOutlineOpen ? 'bg-black/10 text-stone-900' : 'hover:bg-black/5 text-stone-600'
            }`}
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsInsertTableOpen(true)}
            title="插入表格 (⌥⌘T)"
            data-testid="toolbar-insert-table-btn"
            className="p-1.5 hover:bg-black/5 rounded-md text-stone-600 hover:text-stone-900 transition"
          >
            <Table className="w-4 h-4" />
          </button>
          <button
            onClick={handleInsertMath}
            title="插入数学公式 (⌥⌘M)"
            data-testid="toolbar-insert-math-btn"
            className="p-1.5 hover:bg-black/5 rounded-md text-stone-600 hover:text-stone-900 transition"
          >
            <Sigma className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsThemePopoverOpen((prev) => !prev)}
            title="切换排版主题"
            data-testid="toolbar-theme-btn"
            className="p-1.5 hover:bg-black/5 rounded-md text-stone-600 hover:text-stone-900 transition"
          >
            <Palette className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsSearchOpen((prev) => !prev)}
            title="查找与替换 (Cmd+F)"
            data-testid="toolbar-search-btn"
            className={`p-1.5 rounded-md transition ${
              isSearchOpen ? 'bg-amber-100 text-amber-800' : 'hover:bg-black/5 text-stone-600'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenLocalFile}
            title="打开文档 (Cmd+O)"
            className="p-1.5 hover:bg-black/5 rounded-md text-stone-600 hover:text-stone-900 transition"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
          <button
            onClick={handleSaveActiveTab}
            title="保存当前文档 (Cmd+S)"
            className="p-1.5 hover:bg-black/5 rounded-md text-stone-600 hover:text-stone-900 transition"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExportMenuOpen((prev) => !prev)}
            title="导出 / 分享"
            className="p-1.5 hover:bg-black/5 rounded-md text-stone-600 hover:text-stone-900 transition ml-0.5"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* 导出下拉菜单 */}
          {isExportMenuOpen && (
            <div className="absolute top-9 right-0 w-56 bg-white/95 backdrop-blur-md rounded-xl border border-black/10 shadow-xl py-1.5 z-50 text-xs text-stone-700 select-none animate-in fade-in duration-100">
              <div
                onClick={handleCopyWechat}
                className="px-3 py-2 hover:bg-amber-50 hover:text-amber-900 cursor-pointer flex items-center justify-between transition"
              >
                <span className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold font-mono">Wx</span>
                  <span>复制为公众号/知乎排版</span>
                </span>
                <span className="text-[10px] text-stone-400 font-mono">⌘⇧C</span>
              </div>
              <div className="h-px bg-black/5 my-1" />
              <div
                onClick={handleExportHtml}
                className="px-3 py-2 hover:bg-black/5 cursor-pointer flex items-center justify-between transition"
              >
                <span className="flex items-center gap-2">
                  <FileCode className="w-3.5 h-3.5 text-amber-600" />
                  <span>导出为独立 HTML</span>
                </span>
              </div>
              <div
                onClick={handleExportPdf}
                className="px-3 py-2 hover:bg-black/5 cursor-pointer flex items-center justify-between transition"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-red-500" />
                  <span>导出为 PDF 文档</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 中间工作区：左侧双视图侧边栏 (文件/大纲) + 右侧连续画布编辑器 */}
      <div className="flex-1 flex overflow-hidden relative">
        <OutlineDrawer
          isOpen={isOutlineOpen}
          outline={outline}
          activeHeadingId={activeHeadingId}
          onSelectHeading={handleSelectOutlineHeading}
          fileTree={fileTree}
          currentFolderPath={currentFolderPath}
          activeFilePath={activeTab.filePath}
          onSelectFile={handleSelectSidebarFile}
          onOpenFolder={handleOpenFolder}
        />

        <main className="flex-1 overflow-hidden relative bg-[var(--bg-primary,#FFFFFF)] transition-colors duration-150">
          {currentMode === 'wysiwyg' ? (
            <MilkdownEditor
              ref={milkdownRef}
              key={`${activeTab.id}-wysiwyg`}
              initialContent={activeTab.content}
              docFilePath={activeTab.filePath}
              focusMode={focusMode}
              typewriterMode={typewriterMode}
              onChange={(markdown) => updateTabContent(activeTab.id, markdown)}
              onCursorChange={(line, col) => updateTabCursor(activeTab.id, line, col)}
              onActiveHeadingChange={(idx) => {
                if (outline[idx]) {
                  setActiveHeadingId(outline[idx].id);
                }
              }}
            />
          ) : (
            <SourceEditor
              key={`${activeTab.id}-source`}
              content={activeTab.content}
              theme={currentTheme}
              cursorLine={activeTab.cursorLine}
              onChange={(newContent) => updateTabContent(activeTab.id, newContent)}
              onCursorChange={(line, col) => updateTabCursor(activeTab.id, line, col)}
            />
          )}

          {/* 悬浮查找替换面板 */}
          <SearchPanel
            isOpen={isSearchOpen}
            isReplaceOpen={isReplaceOpen}
            query={searchQuery}
            replaceText={replaceText}
            matches={matches}
            currentIndex={currentMatchIndex}
            onQueryChange={setSearchQuery}
            onReplaceTextChange={setReplaceText}
            onNext={handleNextMatch}
            onPrev={handlePrevMatch}
            onToggleReplace={() => setIsReplaceOpen((prev) => !prev)}
            onReplaceSingle={handleReplaceSingle}
            onReplaceAll={handleReplaceAll}
            onClose={() => setIsSearchOpen(false)}
          />
        </main>
      </div>

      {/* 底部 Typora 风格极简状态栏 */}
      <footer className="h-7 bg-[#FAF8F5] border-t border-black/5 px-4 flex items-center justify-between text-[11px] text-stone-500 font-mono select-none z-20 relative">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleMode}
            title="点击切换编辑模式 (⌘/)"
            data-testid="mode-toggle-btn"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-black/5 text-stone-700 transition"
          >
            {currentMode === 'wysiwyg' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                <span>🎨 实时渲染 (⌘/)</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1" />
                <span>📝 源码模式 (⌘/)</span>
              </>
            )}
          </button>

          <button
            onClick={() => setFocusMode((prev) => !prev)}
            title="切换专注模式 (F8)"
            data-testid="focus-mode-toggle-btn"
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition ${
              focusMode
                ? 'bg-blue-500/15 text-blue-700 font-semibold'
                : 'hover:bg-black/5 text-stone-500'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>专注模式</span>
          </button>

          <button
            onClick={() => setTypewriterMode((prev) => !prev)}
            title="切换打字机滚动模式 (F9)"
            data-testid="typewriter-mode-toggle-btn"
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition ${
              typewriterMode
                ? 'bg-blue-500/15 text-blue-700 font-semibold'
                : 'hover:bg-black/5 text-stone-500'
            }`}
          >
            <AlignCenter className="w-3 h-3" />
            <span>打字机</span>
          </button>

          <span>UTF-8</span>
        </div>

        <div className="flex items-center space-x-3 text-stone-500 relative">
          <button
            onClick={() => setIsThemePopoverOpen((prev) => !prev)}
            title="切换排版主题"
            data-testid="theme-toggle-btn"
            className="px-2 py-0.5 rounded hover:bg-black/5 text-stone-600 transition flex items-center gap-1.5"
          >
            <Palette className="w-3 h-3 text-stone-400" />
            <span>{THEME_LIST.find((t) => t.id === currentTheme)?.label || '主题'}</span>
          </button>

          <button
            onClick={() => setIsWordCountOpen((prev) => !prev)}
            title="点击查看字数与阅读时间详情"
            data-testid="word-count-trigger-btn"
            className="px-2 py-0.5 rounded hover:bg-black/5 text-stone-600 transition flex items-center gap-2"
          >
            <span>{docStats.wordCount} 词</span>
            <span className="text-stone-300">|</span>
            <span>{activeTab.content.length} 字符</span>
          </button>
          <span>{outline.length} 章节</span>

          <ThemeSelectorPopover
            currentTheme={currentTheme}
            isOpen={isThemePopoverOpen}
            onSelect={handleSelectTheme}
            onClose={() => setIsThemePopoverOpen(false)}
          />

          <WordCountPopover
            stats={docStats}
            isOpen={isWordCountOpen}
            onClose={() => setIsWordCountOpen(false)}
          />
        </div>
      </footer>

      {/* 插入表格弹窗 (⌥⌘T) */}
      <InsertTableModal
        isOpen={isInsertTableOpen}
        onClose={() => setIsInsertTableOpen(false)}
        onInsert={handleInsertTable}
      />

      {/* 未保存阻断确认 Modal */}
      <UnsavedConfirmModal
        tab={closePendingTab}
        onCancel={cancelClose}
        onDiscard={confirmDiscardAndClose}
        onSave={async () => {
          if (closePendingTab) {
            await saveDocument(closePendingTab.filePath, closePendingTab.content, closePendingTab.fileName);
            confirmDiscardAndClose();
          }
        }}
      />

      {/* Toast 提示浮层 */}
      {toastMessage && (
        <div id="app-toast" className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-stone-900/95 text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default App;
