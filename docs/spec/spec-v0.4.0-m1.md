---
doc: spec
product: v0.4.0
milestone: m1
date: 2026-10-27
status: approved
---

# spec-v0.4.0-m1：全能文本与多编程语言代码引擎设计

## 1. 里程碑目标与覆盖范围

### 1.1 目标
在当前完善的 Markdown 实时排版与多工作区侧边栏基础上，将 mditor 的文件兼容性与编辑能力从「仅限 Markdown」扩展为「全能通用文本文档与主流编程语言源码查看/编辑工作台」。支持打开 20+ 种主流数据格式、配置文件、通用日志与编程语言代码，通过智能模式路由自动匹配最佳渲染引擎与语法高亮。

### 1.2 覆盖范围
- **功能需求**：F29（全能轻量文本文档与多编程语言代码高亮引擎）
- **验收标准**：
  - **AC-29.1**：侧边栏目录扫描与打开文件对话框全面解除仅限 `.md` 限制，支持完整主流扩展名池；
  - **AC-29.2**：智能模式路由（Smart Mode Routing）——Markdown 文件维持默认双模式，非 Markdown 代码与文本文件自动锁定并切入 CodeMirror 6 源码模式，状态栏与切换开关自适应呈现；
  - **AC-29.3**：基于 `@codemirror/language-data` 与 `LanguageDescription` 动态按需加载高精语法解析器，提供行号、代码折叠、括号匹配与暗黑/亮色主题统一着色。

---

## 2. 关键架构与核心设计思路

### 2.1 支持的文件格式分类与解析矩阵
定义语言检测与类型注册中心 `src/renderer/utils/languageClassifier.ts`：

| 分类 | 扩展名集合 | 模式路由 | 语言描述 / 解析器 | 侧边栏图标 |
|---|---|---|---|---|
| **Markdown** | `.md`, `.markdown`, `.mdown` | 双模式（默认 WYSIWYG） | Milkdown / CodeMirror GFM | `FileText` (amber) |
| **通用文本与日志** | `.txt`, `.text`, `.log`, `.diff`, `.patch` | 源码模式锁定 | Plaintext / Diff | `FileText` (stone) |
| **数据交换与配置** | `.json`, `.jsonc`, `.yaml`, `.yml`, `.toml`, `.xml`, `.ini`, `.env`, `.csv`, `.properties` | 源码模式锁定 | JSON, YAML, TOML, XML | `FileJson` / `FileSpreadsheet` (blue) |
| **主流编程语言** | `.py`, `.sql`, `.java`, `.kt`, `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.go`, `.rs`, `.c`, `.cpp`, `.h`, `.hpp`, `.cs`, `.sh`, `.bash`, `.zsh`, `Dockerfile`, `.dockerfile` | 源码模式锁定 | Python, SQL, Java, JS/TS, Go, Rust, C/C++, C#, Shell | `FileCode` (purple/emerald) |

### 2.2 智能模式路由与状态栏联动设计（Smart Mode Routing）
1. **标签页元数据增强**：
   在 `TabItem` 中维护 `isMarkdown: boolean` 及 `language: string`：
   - 载入文档时，根据 `filePath` 或 `fileName` 判断后缀；
   - 若 `!isMarkdown`，将该 Tab 的编辑模式强制锁定为 `source`；
2. **工具栏与底栏开关智能禁用**：
   - 顶层工具栏的模式切换按钮以及状态栏右侧的「模式切换按钮」：
     - 若当前激活 Tab 为 Markdown：保持可用，自由在「实时渲染」与「源码模式 (⌘/)」之间平滑切换；
     - 若当前激活 Tab 为代码或文本文件：模式按钮置灰为不可点击，并显示 Tooltip：`代码文件仅支持源码模式`；
3. **状态栏语言指示器**：
   - 状态栏中间/右侧显示当前语言徽章（如 `Python`、`JSON`、`SQL`、`TypeScript` 或 `Markdown`）。

### 2.3 CodeMirror 6 动态按需语言加载与高亮管线
在 `SourceEditor.tsx` 中：
1. 利用 `@codemirror/language-data` 的 `languages` 清单与 `LanguageDescription.matchFilename(languages, fileName)` 精确匹配目标语言；
2. 匹配成功后，调用 `langDesc.load()` 异步加载语言支持包（如 `@codemirror/lang-python`、`@codemirror/lang-json`、`@codemirror/lang-sql` 等）；
3. 将动态加载的语言扩展结合已有的 VS Code 风格主题、行号（`lineNumbers()`）、代码折叠（`foldGutter()`）与匹配括号（`bracketMatching()`）统一注入编辑器 View。

### 2.4 主进程扫描与对话框文件类型过滤器扩展
1. `src/main/folderService.ts`：
   - 将 `MD_EXTENSIONS` 扩展为 `SUPPORTED_TEXT_EXTENSIONS`，支持扫描包括代码、配置、日志在内的所有支持文本文件，避免漏掉工作区中的代码文件；
2. `src/main/index.ts`：
   - `ipcMain.handle('file:open')` 对话框过滤器分组，支持「所有支持格式 (*.md, *.json, *.py, *.sql...)」、「Markdown 文档 (*.md)」、「源代码与脚本 (*.py, *.sql, *.java, *.js, *.ts...)」、「数据与配置 (*.json, *.yaml, *.xml...)」及「所有文件 (*.*)」。

---

## 3. 任务拆解与 TDD 计划（Task Breakdown）

- [ ] **T401：文件格式定义与语言识别分类器模块** (`languageClassifier.ts` + 单元测试)
- [ ] **T402：主进程文件扫描扩展与对话框文件类型过滤** (`folderService.ts`, `main/index.ts` + 单元测试)
- [ ] **T403：SourceEditor 动态语言解析包加载与语法着色升级** (`SourceEditor.tsx` + 单元测试)
- [ ] **T404：App 智能模式路由、侧边栏扩展名图标、状态栏语言指示器与 E2E 验证** (`App.tsx`, `OutlineDrawer.tsx` + Playwright E2E)
