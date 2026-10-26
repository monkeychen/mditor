# GEMINI.md - mditor 项目规范

## 1. 项目定位与目标
- **定位**：一款兼具 macOS 极致优雅视觉与丝滑交互体验的跨平台 Markdown 编辑器。
- **核心基调**：轻量沉浸、本地优先（Local-first）、即时所见即所得（Live Preview / WYSIWYG）、原生级打字手感。
- **技术栈**：Electron + TypeScript + Vite + React + Tailwind CSS + CodeMirror 6。

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
│       ├── editor/            # Markdown 编辑器核心扩展（基于 CodeMirror 6 装饰器）
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
| **编辑器内核** | CodeMirror 6 | 纯文本架构 + Decoration 视图层。比 DOM 富文本更稳定，不会篡改原 Markdown 字符。 | 极速跟手，即使打开十万字长文也不掉帧；完全保障本地源文件安全。 |
| **交互风格** | Typora / Bear 式 Hybrid Live Preview | 光标所在行展示 Markdown 语法符号，光标离开自动渲染为排版。 | 兼顾纯文本的可控性与最终排版的美观，无需左右分屏预览。 |
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
