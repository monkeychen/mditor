# mditor

<div align="center">

![macOS Style Markdown Editor](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-black?style=flat-square&logo=apple)
![Electron](https://img.shields.io/badge/Electron-35.0-47848F?style=flat-square&logo=electron)
![CodeMirror 6](https://img.shields.io/badge/Engine-CodeMirror%206-D97706?style=flat-square)
![TypeScript](https://img.shields.io/badge/Language-TypeScript%205-3178C6?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-emerald?style=flat-square)
![Tests](https://img.shields.io/badge/Tests-54%20passed%20(100%25)-brightgreen?style=flat-square)

<p align="center">
  <b>兼具 macOS 极致优雅审美与丝滑跟手体验的跨平台 Markdown 编辑器。</b><br/>
  基于 CodeMirror 6 纯文本装饰器架构，光标入行即编辑，移开即渲染；本地优先，永不破坏源文本。
</p>

[功能特性](#-核心特性) • [快捷键速查](#-快捷键速查) • [快速开始](#-快速开始) • [架构原则](#-架构与设计哲学) • [参与贡献](#-参与贡献)

---

</div>

## 📖 关于 mditor

市面上大部分跨平台 Markdown 工具往往面临两难抉择：左右双屏预览割裂了注意力，而纯 DOM 富文本内核（如常见所见即所得编辑器）又极易在保存时篡改原 Markdown 语法符号，并在长文档打字时产生掉帧与中文输入法（IME）迟滞。

**mditor** 遵从**第一性原理**从零设计：
1. **纯文本核心**：采用 **CodeMirror 6** 装饰器（Decoration）视图层驱动实时渲染（Hybrid Live Preview）。底层文件百分之百保持原生纯文本，十万字长文输入毫无延迟。
2. **macOS 原生手感**：无边框沉浸式窗口，交通灯内嵌避让，米白书籍质感画布（`#FAF8F5`）与 SF Pro 字体排版系统。
3. **创作全链路闭环**：多标签页并行编辑、剪贴板截图直接粘贴自动落盘到 `./assets/`、文档目录大纲双向联动，并独家提供**一键转换为微信公众号/知乎内联样式富文本**直接粘贴无损。

---

## ✨ 核心特性

- **即时所见即所得（Live Preview）**
  - **行级智能触发**：光标停留在当前行时，展示原生 Markdown `#`、`**`、`>` 标记方便精准改写；光标移开即刻无缝渲染为排版。
  - **全语法覆盖**：支持 1-6 级标题、强调、斜体、删除线、行内代码、引用块、横向分割线。
  - **交互式任务列表**：直接鼠标点击 `- [ ]` 复选框即可切换勾选，底层字符同步更新。
- **高级代码块与一键复制**
  - 围栏代码块（```lang）渲染为深色高质感代码卡片，支持语言标签识别，右上角配备一键复制代码按钮与状态动效。
- **本地图片自动落盘管道（Local Image Pipeline）**
  - 截图粘贴（`⌘V`）或拖拽图片文件，系统自动在当前文档同级创建 `./assets/` 目录并将图片写盘。
  - 光标处自动插入相对路径 `![image](./assets/xxx.png)`，编辑器内直接自适应内嵌卡片预览。
- **多标签页系统（Tabs）**
  - 多文档并行编辑，独立维护各自的滚动位置与自动保存队列。
  - 琥珀色脉冲小圆点指示未保存修改；关闭存在未保存修改的文档时弹出原生模态阻断确认（保存/放弃/取消）。
- **文档结构大纲抽屉（Outline / TOC）**
  - 即时提取 H1-H6 标题层级，支持快捷键 `⌘⇧O` 展开/折叠 240px 左侧大纲抽屉。
  - 点击大纲项实现编辑器视口平滑滚动吸附并定位光标。
- **悬浮式查找与替换（Search & Replace）**
  - 快捷键 `⌘F` 唤起 macOS 胶囊浮窗，全篇高亮匹配项并实时显示计数（如 `1/3`）。
  - 快捷键 `⌘H` 展开替换面板，支持单个替换与全量一键替换。
- **公众号排版与多格式导出**
  - **微信公众号 / 知乎一键排版**：纯前端 DOM 递归注入内联样式（Inline CSS），直接复制到系统剪贴板（`text/html`），第三方后台直接粘贴格式无损。
  - **独立自包含 HTML 导出**：样式打包内嵌，单文件脱离网络自成一体。
  - **高清矢量 PDF 导出**：调用 Electron Chromium 打印管线生成规范分页 PDF。

---

## ⌨️ 快捷键速查

| 快捷键 (macOS / Win) | 功能说明 |
|---|---|
| `⌘S` / `Ctrl+S` | 保存当前文档（若无路径则调起另存为） |
| `⌘O` / `Ctrl+O` | 打开本地 Markdown 文档并在新标签载入 |
| `⌘T` / `Ctrl+T` | 新建空白文档标签页 |
| `⌘W` / `Ctrl+W` | 关闭当前文档标签页（未保存触发确认阻断） |
| `⌘1` ~ `⌘9` / `Ctrl+1` ~ `9` | 快速直达第 1 至 9 个标签页 |
| `⌘⇧[` / `⌘⇧]` | 在多标签栏间向前/向后轮换切换 |
| `⌘⇧O` / `Ctrl+Shift+O` | 展开 / 折叠左侧文档大纲抽屉 |
| `⌘F` / `Ctrl+F` | 呼出悬浮查找面板 |
| `⌘H` / `Ctrl+H` | 呼出并展开替换面板 |
| `Enter` / `⇧Enter` | 查找模式下跳转到下一个 / 上一个匹配项 |
| `Esc` | 关闭悬浮查找替换面板 |
| `⌘V` / `Ctrl+V` | 粘贴剪贴板截图并自动落盘至 `./assets/` |

---

## 🚀 快速开始

### 运行环境
- [Node.js](https://nodejs.org/) >= 20.0.0
- npm >= 10.0.0

### 安装与本地运行

```bash
# 1. 克隆仓库
git clone git@github.com:monkeychen/mditor.git
cd mditor

# 2. 安装项目依赖
npm install

# 3. 启动桌面开发版 (Vite + Electron 热重载)
npm run dev
```

### 构建与各平台安装包打包

```bash
# 1. 执行 TypeScript 类型校验与静态构建
npm run build

# 2. 打包 macOS 原生安装包 (.dmg 与 .zip，自动支持 Apple Silicon arm64 与 Intel x64)
npm run package:mac

# 3. 打包 Windows 安装包 (.exe，包含 NSIS 安装引导程序与便携免安装版)
npm run package:win

# 4. 打包 Linux 原生安装包 (.AppImage 与 .deb)
npm run package:linux

# 所有安装包与分发产物统一输出至 release-build/ 目录
```

### 运行全量自动化测试（TDD 门禁）

```bash
# 一键运行全部单元测试、集成测试与真机 Electron E2E 测试
npm run test:all

# 仅运行 Vitest 单元与集成测试
npm test

# 仅运行 Playwright 桌面端到端真机测试
npm run test:e2e
```

---

## 🛠️ 架构与设计哲学

| 层次 | 选定方案 | 为什么这么选 | 对用户的影响 |
|---|---|---|---|
| **编辑器内核** | **CodeMirror 6** | 纯文本 AST + Decoration 装饰器。比 DOM 富文本更稳定，绝不篡改 Markdown 源字符。 | 极速跟手，即使数十万字长文也不掉帧；完全保障本地数据保真。 |
| **交互模式** | **Hybrid Live Preview** | 光标所在行展示 Markdown 语法符号，光标离开自动渲染为排版。 | 兼顾纯文本的可控性与最终排版的美观，无需左右分屏预览。 |
| **安全沙箱** | **ContextIsolation + contextBridge** | 遵循现代 Electron 严格安全标准，禁止 nodeIntegration。 | 打开任何第三方 Markdown 文档绝不危害本地系统安全。 |
| **测试门禁** | **Vitest + Playwright** | 全流程 TDD 驱动，红-绿-重构循环，真机桌面窗口全覆盖。 | 54/54 自动化用例 100% 通过率，杜绝暗坑与回归隐患。 |

---

## 📁 目录结构约定

```
mditor/
├── .github/                   # GitHub Actions CI 与模板规范
├── docs/                      # 敏捷文档（遵循 dev-workflow.md）
│   ├── prd/                   # PRD 产品需求文档
│   ├── spec/                  # 里程碑设计规范
│   ├── prototype/             # 高保真 HTML 交互原型
│   ├── release/               # 版本交付与变更记录
│   └── archive/               # 历史版本整组归档
├── src/
│   ├── main/                  # Electron 主进程（文件系统 I/O、图片落盘、导出服务）
│   ├── preload/               # 安全桥接层（contextBridge 暴露最小必要白名单 API）
│   └── renderer/              # 前端渲染进程（React 18 + Vite + Tailwind）
│       ├── components/        # UI 组件（TabBar、OutlineDrawer、SearchPanel 等）
│       ├── editor/            # CodeMirror 6 扩展（Live Preview、代码块、图片落盘拦截）
│       ├── hooks/             # 响应式状态管理（useTabs、useDocument）
│       ├── services/          # IPC 服务包装
│       ├── styles/            # 全局样式与 macOS 主题变量
│       └── utils/             # 纯函数计算（大纲提取、搜索替换、微信排版内联转换）
├── tests/
│   ├── unit/                  # 单元测试（Vitest + Testing Library）
│   ├── integration/           # 真实本地磁盘 I/O 集成测试
│   └── e2e/                   # 真机桌面端到端自动化测试（Playwright）
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🤝 参与贡献

欢迎通过 Issue 或 Pull Request 为 mditor 贡献力量！请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解代码与测试规范。

---

## 📄 开源协议

本项目采用 [MIT 许可证](./LICENSE)。欢迎自由使用、学习与二次创作。
