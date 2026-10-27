---
doc: spec
product: v0.3.0
milestone: m3
date: 2026-10-27
status: approved
---

# Spec-v0.3.0-M3：Typora 风格扩展排版语法（高亮/脚注/上下标/TOC/Front Matter）

## 1. 目标与范围

- **覆盖功能**：PRD-v0.3.0 中的 F21（Typora 风格扩展排版语法）全部验收标准（AC-21.1 ~ AC-21.4）。
- **交付内容**：
  1. **高亮标记（Highlight）**：支持 `==高亮文字==` 语法，渲染淡雅高亮底色（`rgba(254, 240, 138, 0.7)`），光标进入局部露出定界符，移出恢复纯净排版；
  2. **脚注系统（Footnote）**：完善 `[^1]` 脚注引用与底部定义，实现鼠标悬浮浮动预览注释内容、点击平滑滚动锚点；
  3. **上标与下标（Super / Subscript）**：支持 `X^2^` 上标与 `H~2~O` 下标排版；
  4. **自动目录块（`[TOC]`）**：行首单行输入 `[TOC]` 或 `[toc]` + 回车，自动生成全文档树形目录卡片，与正文 H1–H6 实时联动，点击平滑定位；
  5. **YAML Front Matter**：文档顶部 `---...---` 渲染为精致折叠元数据卡片，支持展开查看/编辑与收起；
  6. **100% 源文件保真**：上述语法在「打开 ➔ 实时渲染 ➔ 源码模式切换 (`⌘/`) ➔ 存盘」全流程逐字节无损还原。

---

## 2. 架构与技术设计

### 2.1 语法扩展与 AST 映射

| 扩展语法 | 语法示例 | ProseMirror 模型 | 序列化规则 |
|---|---|---|---|
| **高亮标记** | `==重点关注==` | `mark: highlight` (`<mark class="mditor-highlight">`) | `==$text==` |
| **下标** | `H~2~O` | `mark: subscript` (`<sub>`) | `~$text~` |
| **上标** | `X^2^` | `mark: superscript` (`<sup>`) | `^$text^` |
| **自动目录块** | `[TOC]` | `node: toc_block` (不可编辑块，动态生成) | `[TOC]` |
| **YAML Front Matter** | `---\ntitle: 标题\n---` | `node: frontmatter` (块节点，折叠卡片) | `---\n$yaml\n---` |
| **脚注系统** | `[^1]` 与 `[^1]: 注释` | `footnote_reference` 与 `footnote_definition` | 原样保持 GFM 脚注语法 |

### 2.2 交互设计与 macOS 视觉规范

```
[YAML Front Matter 卡片]
╭──────────────────────────────────────────────────────────╮
│ 📄 文档元数据 (YAML Front Matter)               [展开/收起 ▾] │
│ title: 设计第一性原理与 macOS 手感                            │
│ date: 2026-10-27                                         │
╰──────────────────────────────────────────────────────────╯

[正文高亮与上下标]
在实验中，测得水分子 H₂O (H~2~O) 的反应速率与 E = mc² (mc^2^) 高度相关。
特别强调：【==用户触碰到的每一层必须丝滑==】。

[脚注浮动预览]
正文结论[^1]
         ╭────────────────────────────────╮
         │ 💡 脚注 [^1] 预览：             │
         │ 后端可以很复杂，但用户交互必须极简。│
         ╰────────────────────────────────╯

[自动目录块 TOC]
╭──────────────────────────────────────────────────────────╮
│ 📑 自动目录 (TOC - 实时联动)                                │
│   • 1. 设计第一性原理与 macOS 手感                           │
│     • 1.1 核心交互特性                                    │
│     • 1.2 本地图片自动落盘与渲染                             │
│   • 2. 总结                                              │
╰──────────────────────────────────────────────────────────╯
```

1. **定界符智能露出**：
   - 高亮 `==`、下标 `~`、上标 `^` 融入现有 `delimiterPlugin` 与 `autoPairPlugin`，光标进入高亮文本内部时露出 `==`，移出后隐藏。
2. **脚注浮窗与联动**：
   - 监听 `.footnote-ref` 的 `mouseenter` 事件，在上方弹出磨砂毛玻璃浮动预览卡片；
   - 点击平滑滚动至对应脚注定义 `div.footnote-def`；
   - 脚注定义尾部提供 `↩︎` 返回按钮，点击滚回原引用点。
3. **TOC 目录树与实时刷新**：
   - TOC 节点监听 ProseMirror doc 变更，从当前 doc 递归抽取 H1–H6 标题层级；
   - 点击任意目录项调用 `editor.scrollToHeading(index)`，丝滑跳转至目标小节。

---

## 3. 详细任务分解（TDD）

- **T301：高亮、上标、下标 Mark 扩展插件**
  - 定义 `highlight`, `subscript`, `superscript` Schema 与 remark 序列化扩展；
  - 编写单元测试 `tests/unit/extended-marks.test.ts`。
- **T302：YAML Front Matter 节点与折叠卡片**
  - 引入 `remark-frontmatter`，实现 `frontmatter` ProseMirror 节点与折叠 Card NodeView；
  - 编写单元测试 `tests/unit/frontmatter.test.ts`。
- **T303：自动目录块 `[TOC]` 节点与联动更新**
  - 实现 `toc_block` 节点、单行 `[TOC]` 输入规则及标题变化时的联动更新；
  - 编写单元测试 `tests/unit/toc-block.test.ts`。
- **T304：脚注浮动预览与交互增强**
  - 完善脚注的悬浮提示浮窗（Tooltip）与平滑滚动导航；
  - 编写单元测试 `tests/unit/footnote-tooltip.test.ts`。
- **T305：保真度测试与真机 E2E 验证**
  - 新增 5 个语料库测试文件（`37-highlight.md`, `38-sub-super.md`, `39-frontmatter.md`, `40-toc.md`, `41-footnotes.md`）；
  - 编写 Playwright E2E `tests/e2e/v0.3.0-m3-extended-typography.spec.ts`，全量验证真机交互。

---

## 4. 验收门禁

1. `npm run lint` 0 error；
2. 单元测试与保真测试 100% GREEN 通过；
3. Playwright E2E 验证真实 Electron 下高亮呈现亮黄色背景、悬浮脚注弹出浮窗、点击 TOC 项精确定位小节。
