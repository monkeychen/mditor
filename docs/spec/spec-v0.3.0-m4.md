# 技术方案规格说明书：v0.3.0-M4 经典多主题视觉系统与主题持久化

## 1. 需求背景与目标

mditor 作为对标 Typora 的极致 Markdown 编辑器，不仅需要强大的排版内核与公式图表渲染能力，还需要提供沉浸舒适的阅读与写作视觉体验。
本里程碑实现 **4 套经典主题** 的无缝切换与持久化：
1. **macOS Light**（默认）：现代极简、原生感强、清爽透亮。
2. **GitHub**：对标 GitHub 风格，浅灰结构边框、标准代码块与紧凑表格。
3. **Night**：对标 Typora 经典深色模式，炭黑底色（`#1E1E1E`）、护眼暗调、高信噪比。
4. **Newsprint**：暖阳米黄羊皮纸底色（`#F6F3ED`），经典报刊衬线排版，适合长文深度阅读。

---

## 2. 关键架构设计与技术决策

| 决策点 | 选定方案 | 为什么这么选 | 对用户的影响 |
|---|---|---|---|
| **主题切换机制** | 根元素 CSS 变量驱动（`data-theme="night"`） | 通过在根容器设置 `data-theme` 属性并切换 CSS Variable，无需销毁或重载 Milkdown / CodeMirror 实例。 | **零卡顿（耗时 < 10ms）**；光标位置、选区、滚动高度与 Undo/Redo 历史 100% 保持。 |
| **源码模式联动** | CodeMirror 6 Theme Compartment 动态注入 | 使用 CodeMirror 的 `Compartment` 动态切换编辑器高亮扩展，深色模式自动下发 dark theme。 | 所见即所得与源码模式在任意主题下均保持视觉完全一致。 |
| **持久化存储** | 本地配置持久化（Key: `mditor:theme`） | 启动时同步读取生效，避免出现主题闪烁（FOUC）。 | 下次打开应用或新建窗口自动继承上次使用的主题。 |
| **交互入口** | 状态栏快捷切换器 + 顶部视图菜单 | 状态栏右下角提供直观的主题选择 Popover，点击即换。 | 直观易达，无需去深层设置页寻找。 |

---

## 3. 主题色彩系统定义

### 3.1 CSS Variables 变量规范

```css
:root, [data-theme="macos-light"] {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F9FAFB;
  --bg-sidebar: rgba(248, 250, 252, 0.85);
  --text-primary: #1F2937;
  --text-secondary: #6B7280;
  --border-color: #E5E7EB;
  --accent-color: #2563EB;
  --code-bg: #F3F4F6;
  --table-header-bg: #F3F4F6;
  --font-family-body: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
}

[data-theme="github"] {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F6F8FA;
  --bg-sidebar: #F6F8FA;
  --text-primary: #24292F;
  --text-secondary: #57609A;
  --border-color: #D0D7DE;
  --accent-color: #0969DA;
  --code-bg: #F6F8FA;
  --table-header-bg: #F6F8FA;
  --font-family-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}

[data-theme="night"] {
  --bg-primary: #1E1E1E;
  --bg-secondary: #252526;
  --bg-sidebar: #181818;
  --text-primary: #D4D4D4;
  --text-secondary: #858585;
  --border-color: #3C3C3C;
  --accent-color: #3B82F6;
  --code-bg: #2D2D2D;
  --table-header-bg: #2D2D2D;
  --font-family-body: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
}

[data-theme="newsprint"] {
  --bg-primary: #F6F3ED;
  --bg-secondary: #EFEBE4;
  --bg-sidebar: #ECE7DF;
  --text-primary: #2C2621;
  --text-secondary: #70685E;
  --border-color: #DDD6CA;
  --accent-color: #B45309;
  --code-bg: #EAE4D9;
  --table-header-bg: #EAE4D9;
  --font-family-body: "Georgia", "Times New Roman", "Songti SC", serif;
}
```

---

## 4. 任务分解与门禁计划（TDD）

- **T401（单测）**：主题管理器状态与持久化逻辑测试（验证设置主题、读取默认、跨会话同步）。
- **T402（单测）**：主题 CSS 变量切换与 DOM 属性联动测试（验证 `data-theme` 属性与深色判定）。
- **T403（集成测试）**：WYSIWYG 与源码模式主题同步切换，验证切换耗时 < 50ms。
- **T404（真机 E2E）**：Playwright 测试在 4 种主题间来回切换，验证背景色/文字色实际计算样式，重启应用后主题自动恢复。
