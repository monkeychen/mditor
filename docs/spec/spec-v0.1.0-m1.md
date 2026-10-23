---
doc: spec
product: v0.1.0
milestone: m1
date: 2026-10-23
status: approved
---

# spec-v0.1.0-m1: 核心骨架、CodeMirror 6 实时渲染与基础文件读写

## 1. 本里程碑目标与覆盖的 F/AC

### 目标
完成应用基础脚手架搭建，构建 macOS 原生级质感的沉浸式窗口；实现基于 CodeMirror 6 的 Hybrid Live Preview（即时所见即所得）渲染核心，实现光标所在行显示 Markdown 原生标记、离开即呈现优雅排版；打通本地文件系统的打开、保存、另存为与防抖自动保存。

### 覆盖功能与验收标准
- **F1 (部分)**：AC1.1（macOS 风格无标题栏沉浸窗口，避让交通灯控件）。
- **F2 (核心)**：AC2.1（标题渲染）、AC2.2（行内强调/代码）、AC2.3（列表/任务项/引用/分割线）、AC2.6（CM6 装饰器架构与高性能）。
- **F3 (全部)**：AC3.1（打开本地文件）、AC3.2（保存与另存为）、AC3.3（自动保存防抖与状态指示）。

---

## 2. 关键功能设计思路

### 2.1 CodeMirror 6 Live Preview 动态装饰器设计
- **核心原理**：不改写文档底层文本内容，通过 `@codemirror/view` 的 `ViewPlugin` 或 `StateField` 监听文档及光标选区（`selection`）变更。
- **语法树解析**：基于 `@lezer/markdown` 高性能增量解析语法树 `syntaxTree(state)`。
- **光标碰撞算法**：
  - 获取当前光标所在的行范围 `cursorLine = state.doc.lineAt(head)`。
  - 遍历当前视口（`viewport`）覆盖的语法节点（HeaderMark、EmphasisMark、CodeMark 等）。
  - 若语法节点落在 `cursorLine` 或光标正处在标记范围内，则**跳过隐藏装饰**，保持原生字符显示；
  - 若光标已移出该行/节点，则施加 `Decoration.mark`（如添加 `.cm-live-h1`、`.cm-live-bold`）或 `Decoration.replace`（隐藏 `#`、`*` 等语法定界符），并为整行挂载样式 class。
- **任务列表交互**：使用 `Decoration.widget` 渲染可交互的 Checkbox，当用户点击时，派发事务（`dispatch`）直接替换底层 `[ ]` 为 `[x]`，保持数据一致性。

### 2.2 Electron 主进程与渲染进程安全 IPC 设计
- **主进程（Main）**：负责原生文件对话框 `dialog.showOpenDialog` / `dialog.showSaveDialog`，以及使用 Node.js `fs/promises` 读写本地磁盘，监听系统级快捷键与菜单事件。
- **桥接层（Preload）**：通过 `contextBridge.exposeInMainWorld('electronAPI', ...)` 暴露严格受限的白名单异步方法，渲染进程无 Node.js 直接权限。
- **渲染进程（Renderer）**：使用 React 驱动外围状态（文档元信息、保存状态、字数统计），CodeMirror 6 封装为受控/非受控高效组件，避免 React 频繁 re-render 干扰打字。

### 2.3 自动保存（Auto Save）防抖机制
- 用户输入时，设置 `isDirty: true`，状态标记为 `unsaved`。
- 启动 1500ms 的防抖计时器（Debounce Timer）。若用户持续打字，则重置计时器。
- 计时器触发且当前存在 `filePath` 时，向主进程发起静默保存，状态切为 `saving`，写入成功后切为 `saved` 并重置 `isDirty: false`。
- 若文档尚未命名（`filePath === null`），则仅保存在内存中，不在未经用户确认前随意在磁盘乱建临时文件。

---

## 3. 数据模型与接口定义

### 3.1 前端核心状态模型
```typescript
export interface DocumentState {
  filePath: string | null;       // 绝对路径，未命名文件为 null
  fileName: string;              // 展示文件名（如 "Untitled.md"）
  content: string;               // 纯文本 Markdown 字符串
  isDirty: boolean;              // 是否存在未保存修改
  saveStatus: 'saved' | 'saving' | 'unsaved'; // 保存状态
  wordCount: number;             // 字符数 / 词数
  cursorLine: number;            // 当前光标行号
  cursorCol: number;             // 当前光标列号
}
```

### 3.2 Preload IPC 契约定义
```typescript
export interface ElectronAPI {
  openFile: () => Promise<{ filePath: string; fileName: string; content: string } | null>;
  saveFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  saveFileAs: (defaultName: string, content: string) => Promise<{ filePath: string; fileName: string } | null>;
  onMenuTrigger: (callback: (action: 'new' | 'open' | 'save' | 'saveAs') => void) => () => void;
}
```

---

## 4. 关键决策记录

