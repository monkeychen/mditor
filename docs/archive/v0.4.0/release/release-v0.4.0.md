---
doc: release
product: v0.4.0
milestone: -
date: 2026-10-27
status: approved
---

# Release Note - mditor v0.4.0：偏好设置面板、跨平台工作区文件管理与全能文本代码引擎

mditor v0.4.0 是一个里程碑式的大版本更新。本版本引入了对标 macOS 原生软件体验的**独立偏好设置面板 (`⌘,`)**，实现了**跨平台工作区文件树上下文管理与安全回收机制**，并全面升级为支持打开与高亮 20 余种主流编程语言与配置文本的**全能文本代码引擎**。

---

## 1. 核心特性与变更记录 (Changelog)

### Added
- **macOS 原生风格偏好设置面板（Preferences Panel，`⌘,` / `Ctrl+,`，F27）**：
  - **全局快捷唤起**：支持 `⌘,` (macOS) / `Ctrl+,` (Win/Linux) 或点击顶栏「设置」按钮弹出磨砂微透模态面板，支持 `Esc` 键或遮罩点击平滑关闭；
  - **三级分类配置项**：
    - **外观 (Appearance)**：4 大经典排版主题（macOS Light 现代简约、GitHub 官方排版、Night 暗黑深炭灰、Newsprint 羊皮纸）即时切换，支持色彩模式（跟随系统 / 浅色 / 深色）；
    - **编辑器 (Editor)**：正文字号（13px ~ 20px 精细调节）、画布最大行宽（720px 紧凑 / 860px 黄金比例 / 1024px 宽屏 / 100% 铺满）、行高比例（1.5 / 1.6 / 1.75 / 1.8）、正文字体族（系统默认 SF Pro / 无衬线 Inter / 衬线宋体 Georgia）、代码块等宽字体（SF Mono / JetBrains Mono / Fira Code）；
    - **文件与保存 (Files & Storage)**：自动保存策略（关闭 / 1秒 / 5秒 / 失焦时保存）、启动时自动恢复工作区目录与打开的文件；
  - **CSS 变量即时热重载（Zero-Reload）**：改动立即注入 DOM 变量生效，无需重启应用，本地存储无感自动持久化。

- **跨平台工作区文件树右键上下文管理与安全回收（Workspace Context Menu，F28）**：
  - **多层级右键菜单**：在侧边栏工作区根目录、子目录与文件项上右键，弹出原生风格上下文菜单：
    - **新建文件 / 新建文件夹**：原地触发内联输入框，输入名称回车即时在磁盘创建，新建文件自动以新 Tab 激活打开；
    - **原地重命名 (Rename)**：原地转换为内联输入框，失焦或回车完成重命名，若该文件正在打开，自动实时同步 Tab 标题与文件路径；
    - **安全移入废纸篓 / 回收站 (Move to Trash)**：严格调用 Electron `shell.trashItem` 原生能力（macOS 废纸篓、Windows 回收站、Linux Trash 规范），**严禁使用 `fs.unlink` 硬删除**；被删除文件若已打开，自动无弹窗安全关闭对应 Tab；
    - **在系统文件管理器中显示 (Reveal in Finder / Explorer)**：macOS 映射「在访达中显示」、Windows 映射「在文件资源管理器中显示」，一键精确定位磁盘文件；
    - **复制路径**：支持一键复制绝对路径（`Copy Path`）或相对路径（`Copy Relative Path`）。
  - **跨平台快捷键与防御门禁**：
    - 针对 Windows 系统自动防御非法字符（`\ / : * ? " < > |`）与保留名（`CON`, `PRN`, `AUX`, `NUL` 等），输入非法字符时轻量 Toast 友好拦截，杜绝写入崩溃；
    - 路径斜杠跨平台自动归一化处理。

- **全能轻量文本文档与主流编程语言代码高亮引擎（Universal Text & Code Engine，F29）**：
  - **全面扩展格式支持池**：解除侧边栏文件树与打开对话框的 Markdown 格式限制，支持直接查看与编辑 20+ 主流文档与编程语言：
    - **Markdown 类**：`.md`、`.markdown`、`.mdown`
    - **通用编程语言**：Python (`.py`), Java (`.java`, `.kt`), Go (`.go`), Rust (`.rs`), C/C++ (`.c`, `.cpp`, `.h`), C# (`.cs`), SQL (`.sql`), Shell (`.sh`, `.bash`, `.zsh`)
    - **数据配置与 Web**：JSON (`.json`, `.jsonc`), YAML (`.yaml`, `.yml`), TOML (`.toml`), XML (`.xml`), HTML, CSS, JS, TS, Dockerfile
    - **普通文本与日志**：`.txt`, `.log`, `.diff`, `.patch`
  - **智能模式路由（Smart Mode Routing）**：
    - 打开 Markdown 文档：保持默认双模式（即时渲染 + `⌘/` 纯源码）；
    - 打开代码或配置文档：**自动锁定进入 CodeMirror 6 源码模式**，模式切换按钮智能禁用并明确反馈；
    - 状态栏与侧边栏智能展示专属语言彩色图标与语言标签（Python / JSON / SQL / Java 等）。

### Fixed
- **窗口最大化与全屏状态下顶栏间距自适应修复**：
  - 监听主进程窗口最大化与全屏事件，当窗口在非 macOS 或处于最大化/全屏状态时，自适应收起原用于避让交通灯的 70px 空白占位，Tab 标签与大纲开关平滑靠左对齐，彻底消除空白断层。

---

## 2. 自动化门禁与验证汇总

本版本严格遵循 Vibe-Coding 与 TDD 工作流，全流程测试 100% 通过：
- **单元与保真度测试**：57 个测试套件，**188 项单元测试全数通过**（覆盖文件名防御校验、偏好设置热更新、跨平台上下文事件分发、代码语法高亮分流等）；
- **端到端测试（Playwright E2E）**：**17 项真机端到端测试全数通过**（覆盖偏好设置面板字号/行宽/主题实时热载与持久化、侧边栏右键内联新建/重命名/安全移入回收站/Tab联动、多语言打开与智能模式锁定等）；
- **构建检查**：Vite 生产打包与 TypeScript 静态类型检查 0 错误通过。

---

## 3. 交付物与源码获取

- **源码标签**：`git clone git@github.com:monkeychen/mditor.git && git checkout v0.4.0`
- **跨平台二进制包**（由云端 CI 针对 `v0.4.0` Tag 自动多平台多架构编译构建挂载）：
  - macOS: `mditor-0.4.0-universal.dmg`, `mditor-0.4.0-mac.zip`
  - Windows: `mditor-Setup-0.4.0.exe`, `mditor-0.4.0-win.portable.exe`
  - Linux: `mditor-0.4.0.AppImage`, `mditor_0.4.0_amd64.deb`
