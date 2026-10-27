---
doc: release
product: v0.3.1
milestone: -
date: 2026-10-27
status: approved
---

# Release Note - mditor v0.3.1：KaTeX 原型级公式编辑器、Windows 升级体验优化与 CI 自动化发布门禁

mditor v0.3.1 是针对数学公式写作体验与发布工程化的重要补丁版本。本版本全面对齐了 KaTeX 数学公式系统的设计原型，解决了事件穿透与编辑体验缺失问题，同时优化了 Windows 覆盖安装体验并加固了云端跨平台发布流水线。

---

## 1. 变更记录 (Changelog)

### Fixed
- **KaTeX 数学公式系统编辑体验与原型视觉 100% 对齐**：
  - **双模式公式分立入口与 AST 归一化**：
    - **工具栏清晰分立双入口**：工具栏拆分为「独立公式块 (SquareSigma / `⌥⌘M`)」与「行内公式 (Sigma / `$formula$`)」，杜绝大公式被错误挤压进单行浮窗的交互陷阱；
    - **AST 级单行公式归一化**：解决 remark-math 将独占一行的 `$$...$$` 降级解析为 inlineMath 的缺陷，AST 访问器自动将单行段落内的 `$$...$$` 纠偏提升为独立的 `math_block` 节点；
    - **快捷键智能分流**：`⌥⌘M` 选中文字时包裹为行内公式，未选中文本或新行时插入独立公式块；在新行输入 `$$` 按回车或输入 `$$ ` 立即替换为独立公式块。
  - **独立公式块（Math Block）**：
    - **折叠展示态**：完全还原高保真原型卡片，居中高精公式排版，底部增加 `TeX 源码: ...` 与 `点击展开交互编辑面板 ▾` 触发器；
    - **展开编辑态**：完全对齐设计原型布局，包含顶部蓝调标题栏（`📐 独立公式块编辑器` + `DisplayMode` 徽章 + `复制代码` / `收起 ✕`）、多行 LaTeX 编辑文本域、**正下方独立实时公式矢量预览卡片**以及右下角 `完成` 动作按钮；
    - **事件与输入隔离**：引入 `stopEvent` 与 `ignoreMutation`，在编辑时彻底阻断退格（Backspace）、回车（Enter）与鼠标拖拽冒泡至 ProseMirror，彻底根除按键导致公式节点被意外删除或光标失焦的严重缺陷。
  - **行内公式（Inline Math）**：
    - 点击行内公式原地弹出高保真悬浮编辑卡片（`✏️ 正在编辑行内 LaTeX 公式`）；
    - 支持 `$` 包裹输入框、`应用` / `取消` 快捷按钮、以及下方的 `实时预览` 矢量渲染槽；
    - 新增 `$formula$` 输入规则：在段落中键入 `$formula$` 闭合后自动即时转换为行内公式。

- **顶栏分层解耦与可折叠编辑工具栏（Dual-tier Header & Folding Toolbar）**：
  - **第一层 Window & TabBar**：顶栏纯净化为 40px 高度会话管理栏，左侧避让 macOS 交通灯并放置原生侧边栏开关（`PanelLeft`，联动切换「文件树」与「大纲」），中间 TabBar 拥有自适应全宽横向展开空间与空白拖拽区，右侧仅保留工具栏显隐切换按钮（`PanelTop`，`⌘⇧T`）；
  - **第二层 Document Toolbar**：在 TabBar 正下方建立独立的 36px 文档编辑专属工具条，包含清晰的逻辑分组（插入表格/公式、排版主题、查找替换、文件打开/保存/导出）；
  - **一键折叠沉浸式打字**：点击工具栏右侧「收起」按钮或按下快捷键 `⌘⇧T`，编辑工具栏平滑折叠至高度 0，瞬间回归 Typora 100% 极简纯净写作画布。

- **Windows NSIS 覆盖升级与旧版检测体验**：
  - 新增 Windows 安装前旧版本自动检测机制（`resources/installer.nsh`）；
  - 检测到旧版本时，提前弹出友好系统确认框，明确告知用户「将自动清理旧版程序文件，文档数据与个人设置完好保留」；
  - 显式锁定 `deleteAppDataOnUninstall: false`，杜绝覆盖安装或更新过程中损伤 `%APPDATA%\mditor` 下的用户本地数据与偏好配置。

- **CI/CD 云端多平台自动化发布流水线加固**：
  - 重构 `.github/workflows/release.yml`，在多平台 Matrix 构建前增加单节点 `prepare-release`，先行向 GitHub API 创建唯一的 Draft Release 作为锚点，彻底根除 macOS、Windows、Ubuntu 三节点并发竞争导致的产物分裂；
  - 在 `finalize-release` 中引入全平台资产完整性硬门禁校验（严格断言 `.dmg`、`.exe`、`.AppImage` 必须全部就位），自动化杜绝半成品发布。

---

## 2. 交付物清单与获取方式

- **GitHub Release 跨平台安装包**（由云端 CI 针对 `v0.3.1` Tag 自动多平台编译生成）：
  - macOS: `mditor-0.3.1-universal.dmg`, `mditor-0.3.1-mac.zip`
  - Windows: `mditor-Setup-0.3.1.exe`, `mditor-0.3.1-win.portable.exe`
  - Linux: `mditor-0.3.1.AppImage`, `mditor_0.3.1_amd64.deb`
- **源码仓库**：`git clone git@github.com:monkeychen/mditor.git && git checkout v0.3.1`

---

## 3. 验收汇总

- **测试全量自动化通过**：
  - 48 个测试套件，144 个单元与保真度测试全部通过（`npm run test`）；
  - 13 个 Playwright 真机端到端测试 100% 通过（`npx playwright test`），覆盖公式输入、抽屉展开、实时预览联动、模式切换保真度；
  - Vite 渲染进程与 TypeScript 主进程构建无报错通过。