| 决策点 | 选定方案 | 为什么这么选 | 对用户的影响 | 放弃了什么 |
|---|---|---|---|---|
| **Live Preview 触发粒度** | **行级（Line-level）光标激活** | 标题、引用、列表等排版元素以“行”为思维单位，光标落在该行时完全展示原始语法，离开整行即平滑排版，最符合直觉（类似 Typora）。 | 避免在单词中间跳动造成文字抖动，编辑体验安定专注。 | 放弃了逐字符极其微小的微距展开（容易导致文字横向抖动）。 |
| **主进程与渲染进程通信** | **ContextIsolation + contextBridge** | Electron 官方最高安全标准，彻底杜绝 XSS 导致本地系统命令注入。 | 用户打开不受信任的第三方 Markdown 文档也不会危害本地操作系统。 | 放弃了便捷但危险的 `nodeIntegration: true`。 |
| **样式与主题方案** | **Tailwind CSS + CSS Variables** | 原子化响应速度快，且易于通过 CSS 变量精准适配 macOS 暗黑/高对比度色彩。 | 界面与 macOS 原生窗口无缝融合，视觉层次轻盈内敛。 | 放弃了臃肿的第三方 UI 组件库（如 MUI/AntD），保持体积轻量。 |

---

## 5. 测试策略

### 5.1 单元测试（Vitest）
- `tests/unit/live-preview.test.ts`：
  - 测试标题语法识别：解析 `# Heading`，验证光标在行内时不附加隐藏标记，光标在其他行时附加隐藏与样式标记。
  - 测试粗体/斜体语法识别：验证定界符在光标离开时被标记为不可见。
  - 测试任务列表状态切换：验证派发勾选动作后底层文本从 `- [ ]` 正确变更为 `- [x]`。
- `tests/unit/document-store.test.ts`：
  - 测试文档编辑 `isDirty` 状态转换。
  - 测试自动保存防抖计时器被正确重置与触发。
- `tests/unit/ipc-contract.test.ts`：
  - 测试 Preload 层暴露出且仅暴露出白名单安全 API。

### 5.2 集成测试（IPC & File Service）
- `tests/integration/file-service.test.ts`：
  - 模拟主进程文件读写与原生对话框，验证文件保存成功落盘、读取文件内容一致性及异常处理（如只读文件、路径不存在）。

### 5.3 端到端自动化测试（Playwright / Spectron）
- `tests/e2e/editor-flow.spec.ts`：
  - 启动 Electron 桌面应用窗口。
  - 在编辑区打字输入 `# Hello Markdown` 并换行，断言首行元素应用了 `.cm-live-h1` 渲染类名。
  - 验证按 `Cmd+S` 唤起保存逻辑，状态栏正确显示已保存指示。

---

## 6. Task 拆分

| Task 编号 | 内容与交付物 | 覆盖 AC | 依赖 | 状态 |
|---|---|---|---|---|
| **T1** | 初始化工程骨架：配置 Electron + Vite + React + Tailwind + TypeScript，搭建 Vitest 与 Playwright 测试基线 | AC1.1 | - | 已完成 (npm test & build & lint 全通) |
| **T2** | 实现 Electron 主进程窗口配置（hiddenInset、交通灯避让）与安全 Preload IPC 本地文件读写服务（含单测） | AC1.1, AC3.1, AC3.2 | T1 | 已完成 (单测+集成测试通过) |
| **T3** | 集成 CodeMirror 6 编辑器组件，定制 macOS SF Pro 极简主题、行间距与状态栏（字数/光标位置） | AC1.1, AC2.6 | T1 | 已完成 (编辑器组件与字数统计单测通过) |
| **T4** | 开发 CodeMirror 6 Live Preview 实时渲染插件（标题、加粗/斜体、引用、分割线、任务列表点击勾选）并完成单测覆盖 | AC2.1, AC2.2, AC2.3, AC2.6 | T3 | 已完成 (Live Preview 语法树遍历与光标行显隐单测全通) |
| **T5** | 实现文档防抖自动保存系统与顶部/底部保存状态指示器、绑定快捷键（Cmd+S / Cmd+O / Cmd+N） | AC3.3 | T2, T3 | 待开始 |
| **T6** | 编写并执行自动化集成与 e2e 测试（Playwright 驱动 Electron 真机环境运行），输出验收记录 | 全部 M1 AC | T1-T5 | 待开始 |

---

## 7. 界面与 F/AC 映射及视觉规范

### 7.1 原型与 F/AC 映射
- **顶部无标题栏区域（Traffic Lights + Header）**：覆盖 `AC1.1`，高度 40px，左侧留出 76px 留白避让 macOS 交通灯，居中显示当前文档标题与保存状态，右侧放置大纲切换与常用快捷入口。
- **编辑区域（CodeMirror 6 Live Preview Container）**：覆盖 `AC2.1, AC2.2, AC2.3, AC2.6`，居中限宽（最大 860px），行高 1.7，外间距自然，光标所在行显示原生语法，离开即渲染。
- **底部状态栏（Footer Status Bar）**：覆盖 `AC3.3`，高度 24px，微小字号展示字数、光标行列号、UTF-8 编码及当前自动保存状态。

### 7.2 视觉规范
- **色彩体系**：
  - 浅色背景：`#FAF8F5`（类 Bear / 优质书籍米白纸张感）或纯净 `#FFFFFF`。
  - 文字主色：`#1D1D1F`（macOS 经典高信噪比暗灰）。
  - 辅色/次级文本：`#86868B`。
  - 主题强调色：`#D97706`（Warm Amber，温暖纸质感）或 `#0A84FF`（macOS 原生蓝）。
  - 分割线与边框：`rgba(0, 0, 0, 0.06)`。
- **字体族**：
  - 正文排版：`-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Helvetica Neue", sans-serif`。
  - 等宽代码：`"SF Mono", Menlo, Monaco, Consolas, monospace`。
