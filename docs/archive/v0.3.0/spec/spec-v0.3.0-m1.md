---
doc: spec
product: v0.3.0
milestone: m1
date: 2026-10-27
status: approved
---

# Spec-v0.3.0-M1：KaTeX 数学公式系统（行内公式与独立公式块）

## 1. 目标与范围

- **覆盖功能**：PRD-v0.3.0 中的 F19（数学公式系统）全部验收标准（AC-19.1 ~ AC-19.3）。
- **交付内容**：
  1. 引入 KaTeX 依赖并在主入口/渲染进程集成样式；
  2. 实现行内公式节点（`inline_math`，语法 `$formula$`）与行内交互（光标进入露出定界符与 LaTeX 源码，移出渲染为 KaTeX 矢量排版）；
  3. 实现独立公式块节点（`math_block`，语法 `$$\n...\n$$`）与居中排版、点击展开交互编辑栏、语法容错；
  4. 支持快捷键 `⌥⌘M` 插入公式；
  5. 扩展源文件保真测试语料库，确保数学公式「打开 → 编辑 → 源码切换 → 保存」逐字节保真。

---

## 2. 架构与技术设计

### 2.1 依赖选型与引入

| 依赖库 | 版本建议 | 作用与决策理由 |
|---|---|---|
| `katex` | `^0.16.21` | 专业级 LaTeX 公式排版引擎，渲染速度快、无异步依赖、无重度 DOM 垃圾回收开销 |
| `@types/katex` | `^0.16.7` | 强类型定义支持 |
| `remark-math` | `^6.0.0` | Markdown AST（mdast）扩展，将 `$..$` 解析为 `inlineMath`，`$$..$$` 解析为 `math` |

### 2.2 ProseMirror 节点与 Schema 设计

1. **`inline_math` 节点（行内）**：
   - `group: 'inline'`，`inline: true`，`atom: false`（可直接内嵌文本或由 NodeView 管理）。
   - `attrs: { value: { default: '' } }`。
   - `toDOM`: `['span', { class: 'inline-math-wrapper' }, 0]`。
2. **`math_block` 节点（块级）**：
   - `group: 'block'`，`atom: true`。
   - `attrs: { value: { default: '' } }`。
   - 配合自定义 `MathBlockView` 进行 NodeView 渲染，支持居中渲染区与可折叠编辑面板。

### 2.3 交互设计对齐 Typora 原生手感

```
[行内公式（平时状态）]
正文内容 ... E = mc² ... 更多文字

[光标进入行内公式时]
正文内容 ... [ $E=mc^2$ ] ... 更多文字 (黄色淡雅高亮底色，等宽字体，允许原地修改字符)

[独立公式块]
           ╭──────────────────────────────────────────────╮
           │        +∞                                    │
           │       ⌠    -x²                               │
           │       ⌡   e    dx = √π                       │
           │        -∞                                    │
           ╰──────────────────────────────────────────────╯
           [ ⌥ 点击公式展开源码栏：\int_{-\infty}^{+\infty} e^{-x^2} dx = \sqrt{\pi} ]
```

- **定界符与编辑模式**：
  - 光标移动至行内公式内部时，通过 ProseMirror View 或 NodeView 将当前公式切换为可编辑的源码态，以微弱下划线或高亮框标识；
  - 移出公式范围后，调用 `katex.renderToString(value, { throwOnError: false })` 即时替换为精美矢量排版。
- **语法容错机制（Fault Tolerance）**：
  - `throwOnError: false`，当用户输入非法或未闭合的 LaTeX 语法（如 `\frac{1}{`）时，KaTeX 以淡红色的原始字符呈现，并在下方提示友好语法提示，绝不抛出未捕获异常。

---

## 3. 详细任务分解（TDD）

- **T101：KaTeX 依赖安装与基础渲染工具封装**
  - 安装 `katex`，封装 `renderMathToString(latex, isBlock)` 安全工具函数；
  - 编写工具函数单元测试 `tests/unit/katex-renderer.test.ts`。
- **T102：行内公式节点与交互插件实现**
  - 定义 `inlineMath` schema 并在 Milkdown 中注册；
  - 实现光标进出定界符露出与 LaTeX 源码实时同步；
  - 编写单元测试 `tests/unit/inline-math.test.ts`。
- **T103：块级公式节点与交互 NodeView**
  - 实现 `math_block` 节点及 `MathBlockView`（居中排版、点击展开 LaTeX 编辑抽屉、实时重绘）；
  - 编写单元测试 `tests/unit/math-block.test.ts`。
- **T104：输入规则与快捷键绑定**
  - 支持 `⌥⌘M` 插入公式，支持行首 `$$` + 回车直接创建公式块；
  - 编写单元测试 `tests/unit/math-keymap.test.ts`。
- **T105：保真度测试与真机 E2E 验证**
  - 增加 3 个公式相关保真语料文件，验证保存前后逐字节不变；
  - 编写 Playwright E2E `tests/e2e/v0.3.0-m1-math.spec.ts`，验证真机 Electron 下公式渲染与点击修改实时上屏。

---

## 4. 验收门禁

1. `npm run lint` 0 error；
2. 单元测试与保真测试 100% 通过；
3. Playwright E2E 真实加载企业级公式文档并校验 `.katex` 节点的矢量渲染与尺寸。
