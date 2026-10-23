import React from 'react';
import { useDocument } from './hooks/useDocument';
import Editor from './editor/Editor';
import { FileText, FolderOpen, Plus, Save } from 'lucide-react';

export const App: React.FC = () => {
  const { document: doc, updateContent, updateCursor, save, open, newDoc } = useDocument({
    fileName: 'Untitled.md',
    content: `# 设计第一性原理与 macOS 手感

用户体验是所有产品的最高准则。**后端可以很复杂，但用户触碰到的每一层必须丝滑。** 在 \`mditor\` 中，我们拒绝一切形式的交互迟滞。

## 核心交互特性

> 系统承担复杂性：能自动化的不手动，能推断的不让用户填，能一步完成的不拆成三步。

- [x] 基于 CodeMirror 6 纯文本架构，坚决不破坏 Markdown 源语法
- [x] 光标所在行展开原生 Markdown，离开无缝排版
- [ ] 本地文件自动防抖存盘与原生安全沙箱

---

按快捷键 <kbd>⌘S</kbd> 即可即时存盘，无需担心文档意外丢失。`,
  });

  return (
    <div className="flex flex-col h-screen w-screen bg-[#FAF8F5] select-none text-[#1D1D1F]">
      {/* 顶部标题栏 (macOS traffic lights 避让区) */}
      <header className="h-11 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-black/5 flex items-center justify-between px-4 z-20 select-none">
        {/* 左侧：避让 macOS 交通灯 */}
        <div className="w-28 flex items-center" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />

        {/* 中间：文件名与保存状态指示 */}
        <div className="flex items-center space-x-2 text-sm text-[#1D1D1F] font-medium tracking-tight">
          <FileText className="w-4 h-4 text-stone-400" />
          <span className="max-w-[240px] truncate" title={doc.filePath || doc.fileName}>
            {doc.fileName}
          </span>
          {doc.saveStatus === 'saved' && (
            <span className="flex items-center text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 font-normal">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
              已自动保存
            </span>
          )}
          {doc.saveStatus === 'unsaved' && (
            <span className="flex items-center text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60 font-normal">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
              未保存
            </span>
          )}
          {doc.saveStatus === 'saving' && (
            <span className="flex items-center text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60 font-normal">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 animate-ping" />
              保存中...
            </span>
          )}
        </div>

        {/* 右侧：常用操作按钮 */}
        <div className="w-28 flex justify-end items-center space-x-1 text-stone-500">
          <button
            onClick={newDoc}
            title="新建文档 (Cmd+N)"
            className="p-1.5 hover:bg-black/5 rounded-md text-stone-600 hover:text-stone-900 transition"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={open}
            title="打开文档 (Cmd+O)"
            className="p-1.5 hover:bg-black/5 rounded-md text-stone-600 hover:text-stone-900 transition"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
          <button
            onClick={save}
            title="保存 (Cmd+S)"
            className="p-1.5 hover:bg-black/5 rounded-md text-stone-600 hover:text-stone-900 transition"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 主体：CodeMirror 6 实时预览写作区 */}
      <main className="flex-1 overflow-hidden relative">
        <Editor
          initialDoc={doc.content}
          onChange={updateContent}
          onCursorChange={updateCursor}
        />
      </main>

      {/* 底部状态栏 */}
      <footer className="h-6.5 bg-[#FAF8F5] border-t border-black/5 px-4 flex items-center justify-between text-[11px] text-stone-400 font-mono select-none">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
            Markdown 实时预览
          </span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>{doc.wordCount} 字符</span>
          <span>Ln {doc.cursorLine}, Col {doc.cursorCol}</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
