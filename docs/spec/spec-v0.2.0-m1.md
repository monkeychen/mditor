---
doc: spec
product: v0.2.0
milestone: m1
date: 2026-10-26
status: approved
---

# spec-v0.2.0-m1: 新内核接入、零跳动所见即所得与双模式切换系统

## 1. 里程碑目标与覆盖 F/AC

### 1.1 里程碑目标
完成 mditor 编辑器底层内核从「纯 CodeMirror 6 装饰器」到「Milkdown (ProseMirror + remark) 块模型真所见即所得 + CodeMirror 6 纯源码双模式」的彻底重构。实现打字手感对齐 Typora（标题与行内样式打字零跳变）、Markdown 语法即时输入规则（`# `、`- `、`>`、`---`、成对符号自动补全）、`⌘/` 快捷键双模式秒级互切，并建立「打开→保存源文件保真」自动化回归门禁，同时无缝迁移多标签页与本地文件读写系统。

### 1.2 覆盖的 F / AC 清单
- **F8: 所见即所得编辑内核（实时渲染模式，默认）**
  - `AC-8.1`: 打开含 H1–H6、加粗、斜体、删除线、行内代码、链接的文档，默认以排版样式呈现，不显示任何 Markdown 定界符。
  - `AC-8.2`: 光标移入 / 移出 H1–H6 标题时，该行 `font-size` 与 `line-height` 计算值变化为 0（E2E 读取 computed style 断言）。
  - `AC-8.3`: 光标置于 `**粗体**` 内部时 DOM 中出现定界符元素且文字仍为 `font-weight ≥ 600`；光标移出后定界符元素隐藏。
- **F9: Markdown 输入规则与编辑行为**
  - `AC-9.1`: 行首 `# ` 转标题、行首 `- ` 转列表、行首 `> ` 转引用、行首 `---` 转分割线等全部即时生效。
  - `AC-9.2`: 列表项末尾回车生成同级新项；空列表项回车退出列表；`Tab` / `⇧Tab` 增减缩进。
  - `AC-9.3`: 选中文本输入成对括号/引号自动包裹选区。
  - `AC-9.4`: 格式快捷键 `⌘B`, `⌘I`, `⌘1~6`, `⌘0` 正确执行并修改文档。
- **F10: 源码模式与双模式切换**
  - `AC-10.1`: 按 `⌘/` 两种模式互相切换，单次切换耗时 ≤ 200ms。
  - `AC-10.2`: 源码模式与实时渲染模式双向修改正确同步呈现。
  - `AC-10.3`: 切换模式时两端光标选区精准映射同步（偏差 ≤ 1 个块）。
  - `AC-10.4`: 状态栏指示当前模式，点击可直接切换。
- **F14: 源文件保真系统**
  - `AC-14.1`: 建立 ≥ 30 个文件的语料库，未编辑时「打开→保存」逐字节一致率 100%。
  - `AC-14.2`: 局部编辑后保存，未改动块保持原有排版格式不变。
  - `AC-14.3`: 保真自动化测试纳入 `npm run test:all`，作为强制阻断门禁。
- **F17 (部分迁移)**:
  - F1 多标签页（Tab）与 F3 本地文件读写在 Milkdown + CodeMirror 双内核下无缝回归。

---

## 2. 关键功能设计思路

### 2.1 双模式架构与状态机 (Mode State Machine)
在 React 顶层（`App.tsx` 与标签页状态 `useTabs`）中引入编辑模式状态：
```typescript
type EditorMode = 'wysiwyg' | 'source';
```
每个 Tab 维护各自的 Markdown 内容缓存与光标锚点信息：
```
+-------------------------------------------------------------------------+
|                                App.tsx                                  |
|   +-----------------------------------------------------------------+   |
|   |                       TabBar (⌘T, ⌘W, ⌘1..9)                    |   |
|   +-----------------------------------------------------------------+   |
|                                                                         |
|            [快捷键 ⌘/ 或 状态栏按钮切换模式: currentMode]               |
|                                                                         |
|   if (mode === 'wysiwyg')                      if (mode === 'source')   |
|   +---------------------------+                +--------------------+   |
|   |      MilkdownEditor       |                |  CodeMirrorEditor  |   |
|   |   (ProseMirror + remark)  |  双向内容同步  |   (Source Mode)    |   |
|   |  • 块级文档模型 (DOM node)| <============> |  • 纯文本行号      |   |
|   |  • 样式永久维持不跳变     |                |  • 原始 Markdown   |   |
|   |  • 局部定界符内联微露     |                |  • 等宽字体        |   |
|   +---------------------------+                +--------------------+   |
|                                                                         |
|   +-----------------------------------------------------------------+   |
|   | StatusBar: [文档状态] [字数] [ 🎨 实时渲染 (⌘/) / 📝 源代码 ]   |   |
|   +-----------------------------------------------------------------+   |
+-------------------------------------------------------------------------+
```

