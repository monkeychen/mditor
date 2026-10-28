---
doc: spec
product: v0.5.0
milestone: m3
date: 2026-10-28
status: approved
---

# 技术规格说明书：v0.5.0 - 里程碑 M3：出版级 PDF/Word 导出与图片画布灯箱

**版本**：v0.5.0  
**里程碑**：M3  
**责任模块**：导出服务 (`exportService.ts`, `docxExportService.ts`)、导出设置模态框 (`ExportModal.tsx`)、图片灯箱预览器 (`ImageLightbox.tsx`, `MilkdownEditor.tsx`)  

---

## 1. 目标与范围

本里程碑聚焦 **F35（出版级 PDF 导出与防断页控制）**、**F36（原生 Word `.docx` 格式导出）** 与 **F37（画布图片灯箱大图预览）**：
1. **出版级 PDF 导出与专业分页防断页（F35）**：
   - 注入专有打印媒体查询样式（`@media print`）：对代码块、数据表格、数学公式块、Mermaid 矢量图表应用 `break-inside: avoid` / `page-break-inside: avoid`，彻底根除内容被跨页腰斩的排版问题；
   - 标题级元素（H1~H3）应用 `break-after: avoid`，严禁孤行标题出现在页面底部；
   - 导出选项支持：A4 / Letter 规格纸张切换、页边距档位（标准 20mm / 窄 10mm）、优雅的页码与页眉控制（`第 X 页 / 共 Y 页`）。
2. **原生 Word 文档格式导出（F36）**：
   - 引入标准 `docx` 生成管道，通过结构化 AST 解析将 Markdown 映射为原生 Word 元素（Paragraph、TextRun、HeadingLevel、Table、TableCell、TableBorders）；
   - 保持字体层级、粗斜体样式、列表嵌套与表格边框的高保真还原，输出在 Microsoft Word 与 WPS Office 中均能原生打开的标准 `.docx` 文件。
3. **画布图片灯箱大图预览（F37）**：
   - 所见即所得编辑画布中，悬停图片显示优雅的放大指示角标，点击即可平滑唤出全屏毛玻璃灯箱；
   - 具备滚轮平滑缩放（25%~500%）、放大后自由鼠标拖拽平移、分辨率与缩放比状态条；
   - 支持 `Escape` 键、双击复位与点击空白遮罩秒级退出。

---

## 2. 关键技术方案

### 2.1 PDF 出版级打印样式与 Electron printToPDF (`src/main/exportService.ts`)

1. **防断页 CSS 注入规则**：
   ```css
   @media print {
     @page {
       size: A4 portrait;
       margin: 20mm 15mm;
     }
     /* 严禁以下块级容器在分页边界处被腰斩截断 */
     pre, code, .code-block-container,
     table, .milkdown-table,
     .math-block, .katex-display,
     .mermaid-block, svg,
     blockquote, img {
       break-inside: avoid !important;
       page-break-inside: avoid !important;
     }
     /* 严禁标题成为页尾孤行 */
     h1, h2, h3, h4, h5, h6 {
       break-after: avoid !important;
       page-break-after: avoid !important;
     }
   }
   ```
2. **Electron IPC 扩展**：
   - 增加 `export:pdfWithOptions` 接口：接收 `pageSize: 'A4' | 'Letter'`、`marginType: 'default' | 'none' | 'minimum'`、`displayHeaderFooter: boolean`、`title: string` 等参数。

### 2.2 原生 Word (.docx) AST 导出引擎 (`src/main/docxExportService.ts`)

1. **依赖技术选型**：使用行业标准、本地运行零外部服务的 `docx` 库。
2. **节点映射协议**：
   - `Heading 1~6` -> `new Paragraph({ heading: HeadingLevel.HEADING_1~6, text: ... })`；
   - `Paragraph` + 行内样式 -> 拆分解析为带有 `bold: true`、`italics: true`、`strike: true` 的 `TextRun`；
   - `CodeBlock` -> 带有浅灰底色底衬、等宽字体（Consolas/Menlo）的独立 `Paragraph`；
   - `Table` -> 原生 `Table` 对象，表头应用加粗与微灰浅色背景填充，单元格具备细边框；
   - `Blockquote` -> 左侧带 3pt 暖灰竖线的引用段落。
3. **落盘与 IPC**：
   - `export:docx`: 打开文件另存为对话框，主进程将 `Packer.toBuffer(doc)` 写入指定 `.docx` 路径。

### 2.3 图片灯箱模态组件 (`src/renderer/components/ImageLightbox.tsx`)

1. **状态模型**：
   - `isOpen: boolean`、`src: string`、`alt: string`；
   - `scale: number`（初始 1.0，区间 0.25 ~ 5.0，滚轮 `scale += delta * 0.1`）；
   - `offset: { x: number, y: number }`（放大状态下鼠标拖拽平移）；
   - `naturalSize: { width: number, height: number }`。
2. **快捷退出响应**：
   - 全局监听 `Escape` 键，点击背景遮罩即可平滑收起。

---

## 3. 任务拆解与 TDD 计划（Task Breakdown）

- [ ] **T509：PDF 出版级分页防断页控制与导出选项模态框** (`exportService.ts`, `ExportModal.tsx` + 单元测试: `tests/unit/pdf-pagination.test.ts`)
- [ ] **T510：原生 Word (.docx) 结构化转换引擎与文件落盘** (`docxExportService.ts` + 单元测试: `tests/unit/docx-exporter.test.ts`)
- [ ] **T511：画布图片沉浸式灯箱与多维手势缩放组件** (`ImageLightbox.tsx`, `MilkdownEditor.tsx` + 单元测试: `tests/unit/image-lightbox.test.tsx`)
- [ ] **T512：出版级导出与灯箱交互全链路 E2E 自动化验收** (Playwright E2E: `tests/e2e/v0.5.0-m3-export-lightbox.spec.ts`)

---

## 4. 验证与验收标准

1. **单元测试门禁**：
   - `tests/unit/pdf-pagination.test.ts`：验证打印样式中 `break-inside: avoid` 与 `break-after: avoid` 正确注入；
   - `tests/unit/docx-exporter.test.ts`：验证 Markdown 文本到 Word AST 的段落、表格、标题、行内样式保真转换；
   - `tests/unit/image-lightbox.test.tsx`：验证灯箱唤起、滚轮缩放倍率夹紧、Esc 键退出与复位。
2. **端到端测试门禁**：
   - `tests/e2e/v0.5.0-m3-export-lightbox.spec.ts`：
     1. 点击编辑器图片，验证灯箱全屏弹出并显示尺寸信息，按 Esc 关闭；
     2. 呼出导出对话框，切换 A4/Letter 与防断页控制，验证 PDF 导出 IPC 顺利触发；
     3. 触发 Word 导出，验证 `.docx` 物理文件成功生成在临时测试目录中。
