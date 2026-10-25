import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTabs } from './hooks/useTabs';
import Editor from './editor/Editor';
import TabBar from './components/TabBar';
import OutlineDrawer from './components/OutlineDrawer';
import UnsavedConfirmModal from './components/UnsavedConfirmModal';
import { extractOutline, OutlineItem } from './utils/outline';
import { openDocument, saveDocument } from './services/fileService';
import { FolderOpen, Save, AlignLeft } from 'lucide-react';

const INITIAL_CONTENT = `# 设计第一性原理与 macOS 手感

用户体验是所有产品的最高准则。**后端可以很复杂，但用户触碰到的每一层必须丝滑。** 在 \`mditor\` 中，我们拒绝一切形式的交互迟滞。

## 核心交互特性

> 系统承担复杂性：能自动化的不手动，能推断的不让用户填，能一步完成的不拆成三步。

- [x] 基于 CodeMirror 6 纯文本架构，坚决不破坏 Markdown 源语法
- [x] 多标签页（Tab）与快捷键导航
- [x] 本地图片直接粘贴自动存入 ./assets/

## 本地图片自动落盘与渲染

![macOS 原生沉浸式无边框窗口布局](./assets/macos-window.png)

### 剪贴板自动落盘管道

按下 <kbd>⌘V</kbd> 粘贴截图时，系统自动在当前文档同级创建 \`./assets/\` 目录并将图片落盘，无需手动保存文件再拖拽。

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

  // 提取大纲
  const outline = useMemo(() => {
    return extractOutline(activeTab.content);
  }, [activeTab.content]);

  // 大纲切换快捷键 (Cmd+Shift+O)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.shiftKey && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        setIsOutlineOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 保存当前 Tab
  const handleSaveActiveTab = useCallback(async () => {
    const res = await saveDocument(activeTab.filePath, activeTab.content, activeTab.fileName);
    if (res.success && res.filePath) {
      const fileName = res.filePath.split('/').pop() || activeTab.fileName;
      updateTabFile(activeTab.id, res.filePath, fileName);
    }
  }, [activeTab, updateTabFile]);

  // 打开本地文件并新建 Tab
  const handleOpenLocalFile = useCallback(async () => {
    const res = await openDocument();
    if (res) {
      createNewTab(res.fileName, res.content, res.filePath);
    }
  }, [createNewTab]);

  // 快捷键监听 (Cmd+S / Cmd+O)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key === 's') {
        e.preventDefault();
        handleSaveActiveTab();
      } else if (isMeta && e.key === 'o') {
        e.preventDefault();
        handleOpenLocalFile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveActiveTab, handleOpenLocalFile]);

  // 点击大纲项
  const handleSelectHeading = useCallback((item: OutlineItem) => {
    setActiveHeadingId(item.id);
  }, []);

  // 弹窗保存并关闭
  const handleConfirmSaveAndClose = useCallback(async () => {
    if (closePendingTab) {
      await saveDocument(closePendingTab.filePath, closePendingTab.content, closePendingTab.fileName);
      confirmDiscardAndClose();
    }
  }, [closePendingTab, confirmDiscardAndClose]);

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
        <div className="flex items-center space-x-1 text-stone-500">
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
        </div>
      </header>

      {/* 中间工作区：左侧大纲抽屉 + 右侧编辑器 */}
      <div className="flex-1 flex overflow-hidden relative">
        <OutlineDrawer
          isOpen={isOutlineOpen}
          outline={outline}
          activeHeadingId={activeHeadingId}
          onSelectHeading={handleSelectHeading}
        />

        <main className="flex-1 overflow-hidden relative">
          <Editor
            key={activeTab.id}
            initialDoc={activeTab.content}
            docFilePath={activeTab.filePath}
            onChange={(newContent) => updateTabContent(activeTab.id, newContent)}
          />
        </main>
      </div>

      {/* 底部状态栏 */}
      <footer className="h-6.5 bg-[#FAF8F5] border-t border-black/5 px-4 flex items-center justify-between text-[11px] text-stone-400 font-mono select-none z-20">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
            Markdown 实时预览
          </span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>{activeTab.content.length} 字符</span>
          <span>{outline.length} 章节</span>
        </div>
      </footer>

      {/* 未保存阻断确认 Modal */}
      <UnsavedConfirmModal
        tab={closePendingTab}
        onCancel={cancelClose}
        onDiscard={confirmDiscardAndClose}
        onSave={handleConfirmSaveAndClose}
      />
    </div>
  );
};

export default App;
