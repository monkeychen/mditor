---
doc: spec
product: v0.1.0
milestone: m2
date: 2026-10-25
status: approved
---

# spec-v0.1.0-m2: 多标签页系统、本地图片自动落盘与大纲导航

## 1. 本里程碑目标与覆盖的 F/AC

### 目标
完成多标签页（Tabs）管理系统，支持多文档并行编辑与未保存阻断确认；实现粘贴与拖拽图片的自动落盘管道（保存到当前文档所在目录的 `./assets/`）与行内图片实时渲染；实现可折叠的文档大纲（TOC）抽屉与双向滚动联动。

### 覆盖功能与验收标准
- **F1 (全部闭环)**：AC1.2（多标签页、未保存圆点、关闭按钮）、AC1.3（快捷键 Cmd+T/Cmd+W/Cmd+1..9/Cmd+Shift+[]）、AC1.4（未保存关闭阻断确认框）。
- **F4 (全部闭环)**：AC4.1（剪贴板图片粘贴自动保存至 `./assets/` 并插入语法）、AC4.2（外部图片拖拽自动拷贝）、AC4.3（编辑器内嵌图片实时卡片渲染）。
- **F5 (全部闭环)**：AC5.1（H1-H6 标题大纲提取）、AC5.2（点击平滑定位）、AC5.3（视口滚动自动高亮当前章节）、AC5.4（Cmd+Shift+O 抽屉折叠/展开）。

---

## 2. 关键功能设计思路

### 2.1 多标签页（Tabs）系统
- **状态模型**：
  - `tabs: TabItem[]`，每个 Tab 包含唯一 `id`、`filePath`、`fileName`、`content`、`isDirty`、`saveStatus`、`cursorLine`、`cursorCol`。
  - `activeTabId: string` 指向当前正在编辑的 Tab。
- **未保存保护机制**：
  - 当用户点击关闭按钮或按 `Cmd+W` 关闭某个 `isDirty: true` 的标签时，拦截关闭动作，调起原生或精致模态对话框，提供「保存」、「不保存（放弃）」、「取消」三个选项。
- **快捷键分发**：
  - `Cmd+T`：追加一个新 `Untitled.md` 并自动聚焦。
  - `Cmd+W`：关闭当前激活的 Tab（若仅剩一个 Tab，则关闭后自动重置为新的空白文档）。
  - `Cmd+1..9`：直达对应索引序号的标签页。
  - `Cmd+Shift+[` / `Cmd+Shift+]`：在标签栏前后轮换。

### 2.2 本地图片自动落盘管道（Local Image Pipeline）
- **落盘策略**：
  - 若当前文档已在磁盘保存（`filePath !== null`），图片目标目录为文档同级目录下的 `./assets/`；
  - 若当前文档未保存（`filePath === null`），图片目标目录为全局缓存目录（如 `~/.mditor/cache/assets/`）。
- **图片命名规约**：`img-YYYYMMDD-HHmmss-[random4].png`，避免重名覆盖。
- **粘贴拦截**：
  - CodeMirror 6 编辑器配置 `EditorView.domEventHandlers` 监听 `paste` 事件；
  - 检查 `event.clipboardData.items` 中是否存在 `image/*`；
  - 若存在，提取图片 Blob 数据转换为 Buffer，通过 IPC 发送至主进程 `image:saveBuffer`；
  - 主进程完成写盘后返回相对路径（如 `./assets/img-20261025-200530.png`）；
  - 编辑器在当前光标处派发事务插入 `![image](./assets/img-20261025-200530.png)`。
- **内嵌图片渲染 Widget**：
  - 语法树检测到 `Image` 节点时，当光标不在该节点行时，施加 `Decoration.replace` 挂载 `ImageWidget`；
  - 展示具备 max-width 约束、圆角与优雅阴影的图片卡片；光标移入该行时恢复原始 Markdown 语法供编辑。

### 2.3 文档结构大纲（Outline / TOC）抽屉导航
- **大纲提取器**：
  - 纯函数 `extractOutline(text: string): OutlineItem[]`；
  - 遍历 Markdown 标题语法（`#` 至 `######`），提取标题等级（1-6）、标题文本、所在行号及文档偏移位置。
- **双向联动**：
  - **点击定位**：点击大纲项，派发 CodeMirror 事务将光标定位至对应位置并调用 `scrollIntoView`。
  - **滚动视口跟踪**：编辑器视口滚动时，根据视口首行所在行号，在侧边栏高亮最近的对应大纲项。
- **抽屉组件**：
  - 位于左侧，宽度 240px，支持点击顶部工具栏图标或按 `Cmd+Shift+O` 平滑推移展开/收起。

---

## 3. 数据模型与接口定义

### 3.1 核心类型
```typescript
export interface TabItem {
  id: string;
  filePath: string | null;
  fileName: string;
  content: string;
  isDirty: boolean;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  cursorLine: number;
  cursorCol: number;
}

export interface OutlineItem {
  id: string;
  level: number; // 1 - 6
  text: string;
  line: number;
  from: number;
}

export interface SaveImageResult {
  success: boolean;
  relativePath: string;
  absolutePath: string;
  error?: string;
}
```