#### 双向切换与光标映射机制 (Cursor & Content Mapping)
1. **WYSIWYG ➔ Source**：
   - 触发 `⌘/` 时，Milkdown 通过 Transformer 序列化出当前最新 Markdown 文本：`const md = editor.action(getMarkdown())`；
   - 获取当前 ProseMirror selection 的块级行号或字符偏移比例，计算对应的 CodeMirror 6 行列位置；
   - 更新 Tab 内容，切换挂载 CodeMirror 6，设置光标选区并聚焦。
2. **Source ➔ WYSIWYG**：
   - 获取 CodeMirror 6 编辑器的纯文本内容与光标所在行号；
   - 切换挂载 Milkdown 容器，通过 `editor.action(replaceAll(newMd))` 载入文档；
   - 根据源文本行号计算对应的 ProseMirror 节点位置并恢复光标焦点。

### 2.2 零跳动所见即所得与局部定界符显现 (Jitter-Free In-Place Editing)
为解决 v0.1.0 整行退化缩小的致命问题，M1 采用 ProseMirror 装饰插件体系：
1. **标题尺寸恒定**：
   - `h1`~`h6` 节点在 DOM 中永久具有 Typora 规格字号（`H1: 2rem/32px`, `H2: 1.5rem/24px`, `H3: 1.25rem/20px`）和固定行高；
   - 当光标位于标题节点内时，在标题文本前方渲染一个半透明浅灰色的定界符 Widget（如 `# `），使用绝对定位或零宽负边距嵌入，标题正文文字的排版绝对不动；光标移出标题，该 Widget 自动隐藏。
2. **行内格式（加粗/斜体/代码/链接）**：
   - 加粗文字始终渲染为 `font-weight: 600`，斜体文字始终渲染为 `font-style: italic`；
   - 仅当光标选区紧贴或包含加粗定界符时，利用 ProseMirror Decoration 渲染出弱对比度的 `**` 标记，字体本身保持加粗，完全消除字体闪烁与行高跳变。

### 2.3 即时输入与智能列表延续 (InputRules & Keymap)
1. **InputRules 语法响应**：
   - `^#\s` ➔ 转换为 Heading 1；`^##\s` ➔ Heading 2 ... 直至 `######\s`；
   - `^>\s` ➔ 转换为 Blockquote 引用块；
   - `^-\s` / `^\*\s` ➔ 转换为 BulletList；
   - `^1\.\s` ➔ 转换为 OrderedList；
   - `^---\s*$` ➔ 转换为 HorizontalRule 分割线。
2. **智能回车与列表缩进**：
   - 拦截 `Enter` 键：若当前行处于列表项末尾，自动分割创建同级 `listItem`；若当前列表项内容为空，回车则 lift 退出列表回到普通段落；
   - 拦截 `Tab` / `Shift+Tab`：在列表中按 Tab 触发 `sinkListItem`（层级 +1），按 Shift+Tab 触发 `liftListItem`（层级 -1）。
3. **括号成对自动补全与包裹**：
   - 键入 `(`、`[`、`{`、`"`、`'`、`` ` `` 时，若有选区，自动以成对符号包裹选中文本并保持选区；若无选区，自动补全闭合符号并将光标置于中间。

### 2.4 源文件保真系统 (File Fidelity Gate)
1. **remark 序列化器深度配置**：
   - 定制 remark-stringify 规则，保留原始换行风格（LF/CRLF）、无序列表符号风格（保持用户原有的 `*` 或 `-`）、强调定界符（保持 `_` 或 `**`）；
2. **保真自动化回归语料库 (`tests/fidelity/corpus/`)**：
   - 预置 30 个涵盖真实写作场景的 Markdown 文件（含表格、任务列表、复杂嵌套列表、HTML 标签、代码块、YAML Front Matter）；
   - 门禁测试：逐一读取语料文件 ➔ 载入 Milkdown ProseMirror 节点 ➔ 序列化输出 ➔ 逐字节比对（`bufferA.equals(bufferB)`）。

---

## 3. 数据模型与接口定义

### 3.1 状态接口定义
```typescript
// src/renderer/types/editor.ts
export type EditorMode = 'wysiwyg' | 'source';

export interface EditorTabState {
  id: string;
  filePath: string | null;
  fileName: string;
  content: string;
  isDirty: boolean;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  mode: EditorMode;
  cursor: {
    line: number;
    col: number;
  };
}

