import React from 'react';

export const App: React.FC = () => {
  return (
    <div className="flex flex-col h-screen w-screen bg-[#FAF8F5] select-none text-[#1D1D1F]">
      {/* 顶部标题栏（macOS 交通灯避让区域：留出 76px） */}
      <header className="h-11 border-b border-black/5 flex items-center justify-between px-4 drag-region select-none">
        <div className="w-20 non-drag" />
        <div className="text-xs font-medium text-stone-700 tracking-tight flex items-center space-x-1.5">
          <span>Untitled.md</span>
          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
            已保存
          </span>
        </div>
        <div className="w-20 flex justify-end non-drag" />
      </header>

      {/* 主体工作区 */}
      <main className="flex-1 overflow-hidden relative" id="editor-container">
        <div className="h-full flex items-center justify-center text-stone-400 text-sm font-sans">
          Ready to write with mditor
        </div>
      </main>
    </div>
  );
};

export default App;
