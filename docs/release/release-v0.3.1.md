---
doc: release
product: v0.3.1
milestone: -
date: 2026-10-27
status: approved
---

# Release Note - mditor v0.3.1：Windows 升级体验优化与 CI 自动化发布门禁

mditor v0.3.1 是针对发布工程化与跨平台升级体验的关键补丁版本。本版本优化了 Windows 覆盖安装体验，消除了 GitHub Actions 多平台云端并发构建的竞态缺陷，确保每一位跨平台用户均能稳定获取并无缝升级至最新版。

---

## 1. 变更记录 (Changelog)

### Fixed
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

- **回归测试覆盖**：
  - 48 个测试套件，144 个单元与保真度测试 100% 通过（涵盖 42 个多源语料文件回归）；
  - Vite 渲染进程与 TypeScript 主进程构建无报错通过。
- **全平台资产发布验证**：
  - 已接入 GitHub Actions 自动化校验门禁。
