---
doc: PRD
product: v0.3.1
milestone: -
date: 2026-10-27
status: approved
---

# PRD-v0.3.1：Windows 升级体验优化与 CI 发布管道加固

## 1. 背景与目标

在 v0.3.0 发布过程中，由于 GitHub Actions 多 Runner 并发请求写竞争，导致 Windows 安装包被意外孤立上传至未关联 Tag 的 Draft Release；同时，Windows NSIS 安装程序在覆盖安装时缺乏对已安装旧版本的显式检测与弹窗告知。
v0.3.1 作为维护补丁版本，目标是：
1. 固化 CI/CD 发布流程，消灭并发写竞争，实施全平台产物硬门禁；
2. 完善 Windows 安装向导，实现旧版安装检测、版本号提取、友好弹窗提示及旧程序文件清理，确保用户数据 100% 安全。

---

## 2. 用户故事

- **作为 Windows 用户**，当我在已有旧版本电脑上双击新版本安装包时，我希望能清晰获知已检测到旧版本、系统将自动清理旧版程序文件并保留我的文档与个人设置，以便我安心无忧地升级。
- **作为跨平台用户与维护者**，每次发版时，我希望能保证 macOS、Windows、Linux 三大平台的安装包完整、可靠、无遗漏地由云端 CI 自动挂载至 GitHub Release，不再因服务并发竞争导致漏包。

---

## 3. 功能需求

### F23：Windows NSIS 安装前旧版本检测与安全升级
- **AC-23.1 [检测与提示]**：NSIS 安装向导在 `customInit` 阶段从注册表读取 `com.mditor.app` 的 `UninstallString` 与 `DisplayVersion`。若检测到旧版本，弹出系统对话框告知用户已安装旧版本，并说明升级策略（自动清理旧程序文件、完整保留个人数据）。用户选「是」继续，选「否」退出。
- **AC-23.2 [安全清理与数据隔离]**：执行升级时，安装程序自动清理旧版本二进制文件；`electron-builder.json` 显式设置 `deleteAppDataOnUninstall: false`，确保 `%APPDATA%\mditor` 下的用户文档缓存与主题偏好完好保留。

### F24：CI/CD 单锚点构建与全平台资产硬门禁
- **AC-24.1 [单锚点消除竞态]**：发布流水线在多平台 Matrix 启动前，由单节点 Job `prepare-release` 先行向 GitHub API 创建唯一的 Draft Release 作为锚点，三平台 Runner 统一向该锚点挂载产物，根除并发写竞争。
- **AC-24.2 [全平台资产硬门禁]**：`finalize-release` 在正式发布 Release 前，强制校验资产列表必须同时包含 `.dmg`（macOS）、`.exe`（Windows）、`.AppImage`（Linux）。缺失任何一项，CI 立即报错退出（`exit 1`），拒绝发布半成品。

---

## 4. 里程碑划分

| 里程碑 | 目标 | 覆盖 F/AC | 是否涉及 UI | 是否涉及外部系统 |
|---|---|---|---|---|
| **M1** | Windows 安装升级向导防护与 CI 自动化全平台门禁 | F23 (AC-23.1, AC-23.2), F24 (AC-24.1, AC-24.2) | 否（系统级对话框） | 是（GitHub API / Actions） |

---

## 5. 非目标
- 不变更 Markdown 核心编辑器解析与渲染逻辑。
- 不引入新的 UI 主题或重型排版语法。
