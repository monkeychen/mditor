---
doc: spec
product: v0.3.1
milestone: m1
date: 2026-10-27
status: approved
---

# spec-v0.3.1-m1: Windows 安装升级体验优化、CI 发布加固与 KaTeX 原型级公式编辑器

## 1. 里程碑目标与覆盖 F/AC

本里程碑聚焦发布可靠性、安装升级交互透明化与 KaTeX 公式编辑能力的原型级完全对齐：
- 覆盖需求：**F23 (AC-23.1, AC-23.2)**, **F24 (AC-24.1, AC-24.2)**, **F25 (AC-25.1, AC-25.2, AC-25.3)**。

---

## 2. 关键功能设计思路

### 2.1 KaTeX 独立公式块双态交互系统 (`MathBlockView.ts`)
1. **折叠展示态**：
   - 上部：居中大字号矢量排版区；
   - 底部：细边框分割的 `TeX 源码: ...` 与 `点击展开交互编辑面板 ▾`。
2. **展开编辑态（完全对齐原型截图）**：
   - 顶部 Header：`📐 独立公式块编辑器` + `DisplayMode` 蓝色标签，右侧 `复制代码` + `收起 ✕`；
   - 编辑器 Textarea：带有圆角与聚焦微光的 Monospace 多行代码框；
   - 正下方独立预览卡片：`math-block-drawer-preview` 伴随打字即时重新矢量排版；
   - 底部右侧 `完成` 动作按钮。
3. **ProseMirror 事件与变动隔离**：
   - 实现了 `stopEvent(event: Event)` 与 `ignoreMutation()`，在编辑态完全捕获鼠标与键盘事件（特别是 Backspace 与 Enter），彻底根除按键误删公式节点的严重缺陷。

### 2.2 KaTeX 行内公式浮窗交互卡片 (`InlineMathView.ts`)
1. **行内高亮态**：点击公式即高亮 `math-inline-editing`；
2. **悬浮卡片**：
   - 头部：`✏️ 正在编辑行内 LaTeX 公式`，附带 `Enter 确认 / Esc 取消` 快捷键指引；
   - 输入框行：`$` 标识符包裹输入框，右侧提供 `应用` 与 `取消` 按钮；
   - 实时预览行：正下方微型卡片联动渲染当前输入的 LaTeX 表达式。
3. **输入规则**：
   - 增加 `$inputRule`：行内键入 `$formula$` 闭合瞬间即时转为行内公式节点。

### 2.3 Windows NSIS 安装前旧版本检测宏 (`resources/installer.nsh`)
1. 在 `customInit` 阶段检索注册表，发现旧版本时弹出友好对话框明确告知升级与清理策略；
2. 锁定 `deleteAppDataOnUninstall: false` 保障用户配置。

### 2.4 CI/CD 三阶段发布流与硬门禁 (`.github/workflows/release.yml`)
1. `prepare-release` 单节点预建唯一 Draft Release 锚点；
2. `finalize-release` 校验必须同时存在 `.dmg`、`.exe`、`.AppImage`。

### 2.5 顶栏分层解耦与可折叠编辑工具栏 (`App.tsx` & `TabBar.tsx`)
1. **第一层 Window & TabBar（高度 40px）**：
   - 左侧保留交通灯（72px）并紧邻集成 `PanelLeft` 侧边栏开关（`data-testid="sidebar-toggle-btn"`）；
   - 中间 `TabBar` 享有自适应全宽横向展开空间；
   - 右侧仅保留「工具栏开关（`data-testid="toolbar-toggle-btn"`，快捷键 `⌘⇧T`）」与「双模式切换开关（`data-testid="mode-toggle-btn"`，快捷键 `⌘/`）」。
2. **第二层 Document Toolbar（高度 36px）**：
   - 物理分层放置在 TabBar 正下方、编辑器内容区正上方；
   - 细分逻辑分组：
     - **插入排版**：表格（`⌥⌘T`）、独立公式块（`⌥⌘M`）、行内公式（`$`）；
     - **样式与检索**：主题选择器、查找与替换（`⌘F`）；
     - **文档流**：打开（`⌘O`）、保存（`⌘S`）、导出（HTML / PDF / 微信富文本）；
     - **右侧**：一键折叠按钮（`ChevronUp` 图标）。
3. **沉浸式平滑折叠**：
   - 通过 CSS `max-height` 与 `opacity` 过渡动画实现 0 顿挫折叠/展开；
   - 键盘监听 `⌘⇧T` 全局切换工具栏显隐；`⌘⇧O` 全局切换左侧双视图侧边栏显隐。

---

## 3. Task 拆分与执行状态

| Task 编号 | 内容 | 覆盖 AC | 状态 | 验证证据 |
|---|---|---|---|---|
| **T231** | 编写 `resources/installer.nsh` 并配置 `electron-builder.json` | AC-23.1, AC-23.2 | Done | 宏语法完备，`deleteAppDataOnUninstall: false` 已启用 |
| **T241** | 重构 `.github/workflows/release.yml` 引入锚点与硬门禁 | AC-24.1, AC-24.2 | Done | 3-stage 拓扑结构构建，全平台校验逻辑就位 |
| **T251** | 重构 `MathBlockView` 还原折叠展示与展开双态独立预览卡片 | AC-25.1, AC-25.3 | Done | 截图结构 100% 还原，`stopEvent` 彻底杜绝回车/退格删除 |
| **T252** | 重构 `InlineMathView` 还原悬浮卡片、输入规则与实时预览 | AC-25.2, AC-25.3 | Done | 浮窗弹层与 `$formula$` 即时规则通过 E2E 回归验证 |
| **T253** | 全量构建、单测与 E2E 真机回归 | AC-21.1–AC-25.3 | Done | 144 个 Vitest 测试 + 13 个 Playwright E2E 测试全部 PASS |
| **T261** | 编写顶栏分层解耦与工具栏折叠单元测试用例 | AC-26.1, AC-26.2, AC-26.3 | Done | 红态驱动：断言第一层仅含窗口开关，第二层含编辑工具并支持折叠 (`tests/unit/dual-tier-toolbar.test.tsx`) |
| **T262** | 重构 `App.tsx` 实现双层解耦、分组排版工具栏与 `⌘⇧T` 折叠动画 | AC-26.1–AC-26.4 | Done | 绿态达成：全宽 TabBar、左侧 PanelLeft 开关与第二层工具条独立渲染 |
| **T263** | Playwright E2E 端到端回归与全量构建验收 | AC-26.1–AC-26.4 | Done | 跑通全部 14 个 E2E 场景（含工具栏折叠、快捷键与双视图侧边栏联动） |

---

## 4. 验收记录

- **单元与保真度回归测试**：
  - 命令：`npm run test`
  - 结果：49 个测试套件，147 个测试全部 PASS（通过率 100%）。
- **真机端到端回归测试 (E2E)**：
  - 命令：`npx playwright test`
  - 结果：14 个测试套件，14 个场景全部 PASS（涵盖公式输入、行内弹窗、公式块抽屉、顶栏双层解耦、工具栏一键折叠与双视图侧边栏）。
- **打包构建验证**：
  - 命令：`npm run build`
  - 结果：TypeScript 0 报错，渲染进程与主进程编译成功。
