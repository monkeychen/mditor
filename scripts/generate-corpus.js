import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const corpusDir = path.resolve(__dirname, '../tests/fidelity/corpus');

const samples = {
  '01-heading-atx.md': '# 标题一\n\n## 标题二\n\n### 标题三\n\n#### 标题四\n\n##### 标题五\n\n###### 标题六',
  '02-heading-content.md': '# 标题文本\n\n正文第一段。\n\n## 二级标题文本\n\n正文第二段。',
  '03-list-bullet-dash.md': '- 列表项一\n- 列表项二\n- 列表项三',
  '04-list-bullet-nested.md': '- 一级列表项\n  - 二级列表项 A\n  - 二级列表项 B\n- 一级列表项二',
  '05-list-ordered.md': '1. 第一项\n2. 第二项\n3. 第三项',
  '06-list-task.md': '- [x] 已完成任务\n- [ ] 待办任务 A\n- [ ] 待办任务 B',
  '07-emphasis-star.md': '这是**加粗文字**，这是*斜体文字*，这是***粗斜体***。',
  '08-emphasis-inline-mixed.md': '正常文本与**加粗**以及*斜体*交织排版。',
  '09-strikethrough.md': '这是~~被删除的文字~~，正常文字。',
  '10-blockquote-simple.md': '> 这是一段简单的单行引用。',
  '11-blockquote-multiline.md': '> 第一行引用内容。\n>\n> 第二行引用内容。',
  '12-code-fenced-js.md': '```javascript\nfunction hello() {\n  return "world";\n}\n```',
  '13-code-fenced-ts.md': '```typescript\ninterface User {\n  id: string;\n  name: string;\n}\n```',
  '14-code-inline.md': '使用 `console.log()` 打印调试信息，或者调用 `init()`。',
  '15-table-simple.md': '| 姓名 | 年龄 | 角色 |\n| --- | --- | --- |\n| 张三 | 28 | 工程师 |\n| 李四 | 32 | 设计师 |',
  '16-table-alignment.md': '| 靠左对齐 | 居中对齐 | 靠右对齐 |\n| :--- | :---: | ---: |\n| A | B | 100 |\n| X | Y | 200 |',
  '17-link-inline.md': '访问 [GitHub](https://github.com) 查看更多开源项目。',
  '18-link-with-title.md': '访问 [OpenAI](https://openai.com "人工智能官网") 首页。',
  '19-image-relative.md': '![架构示意图](./assets/architecture.png)',
  '20-image-web.md': '![在线图标](https://example.com/logo.png)',
  '21-hr-dashes.md': '前置正文段落。\n\n---\n\n后置正文段落。',
  '22-mixed-typography.md': '# 写作之道\n\n> 保持专注，消除干扰。\n\n写作是思考的**具象化**表达。\n\n---\n\n- [x] 列大纲\n- [ ] 起草正文',
  '23-paragraph-break.md': '第一段文字。\n\n第二段文字。\n\n第三段文字。',
  '24-code-block-python.md': '```python\ndef greet(name):\n    print(f"Hello, {name}")\n```',
  '25-table-single-column.md': '| 项目 |\n| --- |\n| 任务 1 |\n| 任务 2 |',
  '26-nested-quote-in-list.md': '- 列表项一\n- 列表项二：\n  > 嵌套在列表里的引用',
  '27-inline-html.md': '文本中包含 <kbd>⌘S</kbd> 快捷键提示。',
  '28-complex-article.md': '# mditor 设计哲学\n\n## 1. 原生级打字手感\n\n拒绝任何打字跳动。\n\n| 方案 | 效果 |\n| --- | --- |\n| 纯文本装饰器 | 易跳变 |\n| 块模型 ProseMirror | 绝不跳变 |\n\n> 用户体验高于技术偏好。',
  '29-mixed-formatting.md': '测试带有 `行内代码` 和 **加粗** 的组合行。',
  '30-comprehensive-doc.md': '# 全要素综合文档\n\n正文描述。\n\n## 功能清单\n\n- [x] 核心骨架\n- [x] 双模式切换\n- [ ] 表格工具栏\n\n```json\n{\n  "version": "0.2.0"\n}\n```\n\n| 平台 | 状态 |\n| --- | --- |\n| macOS | 良好 |\n| Windows | 良好 |',
};

if (!fs.existsSync(corpusDir)) {
  fs.mkdirSync(corpusDir, { recursive: true });
}

for (const [filename, content] of Object.entries(samples)) {
  const filePath = path.join(corpusDir, filename);
  fs.writeFileSync(filePath, content + '\n', 'utf8');
}

console.log(`Generated ${Object.keys(samples).length} corpus files in ${corpusDir}`);