### 3.2 Preload IPC 扩展
```typescript
export interface ElectronAPI {
  // 原有方法保持兼容
  openFile: () => Promise<FileOpenResult | null>;
  saveFile: (filePath: string, content: string) => Promise<FileSaveResult>;
  saveFileAs: (defaultName: string, content: string) => Promise<FileOpenResult | null>;
  // M2 新增
  saveImageBuffer: (docDir: string | null, buffer: ArrayBuffer, ext?: string) => Promise<SaveImageResult>;
  copyLocalImage: (docDir: string | null, sourcePath: string) => Promise<SaveImageResult>;
}
```

---

## 4. 关键决策记录

| 决策点 | 选定方案 | 为什么这么选 | 对用户的影响 | 放弃了什么 |
|---|---|---|---|---|
| **图片存储位置** | **文档同级 `./assets/` 相对路径** | Markdown 业界事实标准（如 Typora/Obsidian 最通用规范），文档拷贝或迁移目录时，只需带上 assets 即可保持所有图片链接有效。 | 本地管理极其清晰透明，文章导出发给他人不会丢图。 | 放弃了乱序平铺在同级目录（会污染根目录）或强制 base64 内嵌（会导致 md 文件极大）。 |
| **标签页状态隔离** | **多 Tab 独立实例状态机** | 每个 Tab 拥有独立 `isDirty` 与防抖定时器，互不干扰。 | 在一个标签中疯狂打字不会影响另一个标签的自动保存队列。 | 放弃了单例共享状态。 |
| **大纲导航定位** | **直接驱动 CodeMirror 视口 API** | CodeMirror 6 原生 `scrollIntoView` 会自动处理折叠与视口边界。 | 点击大纲跳转极其顺滑，光标直接吸附到标题起始处。 | 放弃了 DOM `scrollIntoView`（因虚拟滚动容易找不到离屏 DOM 节点）。 |

---

## 5. 测试策略

### 5.1 单元测试（Vitest）
- `tests/unit/tabs-manager.test.ts`：
  - 测试创建 Tab、切换 Tab、关闭 Tab。
  - 测试未保存关闭阻断逻辑（需要确认）。
  - 测试快捷键索引映射（Cmd+1..9 边界与越界保护）。
- `tests/unit/outline.test.ts`：
  - 测试各种嵌套深度的 Markdown 标题提取（跳级标题如 H1 直接接 H3 的容错）。
  - 测试标题内含有强调符、代码符时的纯文本清洗（如 `## **Important** \`Code\`` 提取为 `Important Code`）。
- `tests/unit/image-pipeline.test.ts`：
  - 测试图片名称生成格式合法性。
  - 测试未保存文档与已保存文档的目标路径计算。

### 5.2 集成测试
- `tests/integration/image-service.test.ts`：
  - 在真实临时目录中写入图片 Buffer，验证 `./assets/` 目录被自动创建，图片文件成功落盘，返回的相对路径可读。

### 5.3 E2E 自动化测试（Playwright）
- `tests/e2e/m2-flow.spec.ts`：
  - 启动真机 Electron 桌面窗口。
  - 验证多标签页切换与新建（按 `Cmd+T` 产生第 2 个 Tab，验证两个 Tab 的切换与各自独立的标题）。
  - 验证点击大纲切换按钮呼出左侧大纲抽屉，大纲中列出文档内的标题项，点击标题触发滚动跳转。

---

## 6. Task 拆分

| Task 编号 | 内容与交付物 | 覆盖 AC | 依赖 | 状态 |
|---|---|---|---|---|
| **T1** | 开发多标签页（Tabs）管理系统与快捷键支持（Cmd+T/Cmd+W/Cmd+1..9），支持未保存阻断确认弹窗 | AC1.2, AC1.3, AC1.4 | M1 | 已完成 (TabBar + useTabs + 未保存拦截单测全通) |
| **T2** | 实现文档大纲（Outline / TOC）提取算法与左侧可折叠抽屉组件（Cmd+Shift+O），支持点击平滑定位与视口高亮 | AC5.1, AC5.2, AC5.3, AC5.4 | M1 | 已完成 (大纲提取算法与抽屉交互单测全通) |
| **T3** | 实现本地图片自动落盘主进程服务（`./assets/` 自动生成）与 Preload IPC 契约（含集成测试） | AC4.1, AC4.2 | M1 | 待开始 |
| **T4** | 开发 CodeMirror 6 图片粘贴拦截与内嵌图片卡片实时渲染插件（ImageWidget） | AC4.1, AC4.2, AC4.3 | T3 | 待开始 |
| **T5** | 编写并执行 M2 全量自动化测试（单元 + 集成 + Playwright E2E），输出验收记录 | 全部 M2 AC | T1-T4 | 待开始 |

---

## 7. 界面与 F/AC 映射及视觉规范

### 7.1 原型与 F/AC 映射
- **顶部标签栏（Tabs Bar）**：覆盖 `AC1.2, AC1.3, AC1.4`，融入无标题栏 Header 下方或直接集成在 Header 避让区之后；标签页带有关闭微交互、激活高亮背景与未保存提示圆点。
- **左侧大纲抽屉（Outline Drawer）**：覆盖 `AC5.1 ~ AC5.4`，宽度 240px，轻微磨砂背景与右侧 1px 分割线，根据 H1-H6 缩进（pl-2 至 pl-8），激活项带有琥珀色条与背景。
- **编辑区图片卡片（Embedded Image Card）**：覆盖 `AC4.3`，图片自适应宽度最大 100%，具备 8px 圆角与微弱边框，底部展示优雅的小字号 caption。
