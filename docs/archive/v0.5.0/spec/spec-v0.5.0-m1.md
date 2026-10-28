---
doc: spec
product: v0.5.0
milestone: m1
date: 2026-10-28
status: approved
---

# 技术规格说明书：v0.5.0 - 里程碑 M1：侧边栏拖拽调宽与全局闪电搜索

**版本**：v0.5.0  
**里程碑**：M1  
**状态**：Approved  
**责任模块**：侧边栏尺寸调节器 (`OutlineDrawer.tsx`)、快速打开浮层 (`QuickOpenModal.tsx`)、工作区全文检索器 (`workspaceSearch.ts` / `src/main/searchService.ts`)  

---

## 1. 目标与范围

本里程碑聚焦 **F30（侧边栏拖拉调宽）**、**F31（全局快速文件打开 `⌘P`）** 与 **F32（全工作区全文检索 `⌘⇧F`）**：
1. **侧边栏边缘拖拽调宽（Resizable Sidebar，F30）**：
   - 侧边栏右边缘增加 4px 交互手柄，提供 `col-resize` 光标与悬停指示；
   - 宽度自适应调整，限制最小 `180px`、最大 `520px`，双击手柄复位至 `240px`；
   - 本地自动持久化（`localStorage` 键名 `mditor_sidebar_width`），重启零闪烁。
2. **全局快速文件打开（Quick Open，`⌘P`，F31）**：
   - 支持全局快捷键 `⌘P` (macOS) / `Ctrl+P` (Win/Linux) 呼出 Spotlight 风格居中搜索浮层；
   - 快速索引全部工作区文件夹内的文件，支持模糊评分与多级路径过滤，全键盘上下切换与回车秒开。
3. **全工作区全文检索（Workspace Full-Text Search，`⌘⇧F`，F32）**：
   - 快捷键 `⌘⇧F` 呼出或切换至侧边栏「搜索」视图（Tab 栏扩展为：文件夹 / 大纲 / 搜索）；
   - 主进程流式扫描工作区所有文本与代码文件（忽略 `.git`、`node_modules` 等）；
   - 展示按文件分组的命中行号、上下文代码片段与高亮命中词；
   - 点击结果项自动打开文档，平滑滚动至对应行，并触发 1.5 秒微光黄色高亮脉冲（Flash Highlight）。

---

## 2. 详细技术方案

### 2.1 侧边栏调宽实现机制

- 在 `OutlineDrawer` 右侧边缘放置绝对定位的 `div.drawer-resize-handle`：
  - 宽度 4px，鼠标悬停时显示 `bg-amber-500/30` 高亮条；
  - 监听 `onPointerDown` 事件，在 `window` 上绑定 `pointermove` 与 `pointerup`；
  - 动态计算新宽度：`newWidth = Math.max(180, Math.min(520, e.clientX))`；
  - 双击手柄触发 `onDoubleClick`，将宽度重设为默认 `240px`；
  - 拖拽结束时调用 `localStorage.setItem('mditor_sidebar_width', String(newWidth))`。

### 2.2 快速打开与模糊评分算法 (`fuzzySearch.ts`)

```ts
export interface FuzzyMatchResult<T> {
  item: T;
  score: number;
  matches: number[]; // 命中字符在文本中的索引
}

export function fuzzyMatch(pattern: string, text: string): FuzzyMatchResult<string> | null {
  // 1. 若 pattern 为空，返回基础分值
  // 2. 连续匹配、前缀匹配与首字母匹配给予更高权重加分
  // 3. 返回命中索引以供前端高亮显示
}
```

- 扁平化提取当前已挂载所有工作区文件夹的文件列表（含文件名、绝对路径、相对路径、语言图标类型）；
- 输入为空时默认展示最近访问的文件（从打开过的 Tabs 提取）；
- 支持全键盘无鼠标操控：`ArrowDown` / `ArrowUp` 切换选中项，`Enter` 激活，`Escape` 关闭。

### 2.3 全工作区全文检索 IPC 与行高亮定位机制

1. **主进程检索 IPC (`workspace:search`)**：
   - 接收参数：`{ rootDirs: string[], query: string, caseSensitive: boolean, wholeWord: boolean }`；
   - 使用 Node.js `fs.promises` 并行扫描文件（排除 `.git`, `node_modules`, `dist`, `build` 等目录）；
   - 对大于 5MB 的大文件跳过，防止主线程卡顿；
   - 结果分片返回：每个文件的命中行列表 `{ line: number, text: string, matchStart: number, matchEnd: number }`。
2. **编辑器定位与微光脉冲**：
   - 点击搜索结果后，通过 `handleSelectSidebarFile(item.filePath)` 确保 Tab 打开；
   - 调用编辑器的 `scrollToLine(lineNumber)` 滚动至视口中央；
   - 在目标行临时挂载 CSS 类 `.search-target-highlight`，带渐隐动画（1.5 秒淡出），让用户视线瞬间锁定目标代码/段落。

---

## 3. 任务拆解与 TDD 计划（Task Breakdown）

- [x] **T501：侧边栏边缘拖拽调宽与本地持久化** (`OutlineDrawer.tsx` + 单元测试)
- [x] **T502：模糊匹配评分引擎与全文件索引器** (`fuzzySearch.ts` + 单元测试)
- [x] **T503：全局快速文件打开组件与键盘流转** (`QuickOpenModal.tsx`, `App.tsx` + 单元测试)
- [x] **T504：全工作区全文内容检索 IPC、侧边栏搜索视图与高亮定位联动** (`src/main/searchService.ts`, `src/preload/index.ts`, `OutlineDrawer.tsx`, `App.tsx` + Playwright E2E: `v0.5.0-m1-search.spec.ts`)

---

## 4. 验证与验收标准

1. **单元测试门禁**：
   - `tests/unit/sidebar-resize.test.tsx`：验证拖拽最小/最大边界夹紧、双击复位、localStorage 读写；
   - `tests/unit/fuzzy-search.test.ts`：验证模糊匹配评分、连续命中加分、路径匹配与字符高亮区间；
   - `tests/unit/quick-open.test.tsx`：验证浮层呼出、键盘上下切换、回车激活 Tab、Esc 关闭；
2. **端到端测试门禁**：
   - `tests/e2e/v0.5.0-m1-search.spec.ts`：
     1. 按 `⌘P` 弹出快速打开浮层，输入文件名回车打开指定文档；
     2. 按 `⌘⇧F` 展开侧边栏并进入搜索视图，搜索关键词并点击搜索项；
     3. 验证画布正确打开目标文件并平滑滚动高亮命中行；
     4. 拖拽侧边栏把手使宽度变宽，刷新窗口验证宽度持久化。
