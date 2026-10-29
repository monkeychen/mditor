---
doc: release
product: v0.5.1
milestone: -
date: 2026-10-29
status: approved
---

# Release Note - mditor v0.5.1：系统原生 Help 菜单增强与偏好设置「关于」信息面板

mditor v0.5.1 是一个聚焦于开源透明度与桌面系统级规范体验的体验增强版本。本版本全面构建了对齐 macOS / Windows / Linux 桌面规范的**系统原生应用菜单系统**，在「Help」菜单中正式呈现版本号、开源项目地址与作者联络通道，并在应用偏好设置（`⌘,`）中引入了精致沉浸的「关于 (About)」面板。

---

## 1. 核心特性与变更记录 (Changelog)

### Added
- **系统原生 Help 菜单增强（Native Help Menu，F38 / AC-38.1 ~ AC-38.2）**：
  - **原生标准挂载**：在系统顶栏应用菜单（macOS 顶栏、Windows/Linux 窗口菜单）中规范挂载 **Help (帮助)** 菜单；
  - **版本号显式呈现**：内置 `版本: v0.5.1` 条目，点击可直观呼出原生关于对话框；
  - **项目官方仓库一键直达**：提供 `项目地址: https://github.com/monkeychen/mditor`，点击自动通过主进程安全调用系统默认浏览器打开 GitHub 主页；
  - **作者联络渠道**：提供 `作者: 陈志安 (Mail: cza55007@gmail.com)`，点击自动唤起系统邮件客户端撰写邮件；
  - **系统级关于面板**：macOS 平台集成 `app.setAboutPanelOptions`，Windows/Linux 平台弹出原生信息卡片，呈现产品介绍与开源信息。

- **内置偏好设置「关于」面板（Preferences About Panel，F38 / AC-38.3）**：
  - **独立选项卡导航**：在偏好设置面板（`⌘,`）新增第 4 项「关于 (About)」选项卡；
  - **高保真品牌卡片**：展示 mditor 琥珀金精致圆角 App 徽章、当前动态版本号、产品标语定位、带外部链接图标的 GitHub 官方主页链接以及作者邮箱直达按钮；
  - **安全协议白名单**：建立主进程严格的 URL 协议过滤机制（仅允许 `https:` / `http:` / `mailto:`），防御潜在注入风险。

### Changed
- **全局版本号统一管理**：
  - 重构前端与偏好设置组件版本展示，由全局单源常量 `APP_VERSION` 与 Electron 原生 `app.getVersion()` 统一分发，彻底消除散落硬编码与版本失步问题。

---

## 2. 自动化门禁与验证汇总

本版本严格遵循 Vibe-Coding 与 TDD 工作流，全流程测试 100% 自动化通过：
- **单元测试**：68 个测试套件，**249 项单元测试全数通过**（覆盖 Help 菜单项结构、外链打开回调绑定、关于面板渲染等）；
- **端到端真机验收**：覆盖偏好设置与桌面交互场景，全部用例绿灯通过；
- **生产构建门禁**：Vite 生产打包与 TypeScript 静态类型检查 0 错误通过。

---

## 3. 交付物与源码获取

- **源码标签**：`git clone git@github.com:monkeychen/mditor.git && git checkout v0.5.1`
- **跨平台二进制包**（由云端 CI 针对 `v0.5.1` Tag 自动多平台多架构编译构建挂载至 GitHub Releases）：
  - macOS: `mditor-0.5.1-universal.dmg`, `mditor-0.5.1-mac.zip`
  - Windows: `mditor-Setup-0.5.1.exe`, `mditor-0.5.1-win.portable.exe`
  - Linux: `mditor-0.5.1.AppImage`, `mditor_0.5.1_amd64.deb`

---

## 4. 已知问题与下版规划 (v0.6.0 Backlog)

1. **多标签页分屏对比（Split View）**：支持左右双栏或上下分屏同时查看与对比两个 Markdown 文档；
2. **文档版本历史与本地快照（Local History & Snapshots）**：本地轻量级自动快照，支持时间线对比与误删恢复；
3. **图床自动上传与图链管理（Image Bed Uploader）**：支持拖拽图片时自动上传至配置的图床服务（如 S3 / GitHub / 自定义 API）。
