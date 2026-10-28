# 技术规格说明书：v0.4.0 - 里程碑 M3：偏好设置面板与全量发版门禁

**版本**：v0.4.0  
**里程碑**：M3  
**状态**：Pending Review  
**责任模块**：偏好设置面板 (`PreferencesModal.tsx`)、设置存储与热更新服务 (`settingsService.ts`)、自动化回归与发版构建  

---

## 1. 目标与范围

本里程碑聚焦 **F27（macOS 原生风格偏好设置面板 Preferences Panel）** 与 **v0.4.0 全量发版回归**：
1. **偏好设置面板 (`PreferencesModal.tsx`)**：
   - 支持 `⌘,` (macOS) / `Ctrl+,` (Windows/Linux) 全局快捷键呼出与 `Esc` / 遮罩点击关闭；
   - 包含三级分类导航：**外观（Appearance）**、**编辑器（Editor）**、**文件与保存（Files & Storage）**；
2. **实时热更新与样式变量注入 (`settingsService.ts`)**：
   - 设置项改动即时通过 CSS 变量（`--editor-font-family`, `--editor-font-size`, `--editor-line-height`, `--editor-max-width`, `--editor-code-font`）注入 DOM 生效，编辑画布即时重排，**无需重启或刷新页面**；
   - 自动持久化存储至 `localStorage`（键名 `mditor_preferences`），应用冷启动即刻恢复；
3. **文件与自动保存引擎联动**：
   - 支持配置自动保存（关闭 / 1秒 / 5秒 / 失焦时保存）；
   - 启动时自动恢复已打开工作区及标签页开关；
4. **全量构建与发版验证**：
   - 跑通全部单元测试、保真度测试与端到端测试；
   - 确认版本号提升至 `0.4.0`。

---

## 2. 详细技术方案

### 2.1 偏好设置数据结构定义

```ts
export interface EditorPreferences {
  // 外观 Appearance
  theme: 'github' | 'dark' | 'sepia' | 'typewriter';
  colorScheme: 'light' | 'dark' | 'system';
  
  // 编辑器排版 Editor
  fontFamily: 'system' | 'sans-serif' | 'serif';
  fontSize: number; // 13, 14, 15, 16, 18, 20
  lineHeight: number; // 1.5, 1.6, 1.75, 1.8
  maxWidth: number | '100%'; // 720, 860, 1024, '100%'
  codeFontFamily: 'monospace' | 'jetbrains-mono' | 'fira-code' | 'sf-mono';
  showCodeLineNumbers: boolean;

  // 文件与保存 Files
  autoSaveDelay: number; // 0 (关闭), 1000 (1秒), 5000 (5秒), -1 (失焦时保存)
  restoreLastSession: boolean;
}
```

### 2.2 DOM CSS 变量注入机制

设置热更新时通过 `applyPreferencesToDOM(prefs)` 直接向 `document.documentElement.style` 写入：
- `--editor-font-family`: 映射具体字体堆栈（如 SF Pro, PingFang SC, -apple-system 等）；
- `--editor-font-size`: `${prefs.fontSize}px`；
- `--editor-line-height`: `${prefs.lineHeight}`；
- `--editor-max-width`: `maxWidth === '100%' ? '100%' : `${maxWidth}px``；
- `--editor-code-font`: 映射代码等宽字体堆栈。

Milkdown 编辑器容器与 CodeMirror 源码容器统一引用 CSS 变量：
`max-w-[var(--editor-max-width,860px)]`、`text-[var(--editor-font-size,16px)]`、`leading-[var(--editor-line-height,1.6)]`。

### 2.3 快捷键绑定与模态窗交互规范

- 全局监听 `(e.metaKey || e.ctrlKey) && e.key === ','` 打开偏好设置模态窗；
- 模态窗位于 `z-50` 顶层，背景带有 `backdrop-blur-sm bg-black/30` 微透磨砂遮罩；
- 窗口支持 macOS 风格经典选项卡（Tab 切换栏），点击侧边栏或顶部选项卡无闪烁切换设置页；
- 按 `Escape` 键或点击遮罩边缘平滑收起。

---

## 3. 任务拆解与 TDD 计划（Task Breakdown）

- [x] **T409：偏好设置模型、本地存储与 DOM CSS 变量热更新服务** (`settingsService.ts` + 单元测试)
- [x] **T410：偏好设置模态组件与外观/编辑器/保存设置项交互** (`PreferencesModal.tsx` + 单元测试)
- [x] **T411：App 宿主快捷键呼出 (`⌘,`)、画布排版联动与自动保存引擎** (`App.tsx`, `MilkdownEditor.tsx`, `SourceEditor.tsx`)
- [x] **T412：版本升级至 v0.4.0、端到端测试与全量自动化门禁** (Playwright E2E: `v0.4.0-m3-preferences.spec.ts` + 全量 CI 门禁)

---

## 4. 验证与验收标准

1. **单元测试门禁**：
   - `tests/unit/settings-service.test.ts`：验证默认偏好加载、偏好项深合并、localStorage 读写容错、DOM 变量热更新注入；
   - `tests/unit/preferences-modal.test.tsx`：验证设置项切换、字号/行高/最大行宽数值更新、自动保存策略切换、Escape 与关闭按钮触发；
2. **端到端测试门禁**：
   - `tests/e2e/v0.4.0-m3-preferences.spec.ts`：
     1. 按快捷键 `⌘,` 唤起偏好设置面板；
     2. 切换字号至 18px，验证画布文字尺寸即时更新；
     3. 切换行宽至 1024px，验证编辑器容器宽度即时扩展；
     4. 刷新页面，验证修改后的设置依然生效（持久化检验）；
     5. 关闭设置面板。