export interface ModeSwitchEvent {
  fromMode: EditorMode;
  toMode: EditorMode;
  markdown: string;
  cursorLine: number;
}
```

### 3.2 Milkdown 封装组件接口
```typescript
// src/renderer/editor/wysiwyg/MilkdownEditor.tsx
export interface MilkdownEditorProps {
  initialContent: string;
  onChange: (markdown: string) => void;
  onCursorChange?: (line: number, col: number) => void;
  className?: string;
}

export interface MilkdownEditorRef {
  getMarkdown: () => string;
  setMarkdown: (markdown: string) => void;
  focus: () => void;
  getCursorPosition: () => { line: number; col: number };
  setCursorPosition: (line: number, col: number) => void;
}
```

### 3.3 CodeMirror 6 源码模式组件接口
```typescript
// src/renderer/editor/source/SourceEditor.tsx
export interface SourceEditorProps {
  content: string;
  onChange: (content: string) => void;
  onCursorChange?: (line: number, col: number) => void;
  cursorLine?: number;
  className?: string;
}
```

---

## 4. 关键决策记录 (ADR)

| 决策点 | 选定方案 | 为什么这么选 | 对用户的影响 | 放弃了什么 |
|---|---|---|---|---|
| **所见即所得内核架构** | Milkdown (ProseMirror + remark) 插件集成 | 只有 ProseMirror 的块级文档模型才能实现 Typora 级别的所见即所得手感，表格与列表是真实 DOM 块，彻底根绝 CodeMirror 行退化抖动。 | 打字时标题字号稳定，排版绝不跳变；原生输入手感丝滑。 | 放弃了 v0.1.0 纯文本单内核架构，接受维护双模式同步转换的轻微开销。 |
| **源码模式内核** | 保留并精简 CodeMirror 6 | CodeMirror 6 纯文本编辑、语法高亮与快捷键能力一流，用于纯源码模式性能极佳且轻量。 | `⌘/` 切换后获得专业代码编辑器般的清爽纯文本体验。 | 放弃了在单一富文本编辑器中模拟源码模式的方案（模拟源码模式无法做到 100% 字符级精确掌控）。 |
| **双模式共存与切换机制** | 单一文档状态驱动，DOM 条件渲染 + 记忆光标 | 保证数据源单一真实（Single Source of Truth），通过模式切换钩子精准无感同步内容。 | 随时切换不丢内容、不跳光标，体验行云流水。 | 放弃了左右分屏双向联动预览（Typora 哲学是单屏沉浸，拒绝双栏分散注意力）。 |
| **保真性兜底策略** | 30 篇语料库逐字节对比回归测试 | 序列化过程中如果悄悄篡改用户格式（如将 `*` 变 `-`）会引发 Git diff 混乱，必须有自动化测试做门禁。 | 用户的本地文件绝对安全，不会被编辑器无故破坏格式。 | 放弃了默认全量统一格式化的强制序列化规则。 |

---

## 5. 测试策略与用例清单

### 5.1 单元测试清单 (Unit Tests)
- `tests/unit/wysiwyg-heading.test.ts`
  - [UT-1.1]: H1~H6 初始渲染具有正确的 node 类型与 Typography CSS class。
  - [UT-1.2]: 光标处于 heading 节点时，触发定界符装饰器添加；光标离开时移除。
- `tests/unit/wysiwyg-inline.test.ts`
  - [UT-2.1]: 加粗 `**text**`、斜体 `*text*` 正确转换为 Strong / Em 节点。
  - [UT-2.2]: 光标位于行内强调标记内部时，定界符装饰器局部显露且维持加粗字重。
- `tests/unit/input-rules.test.ts`
  - [UT-3.1]: 输入 `# ` 自动转换当前段落为 H1；输入 `## ` 转换为 H2。
  - [UT-3.2]: 输入 `- ` 自动转换为无序列表项；输入 `1. ` 转换为有序列表项。
  - [UT-3.3]: 输入 `> ` 转换为引用块；输入 `---` 转换为分割线。
- `tests/unit/list-behavior.test.ts`
  - [UT-4.1]: 列表项末尾回车自动插入新列表项并保持同级缩进。
  - [UT-4.2]: 空列表项回车自动退出列表恢复为段落。
  - [UT-4.3]: 列表项中按 Tab / Shift+Tab 触发层级嵌套与提升。
- `tests/unit/mode-switch.test.ts`
  - [UT-5.1]: WYSIWYG 序列化出的 Markdown 文本与 SourceEditor 接收的内容完全一致。
  - [UT-5.2]: SourceEditor 中的内容变更通过 replaceAll 正确重载入 Milkdown 实例。
- `tests/unit/auto-pair.test.ts`
  - [UT-6.1]: 选中文本按 `(` 自动在两侧添加 `(` 和 `)`。
  - [UT-6.2]: 无选区输入 `[` 自动补全为 `[]` 并定位在中间。
