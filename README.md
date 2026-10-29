# mditor

<div align="center">

![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-black?style=flat-square&logo=apple)
![Version](https://img.shields.io/badge/Version-v0.5.1-amber?style=flat-square)
![Electron](https://img.shields.io/badge/Electron-35.0-47848F?style=flat-square&logo=electron)
![Engine](https://img.shields.io/badge/Engine-Milkdown%20(ProseMirror)%20%2B%20CodeMirror%206-D97706?style=flat-square)
![TypeScript](https://img.shields.io/badge/Language-TypeScript%205-3178C6?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-emerald?style=flat-square)
![Tests](https://img.shields.io/badge/Tests-263%20passed%20(100%25)-brightgreen?style=flat-square)

<p align="center">
  <b>兼具 macOS 极致优雅视觉与丝滑交互体验的跨平台 Markdown 编辑器，交互体验全面对标 Typora。</b><br/>
  本地优先（Local-first）• 真所见即所得（WYSIWYG）+ 源码双模式 • 原生级打字手感 • 严格逐字节源文件保真
</p>

[✨ 核心特性](#-核心特性) • [⌨️ 快捷键速查](#️-快捷键速查) • [🚀 快速开始](#-快速开始) • [🛠️ 架构设计](#️-架构与设计哲学) • [🤝 参与贡献](#-参与贡献)

---

</div>

## 📖 关于 mditor

市面上大部分跨平台 Markdown 工具往往面临两难抉择：
- **左右双屏分屏**：注意力在源码与预览窗口间频繁割裂，破坏沉浸式写作心流；
- **纯 DOM 富文本内核**：在文档保存时极易任意重写、篡改原 Markdown 的语法符号与缩进，并且打字时整行排版反复跳变、中文输入法（IME）频现迟滞。

**mditor** 遵从**第一性原理**从零设计：
1. **双引擎协同架构**：所见即所得模式采用 **Milkdown（ProseMirror + remark）** 块级文档模型，打字排版丝毫不跳变；源码模式采用 **CodeMirror 6**，按 `⌘/` 随时一键切换，整篇纯文本了然于胸。
2. **源文件保真底线**：严苛定制 remark 序列化管线，以「打开→保存逐字节不变」的 42 组保真回归测试为门禁，绝不破坏用户原本的代码符号与个人排版习惯。
3. **macOS 工业级美学**：无边框沉浸式视窗、交通灯内嵌避让、微透毛玻璃工具栏与 SF Pro 字体排版系统，打磨到像素级手感。
4. **创作与发布全闭环**：多标签页拖拽管理、本地图片自动落盘、KaTeX 公式与 Mermaid 图表实时渲染、出版级 PDF/Word 导出，以及独家**一键生成微信公众号与知乎无损内联富文本**。

---

## ✨ 核心特性

### 1. 沉浸式双模式编辑（Dual-Mode Editing）
- **真·所见即所得（WYSIWYG，默认）**：基于 ProseMirror 块节点文档模型，段落、表格、引用天然原地可编辑，光标移动排版尺寸恒定，彻底告别打字跳变与整行退化。
- **极速源码模式（Source Mode）**：按快捷键 `⌘/`（或 `Ctrl+/`）瞬间切换至 CodeMirror 6 全文纯文本源码视图，精准微调源字符与 Frontmatter。
- **专注与打字机模式**：支持聚焦当前段落的专注模式（Focus Mode）与视口始终居中的打字机模式（Typewriter Mode）。
- **底栏实时状态**：即时统计中文字数、英文词数、行数、字元数与预估阅读时间。

### 2. 高级扩展语法、数学公式与图表引擎
- **KaTeX 交互式数学公式**：
  - 完整支持行内公式 `$E=mc^2$` 与独立公式块 `$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$`；
  - 配备专用交互式数学公式编辑气泡，实时双向预览与公式校验。
- **Mermaid 矢量图表实时渲染**：
  - 在正文中实时渲染 Flowchart 流程图、Sequence 时序图、Class 类图、State 状态图、Gantt 甘特图、GitGraph 分支图等；
  - 导出 PDF 与 HTML 时自动内联高保真矢量图形，跨平台渲染永不失真。
- **原生可视化表格**：
  - 真正可在排版视图中直接编辑的表格控件，支持行列快捷增删、表头与列文本对齐（居左/居中/居右），`Tab` / `Shift+Tab` / `Enter` 快捷单元格穿梭。
- **Typora 风格丰富排版标记**：
  - 高亮着重（`==highlight==`）、上标（`^superscript^`）、下标（`~subscript~`）、下划线（`<u>underline</u>`）、删除线（`~~strike~~`）与任务复选清单（`- [x]`）。
- **多语言代码块高亮**：
  - 内置 Prism/Refractor 代码引擎，自动高亮 TypeScript、JavaScript、Python、Rust、Go、Java、C/C++、JSON、YAML、CSS、SQL、HTML 等主流语言，右上角配备一键复制代码动效。
- **图片灯箱大图（Lightbox Zoom）**：
  - 点击画布中的任何图片，平滑呼出高保真全屏灯箱，支持鼠标滚轮多级缩放、拖拽平移与双击复位。
- **截图自动落盘（Local Image Pipeline）**：
  - 剪贴板截图直接 `⌘V` 粘贴，系统自动在文档同级创建 `./assets/` 目录写盘，并自动插入相对路径。

### 3. 闪电级工作区、全局检索与多标签页体系
- **全局快速打开（Quick Open，`⌘P` / `Ctrl+P`）**：
  - 毫秒级模糊扫描工作区内成千上万个 Markdown 与代码文件，键盘上下键平滑直达。
- **全工作区全文闪电检索（Full-Text Search，`⌘⇧F` / `Ctrl+Shift+F`）**：
  - 跨文件极速检索正文内容，支持大小写敏感、全字匹配与正则表达式，检索结果分组呈现并直达匹配行。
- **工作区文件树与自由拖拽移动**：
  - 支持多工作区文件夹挂载、右键上下文管理（新建文件/文件夹、重命名、移入回收站、在系统访达/资源管理器中显式定位）；
  - 支持拖拽文件或文件夹跨目录移动，自动处理同名冲突与路径安全校验。
- **可拖拉侧边栏（Resizable Sidebar）**：
  - 侧边栏宽度支持鼠标自由拖拽缩放（180px ~ 480px），双击把手智能复位至 240px，宽度设置本地持久化记忆。
- **多标签页管理与左右拖拽排序（Draggable Tabs）**：
  - 支持多文档多标签从容展开，标签页支持左右拖拽自由重排次序；
  - **TabBar 悬停智能感知（F39）**：鼠标悬停在 Tab 上时，已保存文档即时浮现完整绝对物理路径；未保存草稿智能提取正文第 1 行标题（自动跳过空行并剥离 Markdown 标题符）。
- **文档大纲导航（Outline / TOC）**：
  - 快捷键 `⌘⇧O` 展开目录抽屉，自动提取 H1~H6 层次目录，点击平滑滚动并聚焦。

### 4. 出版级多格式导出与公众号排版
- **出版级矢量 PDF 导出**：
  - 深度优化 Chromium 打印分页管线，自动识别标题与代码块智能避免跨页尴尬截断（Page Break Avoidance）；
  - 自动渲染精美页眉与“第 X 页 / 共 Y 页”标准出版级页脚。
- **原生 Word 文档导出（`.docx`）**：
  - 真正导出为原生 Microsoft Word `.docx` 格式，标题层级、表格、引用块、列表与行内样式严谨映射。
- **微信公众号 / 知乎一键排版**：
  - 纯前端 DOM 深度解析，将排版样式直接编译为**内联样式（Inline CSS）**写进系统剪贴板（`text/html`）；
  - 直接在微信公众号或知乎后台编辑器按 `⌘V` 粘贴，字体、行距、代码块与表格完美还原，无损呈现。
- **独立自包含 HTML 导出**：
  - CSS 样式与矢量资源内嵌打包，离线单文件脱离网络自成一体。

### 5. macOS 原生审美与个性化系统
- **5 套经典排版主题**：
  - 🍂 **Default**（暖白纸张质感，`#FAF8F5` 底色）；
  - 💻 **GitHub**（现代科技经典高可读排版）；
  - 📜 **Sepia**（羊皮纸温润复古阅读色调）；
  - 🌌 **Night**（深邃暗黑夜间降疲劳视觉）；
  - ❄️ **Nord**（北欧极光冷调沉静色彩）。
- **macOS 原生偏好设置面板（`⌘,`）**：
  - 独立关于卡片（About Card），呈现版本号、项目主页与作者联络通道；
  - 主进程建立外链协议白名单检查，拦截非白名单调用。
- **系统原生 Help 菜单与语法指南库**：
  - 内置 Markdown、Mermaid 与 LaTeX 数学公式三大常用语法速查库（Guide Modal），支持一键复制代码片段或插入正文光标处。

---

## ⌨️ 快捷键速查

| 快捷键 (macOS) | 快捷键 (Windows/Linux) | 功能说明 |
|---|---|---|
| `⌘ /` | `Ctrl + /` | **一键切换所见即所得 (WYSIWYG) / 源码模式 (Source Mode)** |
| `⌘ P` | `Ctrl + P` | **全局快速打开文件 (Quick Open，模糊文件直达)** |
| `⌘ ⇧ F` | `Ctrl + Shift + F` | **全工作区全文闪电检索 (Full-Text Search)** |
| `⌘ ,` | `Ctrl + ,` | **打开偏好设置面板 (Preferences)** |
| `⌘ S` | `Ctrl + S` | 保存当前文档（若为新建草稿则调起另存为） |
| `⌘ ⇧ S` | `Ctrl + Shift + S` | 文档另存为... |
| `⌘ O` | `Ctrl + O` | 打开本地文档 / 文件夹并在工作区载入 |
| `⌘ T` | `Ctrl + T` | 新建空白草稿标签页 |
| `⌘ W` | `Ctrl + W` | 关闭当前标签页（若有未保存修改弹出保存确认阻断） |
| `⌘ 1` ~ `⌘ 9` | `Ctrl + 1` ~ `9` | 快速直达第 1 至 9 个标签页 |
| `⌘ ⇧ [` / `⌘ ⇧ ]` | `Ctrl + Shift + [` / `]` | 标签页向前 / 向后轮换切换 |
| `⌘ ⇧ O` | `Ctrl + Shift + O` | 展开 / 折叠文档目录大纲抽屉 |
| `⌘ F` | `Ctrl + F` | 呼出当前文档页内查找面板 |
| `⌘ H` | `Ctrl + H` | 呼出当前文档页内替换面板 |
| `⌘ B` / `⌘ I` / `⌘ U` | `Ctrl + B` / `I` / `U` | 加粗 / 斜体 / 下划线快捷格式化 |
| `⌘ K` | `Ctrl + K` | 插入超链接 |
| `⌘ V` | `Ctrl + V` | 粘贴剪贴板文本；若是图片则自动落盘到 `./assets/` |
| `Esc` | `Esc` | 退出全屏灯箱、关闭查找栏、关闭使用指南或偏好设置弹窗 |

---

## 🚀 快速开始

### 运行环境要求
- **Node.js** >= 20.0.0
- **npm** >= 10.0.0

### 本地开发运行

```bash
# 1. 克隆代码仓库
git clone git@github.com:monkeychen/mditor.git
cd mditor

# 2. 安装项目依赖
npm install

# 3. 启动桌面开发版 (Vite + Electron 热重载)
npm run dev
```

### 运行全量自动化测试（TDD 门禁）

```bash
# 运行全部 263 项 Vitest 单元与集成测试（毫秒级高并发执行）
npm test

# 运行 Playwright 桌面端到端真机桌面测试
npm run test:e2e

# 一键运行全部单测、集成测试与端到端自动化验收
npm run test:all
```

### 跨平台打包与发布

```bash
# 1. 执行 TypeScript 类型校验与静态构建
npm run build

# 2. 本地打包对应平台安装包
npm run package:mac      # 生成 macOS .dmg 与 .zip (Universal / arm64 / x64)
npm run package:win      # 生成 Windows NSIS 安装引导包与便携版
npm run package:linux    # 生成 Linux .AppImage 与 .deb 包
```

> [!NOTE]
> 根据项目构建铁律，对外发布的生产二进制包统一由 GitHub Actions 在打 Release Tag 时触发云端全自动化矩阵构建，确保跨平台构建的绝对纯净与可重现。

---

## 🛠️ 架构与设计哲学

| 维度 | 选定方案 | 为什么这么选（第一性原理） | 对用户的影响 |
|---|---|---|---|
| **WYSIWYG 编辑器** | **Milkdown (ProseMirror + remark)** | 以语义块节点为底层文档模型，表格、列表、数学公式和图表天生具备富交互结构，彻底攻克 CodeMirror 行级装饰器的跳变死穴。 | 打字排版不跳动；光标进出排版稳定；长文输入丝滑不掉帧。 |
| **源码模式** | **CodeMirror 6** | 专精于纯文本代码流的高性能内核，配合 Lezer 解析器提供精准的高亮与编辑能力。 | `⌘/` 瞬间切换，无缝查看与修改底层最原始的 Markdown 字符。 |
| **源文件保真门禁** | **定制 remark 序列化规则 + 42 项字节级回归单测** | 富文本重写保存极易导致符号替换（如 `*` 变 `-`、表格对齐被扰乱），用硬门禁确保打开与保存前后逐字节一致。 | 你的 Markdown 文档不会被软件擅自改动格式与私有排版。 |
| **安全沙箱** | **ContextIsolation + contextBridge** | 遵循现代 Electron 严格安全标准，禁止渲染进程开启 nodeIntegration。 | 即使打开来历不明的第三方 Markdown 文档，也绝无法通过恶意脚本窃取本地权限。 |
| **自动化测试** | **Vitest (263 用例) + Playwright 真机 E2E** | 坚持 TDD 红-绿-重构循环，任何特性必须先有失败测试再有实现，禁止无单测合入代码。 | 稳定可靠，任意重构或升级依赖均能秒级识别隐患，杜绝回归 Bug。 |

---

## 📁 目录结构约定

```
mditor/
├── docs/                      # 敏捷开发规范与版本交付文档（严格遵循 dev-workflow.md）
│   ├── prd/                   # 各版本产品需求文档 (PRD-vx.y.z.md)
│   ├── spec/                  # 各版本里程碑技术方案 (spec-vx.y.z-m<n>.md)
│   ├── prototype/             # 各里程碑高保真 HTML 交互原型
│   ├── release/               # 各版本发版说明与变更记录 (release-vx.y.z.md)
│   ├── vibe-coding-log.md     # 架构踩坑与避坑沉淀记录（持续追加）
│   └── archive/               # 历史版本完整文档整组归档
├── src/
│   ├── main/                  # Electron 主进程（窗口管理、文件 I/O、安全协议、导出服务、系统菜单）
│   ├── preload/               # 安全桥接层（contextBridge 暴露最小必要白名单 API）
│   └── renderer/              # 前端渲染进程（React 18 + Vite + Tailwind CSS）
│       ├── components/        # UI 组件（TabBar、PreferencesModal、GuideModal、Lightbox 等）
│       ├── editor/            # 编辑器内核（wysiwyg/ Milkdown 插件、source/ CodeMirror 6 扩展）
│       ├── hooks/             # 状态与响应式 hooks（useTabs、useDocument 等）
│       ├── styles/            # 全局样式与 5 大经典排版主题
│       ├── types/             # 共享 TypeScript 类型定义
│       └── utils/             # 纯函数计算（大纲提取、搜索替换、内联微信排版、PDF 分页等）
├── tests/
│   ├── unit/                  # 单元测试（260+ 项 Vitest 测试用例）
│   ├── integration/           # 导出管道与 IPC 服务集成测试
│   ├── fidelity/              # 42 组「打开-保存逐字节保真」黄金语料回归测试
│   └── e2e/                   # Playwright 桌面真机端到端验收测试
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🤝 参与贡献

我们非常欢迎来自社区的 Issue 反馈与 Pull Request！在提交代码前，请先查阅 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解代码规范与 TDD 测试流程。

---

## 📄 开源协议

本项目采用 [MIT 许可证](./LICENSE)。

Copyright © 2026 mditor Authors. Local-first & Crafted with Passion.
