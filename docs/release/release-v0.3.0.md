---
doc: release
product: v0.3.0
date: 2026-10-27
status: approved
---

# Release Note - mditor v0.3.0：全面对齐 Typora 核心高阶排版体系

## 1. 变更记录 (Changelog)

### Added
- **KaTeX 数学公式系统 (`⌥⌘M` / `$...$` / `$$...$$`)**：
  - 支持 `$...$` 行内公式实时渲染为高精矢量排版；点击原地展开微型公式编辑条，修改即时刷新。
  - 支持 `$$...$$` 独立公式块及换行公式排版，悬停右上角展开抽屉式源码编辑面板。
  - 源码模式与实时渲染双模式双向无缝转换，严格保证源文件逐字节保真。
- **Mermaid 矢量图表系统 (` ```mermaid `)**：
  - 支持流程图（Flowchart）、时序图（Sequence）、类图（Class）、状态图（State）、实体关系图（ER）、甘特图（Gantt）等主流图表自动生成 SVG 矢量图。
  - 卡片集成悬浮控制栏：一键「查看/编辑源码」抽屉、一键「复制代码」、一键「导出 SVG 矢量图」。
  - 语法错误智能熔断：图表语法输入错误时不崩溃，内联展示红色错误诊断卡片，修改后即时自动恢复。
- **Typora 风格扩展排版语法**：
  - **高亮标记（Highlight）**：支持 `==高亮内容==`，呈现温润黄色荧光笔底色。
  - **上下标排版**：支持化学式与数学表达 `H~2~O`（下标 `sub`）与 `E=mc^2^`（上标 `sup`），并在 AST 中精准区分 GFM 删除线 `~~del~~`。
  - **YAML Front Matter**：顶部元数据折叠卡片（`frontmatter-card`），支持一键展开/收起。
  - **自动目录块（`[TOC]`）**：单行输入 `[TOC]` 自动解析全文 H1–H6 树形结构生成目录卡片，点击平滑滚动定位正文。
  - **脚注体系（Footnotes）**：正文 `[^1]` 悬停预览浮窗（`footnoteTooltip`），点击平滑滚动至文末高亮注释。
- **经典多主题视觉系统**：
  - 内置 4 套经典外观：**macOS Light**（默认清爽白）、**GitHub**（官方文档灰白风）、**Night**（Typora 经典深炭黑护眼暗黑模式）、**Newsprint**（温润羊皮纸米黄底色与报刊衬线排版）。
  - 基于根元素 CSS 变量体系驱动，切换耗时 < 10ms，**零重新挂载**，光标选区与撤销历史 100% 保持。
  - 底部状态栏提供精美主题切换 Popover；源码模式（CodeMirror 6）同步联动主题配色。
  - 主题偏好本地自动持久化（`mditor:theme`），跨会话与重启应用自动继承。

### Changed
- **标签页切换安全防护**：在切换 Tab 或新建 Tab 时，自动同步 flush 当前激活编辑器的最新内容，彻底杜绝切 Tab 导致未保存内容被旧状态覆盖。
- **语料库覆盖度扩充**：保真度语料库扩充至 42 个多源测试文件，涵盖数学公式、图表、高亮、上下标、元数据、自动目录等所有扩展语法。

---

## 2. 交付物清单与获取方式

- **GitHub Release 跨平台安装包**（由云端 CI 针对 `v0.3.0` Tag 自动多平台编译生成）：
  - macOS: `mditor-0.3.0-universal.dmg`, `mditor-0.3.0-mac.zip`
  - Windows: `mditor-Setup-0.3.0.exe`, `mditor-0.3.0-win.portable.exe`
  - Linux: `mditor-0.3.0.AppImage`, `mditor_0.3.0_amd64.deb`
- **源码仓库**：`git clone git@github.com:monkeychen/mditor.git && git checkout v0.3.0`

---

## 3. 验收汇总

- **M1（KaTeX 数学公式系统）**：Approved，行内/独立公式渲染、原地编辑、定界符露出全部通过。
- **M2（Mermaid 图表系统）**：Approved，6 类图表 SVG 渲染、源码抽屉折叠、一键复制/导出 SVG、错误熔断全部通过。
- **M3（扩展排版语法）**：Approved，高亮、上下标、Front Matter、`[TOC]` 动态目录、脚注预览全部通过，42/42 语料库 100% 逐字节保真。
- **M4（多主题视觉系统）**：Approved，4 款主题无感切换、暗黑模式样式计算、重启持久化记忆全部通过。
- **自动化门禁全量通过**：
  - **Vitest**：48 个测试文件、144 个单元与集成测试全部 PASS。
  - **Playwright E2E**：13/13 个真机端到端全量回归测试全部 PASS。
  - **TypeScript Lint**：0 报错。

---

## 4. 下版规划 (v0.4.0 Backlog)

1. **高级导出系统**：集成 Headless Chromium / PDFKit 导出带页码、目录的大师级打印版 PDF，以及独立内联资源 HTML。
2. **外部主题自定义与主题商店**：允许用户自定义导入或编辑第三方 CSS 主题。
3. **Pandoc 引擎扩展**：支持 Word (.docx) 与 ePub 双向导出导入。