- `tests/unit/fidelity-corpus.test.ts`
  - [UT-7.1]: 语料库 30 个 Markdown 文件进行「反序列化 ➔ 序列化」输出，比对逐字节一致性达到 100%。

### 5.2 集成与 E2E 测试场景 (Playwright E2E)
- `tests/e2e/v0.2.0-m1-dual-mode.spec.ts`
  - [E2E-1.1]: 打开桌面应用，默认以实时渲染模式呈现，标题字号正确，无 Markdown 字符。
  - [E2E-1.2]: 点击标题输入文字，获取 computed style，验证字号与行高在光标进出前后变化为 0（无跳变）。
  - [E2E-1.3]: 按快捷键 `⌘/`，界面平滑无缝切换为源码模式，显示原始 Markdown 文本与行号，切换耗时 ≤ 200ms。
  - [E2E-1.4]: 在源码模式输入内容，按 `⌘/` 切回实时渲染，内容立即完成排版渲染。
  - [E2E-1.5]: 在列表与引用中键入回车与 Tab，验证自动补全与多级缩进在界面实时呈现。
  - [E2E-1.6]: 回归验证多标签页切换（`⌘T`, `⌘W`, `⌘1..9`）与防抖自动保存功能依然稳定正常。

---

## 6. Task 拆分 (Task Breakdown)

| 编号 | 内容 | 覆盖 AC | 依赖 | 状态 |
|---|---|---|---|---|
| **T201** | 安装与集成 Milkdown 核心包（`@milkdown/core`, `@milkdown/preset-commonmark`, `@milkdown/preset-gfm` 等），封装 `MilkdownEditor.tsx` | AC-8.1, AC-17.1 | 无 | 已完成 |
| **T202** | 实现排版零跳动引擎与局部定界符露出 ProseMirror 插件（标题字号恒定、粗斜体无抖动露出） | AC-8.2, AC-8.3 | T201 | 已完成 |
| **T203** | 配置完善 InputRules 与键盘快捷操作（即时符号触发、回车延续列表、Tab 缩进、符号自动配对包裹） | AC-9.1, AC-9.2, AC-9.3, AC-9.4 | T201 | 待开始 |
| **T204** | 封装纯源码模式组件 `SourceEditor.tsx` 并实现 `⌘/` 快捷键与状态栏双模式切换状态机与光标映射 | AC-10.1, AC-10.2, AC-10.3, AC-10.4 | T201 | 待开始 |
| **T205** | 建立 `tests/fidelity/corpus/` 语料库（30+ 文件）与 remark 序列化微调，实现逐字节保真门禁测试 | AC-14.1, AC-14.2, AC-14.3 | T201 | 待开始 |
| **T206** | 适配 `App.tsx`、`TabBar.tsx` 与文件读写自动保存流程，全量跑通 M1 自动化单元/集成测试与 E2E 回归测试 | 全部 M1 AC 与 F17 部分 | T201~T205 | 待开始 |

---

## 7. 界面与 F/AC 映射说明

### 7.1 原型界面映射
高保真原型文件：`docs/prototype/prototype-v0.2.0-m1.html`

| 界面模块 / 状态 | 对应覆盖 F/AC | 关键交互与视觉规范 |
|---|---|---|
| **实时渲染模式（默认）** | F8 (AC-8.1~8.3) | 苹果原生 SF Pro 字体排版；标题永久维持大号（H1: 32px/1.3, H2: 24px/1.35），无语法符号干扰；光标移入粗体时仅在边缘以 30% 透明度显示 `**`。 |
| **Markdown 键盘即时交互** | F9 (AC-9.1~9.4) | 键入 `# ` 瞬间变标题；在列表末尾按 Enter 自动缩进加下一项圆点；选中文字按 `(` 自动包裹。 |
| **源代码模式（`⌘/`）** | F10 (AC-10.1~10.4) | SF Mono 等宽字体，清爽左侧行号，原始 Markdown 语法高亮（`#`、`*`、`|` 均可见），无任何富文本变形。 |
| **底部沉浸状态栏** | F10 (AC-10.4) | 居右展示交互式切换开关「🎨 实时渲染 (⌘/)」与「📝 源代码 (⌘/)」，悬浮微高亮，点击即时切换。 |

### 7.2 视觉与设计规范
- **主背景色**：`#FAF8F5`（macOS 温暖纸张色）/ 暗色模式 `#1E1E1E`；
- **排版字体**：
  - 正文排版：`-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif`，字号 `16px`，行高 `1.75`；
  - 源码模式：`"SF Mono", Menlo, Consolas, Monaco, monospace`，字号 `14px`，行高 `1.6`；
- **重点色（Accent）**：`#2563EB`（macOS Royal Blue）；
- **过渡动效**：模式切换采用 `150ms ease-out` 渐变淡入，严禁界面白屏或剧烈跳动。
