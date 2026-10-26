import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useTabs } from './hooks/useTabs';
import { MilkdownEditor } from './editor/wysiwyg/MilkdownEditor';
import { SourceEditor } from './editor/source/SourceEditor';
import TabBar from './components/TabBar';
import OutlineDrawer from './components/OutlineDrawer';
import UnsavedConfirmModal from './components/UnsavedConfirmModal';
import SearchPanel from './components/SearchPanel';
import { extractOutline } from './utils/outline';
import { findMatches, replaceSingle, replaceAll } from './utils/search';
import { copyWechatHtmlToClipboard } from './utils/wechatFormatter';
import { exportToHtml, exportToPdf } from './services/exportService';
import { openDocument, saveDocument } from './services/fileService';
import { FolderOpen, Save, AlignLeft, Search, Share2, Check, FileCode, FileText } from 'lucide-react';

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

  const [isOutlineOpen, setIsOutlineOpen] = useState(true);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  // 编辑器模式 (即时渲染 vs 纯源码)
  const currentMode = activeTab.mode || 'wysiwyg';

  const handleToggleMode = useCallback(() => {
    const nextMode = currentMode === 'wysiwyg' ? 'source' : 'wysiwyg';
    updateTabMode(activeTab.id, nextMode);
  }, [currentMode, activeTab.id, updateTabMode]);

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

  // 提取大纲
  const outline = useMemo(() => {
    return extractOutline(activeTab.content);
  }, [activeTab.content]);

  // 搜索匹配计算
  const matches = useMemo(() => {
    return findMatches(activeTab.content, searchQuery);
  }, [activeTab.content, searchQuery]);

  useEffect(() => {
    if (matches.length > 0 && currentMatchIndex >= matches.length) {
      setCurrentMatchIndex(0);
    }
  }, [matches, currentMatchIndex]);

  // 快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key === '/') {
        e.preventDefault();
        handleToggleMode();
      } else if (isMeta && e.shiftKey && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        setIsOutlineOpen((prev) => !prev);
      } else if (isMeta && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (isMeta && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        setIsSearchOpen(true);
        setIsReplaceOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleMode]);

  // 搜索上一个 / 下一个
  const handleNextMatch = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
  }, [matches]);

  const handlePrevMatch = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
  }, [matches]);

  // 替换单个
  const handleReplaceSingle = useCallback(() => {
    if (matches.length === 0) return;
    const currentMatch = matches[currentMatchIndex] || matches[0];
    const newContent = replaceSingle(activeTab.content, currentMatch, replaceText);
    updateTabContent(activeTab.id, newContent);
    showToast('已替换 1 处匹配文本');
  }, [activeTab, matches, currentMatchIndex, replaceText, updateTabContent, showToast]);

  // 全部替换
  const handleReplaceAll = useCallback(() => {
    if (!searchQuery) return;
    const res = replaceAll(activeTab.content, searchQuery, replaceText);
    if (res.count > 0) {
      updateTabContent(activeTab.id, res.content);
      showToast(`已完成 ${res.count} 处全部替换`);
    }
  }, [activeTab, searchQuery, replaceText, updateTabContent, showToast]);

  // 保存当前 Tab
  const handleSaveActiveTab = useCallback(async () => {
    const res = await saveDocument(activeTab.filePath, activeTab.content, activeTab.fileName);
    if (res.success && res.filePath) {
      const fileName = res.filePath.split('/').pop() || activeTab.fileName;
      updateTabFile(activeTab.id, res.filePath, fileName);
      showToast('文档已成功存盘');
    }
  }, [activeTab, updateTabFile, showToast]);

  // 打开本地文件并新建 Tab
  const handleOpenLocalFile = useCallback(async () => {
    const res = await openDocument();
    if (res) {
      createNewTab(res.fileName, res.content, res.filePath);
    }
  }, [createNewTab]);

  // 复制微信公众号富文本
  const handleCopyWechat = useCallback(async () => {
    setIsExportMenuOpen(false);
    const success = await copyWechatHtmlToClipboard(activeTab.content);
    if (success) {
      showToast('已复制为公众号/知乎排版 (直接 Cmd+V 粘贴)');
    }
  }, [activeTab.content, showToast]);

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
      <header className="h-11 bg-[#FAF8F5] border-b border-black/5 flex items-center justify-between px-3 z-30 select-none">
        {/* 左侧：避让 macOS 交通灯 (w-20) */}
        <div className="w-20 flex items-center" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />

        {/* 中间：多标签页管理组件 (TabBar) */}
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={switchTab}
          onCloseTab={requestCloseTab}
          onNewTab={() => createNewTab()}
        />

        {/* 右侧：常用工具入口 */}
        <div className="flex items-center space-x-1 text-stone-500 relative">
          <button
            onClick={() => setIsOutlineOpen((prev) => !prev)}
            title="切换大纲 (Cmd+Shift+O)"
            className={`p-1.5 rounded-md transition ${
              isOutlineOpen ? 'bg-black/10 text-stone-900' : 'hover:bg-black/5 text-stone-600'
            }`}
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsSearchOpen((prev) => !prev)}
            title="查找与替换 (Cmd+F)"
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

      {/* 中间工作区：左侧大纲抽屉 + 右侧编辑器 */}
      <div className="flex-1 flex overflow-hidden relative">
        <OutlineDrawer
          isOpen={isOutlineOpen}
          outline={outline}
          activeHeadingId={activeHeadingId}
          onSelectHeading={(item) => setActiveHeadingId(item.id)}
        />

        <main className="flex-1 overflow-hidden relative">
          {currentMode === 'wysiwyg' ? (
            <MilkdownEditor
              key={`${activeTab.id}-wysiwyg`}
              initialContent={activeTab.content}
              docFilePath={activeTab.filePath}
              onChange={(markdown) => updateTabContent(activeTab.id, markdown)}
              onCursorChange={(line, col) => updateTabCursor(activeTab.id, line, col)}
            />
          ) : (
            <SourceEditor
              key={`${activeTab.id}-source`}
              content={activeTab.content}
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

      {/* 底部状态栏 */}
      <footer className="h-6.5 bg-[#FAF8F5] border-t border-black/5 px-4 flex items-center justify-between text-[11px] text-stone-500 font-mono select-none z-20">
        <div className="flex items-center space-x-3">
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
          <span>UTF-8</span>
        </div>
        <div className="flex items-center space-x-4 text-stone-400">
          <span>{activeTab.content.length} 字符</span>
          <span>{outline.length} 章节</span>
        </div>
      </footer>

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
