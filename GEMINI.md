# GEMINI.md - mditor 项目规范

## 1. 项目定位与目标
- **定位**：一款兼具 macOS 极致优雅视觉与丝滑交互体验的跨平台 Markdown 编辑器，**交互体验全面对标 Typora**。
- **核心基调**：轻量沉浸、本地优先（Local-first）、真所见即所得（WYSIWYG）+ 源码模式双模式、原生级打字手感。
- **技术栈**：Electron + TypeScript + Vite + React + Tailwind CSS + Milkdown（ProseMirror + remark，所见即所得）+ CodeMirror 6（源码模式 / 代码块）。
- **对标红线**：功能与交互可对齐 Typora，但严禁使用 Typora 的名称、图标、内置主题 CSS 或任何代码。

---

## 2. 目录结构约定

```
mditor/
├── docs/                      # 流程与规范文档（严格遵循 dev-workflow.md）
│   ├── prd/                   # PRD-vx.y.z.md
│   ├── spec/                  # spec-vx.y.z-m<n>.md
│   ├── prototype/             # prototype-vx.y.z-m<n>.html
│   ├── release/               # release-vx.y.z.md
│   ├── vibe-coding-log.md     # 协作踩坑与避坑沉淀
│   └── archive/               # 历史版本归档
├── src/
│   ├── main/                  # Electron 主进程（生命周期、窗口管理、文件系统 IPC）
│   ├── preload/               # 安全桥接脚本（contextBridge 暴露最小必要 API）
│   └── renderer/              # 前端渲染进程
│       ├── components/        # UI 组件（macOS 风格沉浸式界面）
│       ├── editor/            # 编辑器内核（wysiwyg/ Milkdown 插件、source/ CodeMirror 6 源码模式）
│       ├── hooks/             # 状态与响应式 hooks
│       ├── styles/            # 全局样式与 Tailwind 主题变量
│       └── types/             # 共享 TypeScript 类型
├── tests/
│   ├── unit/                  # 单元测试（Vitest）
│   ├── integration/           # IPC 与状态集成测试
│   └── e2e/                   # 端到端测试（Playwright / Spectron）
├── package.json
├── tsconfig.json
├── vite.config.ts
└── GEMINI.md                  # 本规范文档
```

---

## 3. 开发流程与门禁约束（Dev Workflow）

本仓库严格遵循 `~/.gemini/dev-workflow.md` 流程规范：
1. **版本驱动**：`vx.y.z`，一个版本一份 PRD（`docs/prd/PRD-vx.y.z.md`），人类审核（approved）前不启动开发。
2. **里程碑循环**：设计（spec）→ 原型（prototype HTML）→ TDD 开发（红-绿-重构）→ 自动化验收。
3. **严禁破坏规则**：
   - 先写测试后写实现（TDD）。
   - 禁止在没有测试覆盖的情况下合入功能代码。
   - 需求变更先改文档再改代码。
   - 所有测试必须一条命令自动跑完，禁止纯人工点检。

---

## 4. 技术与架构决策原则

| 决策点 | 选定方案 | 为什么这么选 | 对用户的影响 |
|---|---|---|---|
| **编辑器内核**（v0.2.0 变更） | 所见即所得：Milkdown（ProseMirror + remark）；源码模式：CodeMirror 6 | v0.1.0 的 CodeMirror 装饰器方案上限是 Obsidian Live Preview：表格/列表/引用需逐一手写 Widget，光标进出整行退化导致排版跳变。ProseMirror 以块节点为文档模型，表格、列表、引用天然可编辑，才能达到 Typora 体验。 | 打字时排版不跳变；表格、列表、图片直接在排版中编辑；`⌘/` 一键切到纯源码。 |
| **源文件保真** | remark 序列化规则定制 + 「打开→保存逐字节不变」自动化回归测试门禁 | ProseMirror 保存时需重新序列化 Markdown，存在改写写法（`*`→`-`、表格对齐）的风险，必须用测试兜底。 | 用户的 Markdown 文件不会被无故改格式；无法逐字节保真的写法在文档中明示。 |
| **交互风格** | Typora 式双模式：实时渲染（默认）+ 源码模式（`⌘/`） | 实时渲染下仅在光标所在的行内元素局部露出语法符号，排版尺寸保持不变；整篇源码需求交给源码模式。 | 写作沉浸与源码精确控制两不误，无需分屏预览。 |
| **UI 视觉** | macOS 风格设计系统（SF Pro、微透毛玻璃、精致工具栏） | 还原 macOS 本地顶级软件的精致、内敛与高信噪比。 | 视觉无干扰，沉浸在打字和内容生产中。 |
| **安全机制** | ContextIsolation + 禁用 nodeIntegration | 遵循现代 Electron 严格安全标准。 | 防止恶意本地或注入脚本窃取系统权限。 |

---

## 5. 约定与代码习惯
- **语言**：代码、注释、Commit 信息一律使用英文；文档、PRD、沟通使用中文。
- **代码提交**：一个 Task 一个 Commit，格式如 `feat(editor): implement live heading decoration`。
- **密钥约束**：任何敏感 token/密钥严禁提交入库。

---

## 6. 版本发布与构建门禁（Release & CI/CD）

- **云端构建第一原则**：所有跨平台二进制发布包（macOS DMG/ZIP、Windows NSIS/Portable、Linux AppImage/DEB）必须由版本 Tag 触发 GitHub Actions 云端 CI 多平台 Runner 自动构建并挂载至 GitHub Release。
- **时序铁律**：所有构建配置（`electron-builder.json`）与工作流脚本（`.github/workflows/release.yml`）必须先合入 `main` 并验证通过，最后一步才打 Release Tag。严禁时序倒置。
- **应急兜底约束**：**严禁日常使用本地打包人工上传**。除非云端 CI 经过多轮尝试排查依然无法打出正确的包，并明确在 Release Note / Issue 中注明具体环境阻断原因，才允许使用本地编译上传作为应急兜底手段。
