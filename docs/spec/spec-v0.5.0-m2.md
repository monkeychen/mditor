---
doc: spec
product: v0.5.0
milestone: m2
date: 2026-10-28
status: reviewing
---

# 技术规格说明书：v0.5.0 - 里程碑 M2：工作区文件拖拽移动与 Tab 标签自由拖拽排序

**版本**：v0.5.0  
**里程碑**：M2  
**状态**：Reviewing  
**责任模块**：多标签页管理器 (`TabBar.tsx`, `useTabs.ts`)、侧边栏拖拽放置器 (`OutlineDrawer.tsx`)、文件系统移动 IPC 服务 (`src/main/index.ts`, `src/preload/index.ts`)  

---

## 1. 目标与范围

本里程碑聚焦 **F33（侧边栏文件树拖拽移动）** 与 **F34（Tab 标签页自由拖拽排序）**：
1. **侧边栏文件与文件夹原生拖拽移动（Drag & Drop File Move，F33）**：
   - 文件与文件夹项支持 HTML5 原生拖拽，拖拽时产生半透明幽灵卡片；
   - 目标文件夹在鼠标悬停时展示高亮边框与微光背景（`bg-amber-500/10 border-amber-500/40`）；
   - 释放时触发原子化物理移动（主进程 `fs.rename`），支持同名防覆盖拦截与循环嵌套防护（禁止将父目录拖入自身子目录中）；
   - 移动成功后自动刷新工作区树，并级联更新正处于打开状态的 Tab 标签页路径（未保存内容与编辑状态完整保留）。
2. **Tab 标签页自由拖拽排序（Draggable Tab Reordering，F34）**：
   - 顶栏 Tab 项支持水平拖拽重排，拖拽时展现蓝色/黄色插入指示线；
   - 释放时更新全局 tabs 顺序数组，保持当前激活状态不变，无任何内容丢失或闪烁。

---

## 2. 关键技术方案

### 2.1 Tab 标签水平拖拽排序 (`TabBar.tsx` & `useTabs.ts`)

1. **拖拽数据协议**：
   - `onDragStart`: `e.dataTransfer.setData('text/plain', tab.id); e.dataTransfer.effectAllowed = 'move';`
   - 记录 `draggingTabId`，在拖动项上应用 `opacity-50` 半透明样式。
2. **位置判定与指示线**：
   - 每个 Tab 监听 `onDragOver`，通过 `e.currentTarget.getBoundingClientRect()` 判定鼠标处于左半区还是右半区，决定指示线插入在左侧还是右侧。
   - `onDrop`: 计算源索引 `fromIndex` 与目标索引 `toIndex`，调用 `onReorderTabs(fromIndex, toIndex)`。
3. **状态层 Hook 支持 (`useTabs.ts`)**：
   ```ts
   const reorderTabs = useCallback((fromIndex: number, toIndex: number) => {
     setTabs((prev) => {
       if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return prev;
       const next = [...prev];
       const [moved] = next.splice(fromIndex, 1);
       next.splice(toIndex, 0, moved);
       return next;
     });
   }, []);
   ```

### 2.2 侧边栏文件原生拖放与防循环嵌套 (`OutlineDrawer.tsx`)

1. **源数据拖拽**：
   - 每个文件与非根文件夹项设置 `draggable={true}`；
   - `onDragStart`: `e.dataTransfer.setData('application/json', JSON.stringify({ path: node.path, isDirectory: node.isDirectory, name: node.name }))`。
2. **合法放置校验（Drop Validation）**：
   - 只有文件夹节点或根文件夹分组头部可作为 Drop Target；
   - **循环嵌套阻断**：若 `node.isDirectory && (targetDirPath === node.path || targetDirPath.startsWith(node.path + path.sep))`，立即禁止放置并提示；
   - **原地放置阻断**：若目标目录等于源文件当前父目录，静默忽略。
3. **主进程移动 IPC (`file:move`)**：
   - 接口定义：`moveItem(sourcePath: string, targetDirPath: string): Promise<{ success: boolean; newPath?: string; error?: string }>`；
   - 检查目标路径 `newPath = path.join(targetDirPath, path.basename(sourcePath))` 是否已存在同名文件；
   - 执行原子移动 `await fs.rename(sourcePath, newPath)`。
4. **级联 Tab 同步机制 (`App.tsx`)**：
   - 文件移动成功后：遍历 `tabs`，若 `tab.filePath === oldPath`，直接更新为 `newPath`；
   - 文件夹移动成功后：遍历 `tabs`，若 `tab.filePath.startsWith(oldFolderPath + '/')`，前缀替换为 `newFolderPath + '/'`；
   - 保持 tab 的 `isDirty` 与 `content` 绝对不变。

---

## 3. 任务拆解与 TDD 计划（Task Breakdown）

- [ ] **T505：Tab 标签页拖拽排序引擎与状态更新** (`useTabs.ts`, `TabBar.tsx` + 单元测试: `tests/unit/tab-reorder.test.tsx`)
- [ ] **T506：主进程跨目录原子物理移动 IPC 与循环嵌套校验** (`src/main/index.ts`, `src/preload/index.ts`, `fileService.ts` + 单元测试: `tests/unit/file-move-ipc.test.ts`)
- [ ] **T507：侧边栏文件树拖拽放下交互与 Tab 路径级联同步** (`OutlineDrawer.tsx`, `App.tsx` + 单元测试: `tests/unit/sidebar-drag-drop.test.tsx`)
- [ ] **T508：拖拽交互全链路自动化验收** (Playwright E2E: `tests/e2e/v0.5.0-m2-drag-drop.spec.ts`)

---

## 4. 验证与验收标准

1. **单元测试门禁**：
   - `tests/unit/tab-reorder.test.tsx`：验证 `reorderTabs` 数组调换、边界夹紧、相同索引不变；
   - `tests/unit/file-move-ipc.test.ts`：验证原子重命名、同名文件冲突报错拦截、循环嵌套目录报错拦截；
   - `tests/unit/sidebar-drag-drop.test.tsx`：验证 `onDragOver` 样式变更、`onDrop` 触发移动回调、Tab 级联路径更新。
2. **端到端测试门禁**：
   - `tests/e2e/v0.5.0-m2-drag-drop.spec.ts`：
     1. 拖拽 Tab 0 到 Tab 2 之后，验证 TabBar 顺序更新且内容无闪烁；
     2. 侧边栏拖拽文件放入子文件夹，验证物理文件移动且 Tab 路径同步变化；
     3. 尝试将父文件夹拖入其子文件夹，验证操作被安全拦截不发生文件丢失。
