---
doc: spec
product: v0.3.1
milestone: m1
date: 2026-10-27
status: approved
---

# spec-v0.3.1-m1: Windows 安装升级体验优化与 CI 发布管道加固

## 1. 里程碑目标与覆盖 F/AC

本里程碑聚焦发布可靠性与安装升级交互透明化：
- 覆盖需求：**F23 (AC-23.1, AC-23.2)**, **F24 (AC-24.1, AC-24.2)**。

---

## 2. 关键功能设计思路

### 2.1 Windows NSIS 安装前旧版本检测宏 (`resources/installer.nsh`)
1. **触发时机**：在 NSIS 安装向导初始化最早期钩子 `!macro customInit` 中触发，早于任何文件写入或向导页面渲染。
2. **注册表检索**：
   - 优先读取当前用户配置：`HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\com.mditor.app`；
   - 若未找到，回退读取全系统配置：`HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\com.mditor.app`。
3. **交互弹窗**：
   - 提取 `DisplayVersion`（如 `0.3.0`）。若存在旧版本，调用 `MessageBox MB_YESNO|MB_ICONINFORMATION` 告知用户。
   - 用户选择 `IDNO`：直接执行 `Quit` 干净退出。
   - 用户选择 `IDYES`：继续后续标准安装向导，并在写入新文件前自动清理旧版程序文件。
4. **数据安全**：
   - 在 `electron-builder.json` 中配置 `"deleteAppDataOnUninstall": false`，严禁在覆盖升级或卸载时破坏用户的个人文档缓存与本地设置。

### 2.2 CI/CD 三阶段发布流与硬门禁 (`.github/workflows/release.yml`)
1. **阶段 1：`prepare-release`（单节点，ubuntu-latest）**：
   - 验证 Tag 格式；调用 `gh release create "$TAG_NAME" --draft` 先行创建全局唯一的 Draft Release 锚点。
2. **阶段 2：`build-and-upload`（三节点矩阵，macos / windows / ubuntu）**：
   - 并发构建，`electron-builder --publish always` 直接挂载至预建的 Draft Release，消除竞态。
3. **阶段 3：`finalize-release`（单节点，ubuntu-latest）**：
   - 读取该 Release 的资产清单，使用 grep 严格验证 `.dmg`、`.exe`、`.AppImage` 必须全部存在。
   - 校验通过后调用 `gh release edit "$TAG_NAME" --draft=false` 正式向公众发布。

---

## 3. 关键决策记录

| 决策点 | 选定方案 | 为什么这么选 | 对用户的影响 |
|---|---|---|---|
| **旧版检测机制** | NSIS `customInit` 注册表检索 + 系统弹窗确认 | 原生 NSIS 具备最高的 Windows 执行可靠性，无需引入额外外部进程 | 用户能提前获知升级策略，明确知道个人数据不会丢失 |
| **CI 产物门禁** | `finalize-release` 正则硬断言三大平台包 | 杜绝人工肉眼核验遗漏，将平台完整性上升为构建硬指标 | 用户永远不会在 GitHub Release 看到缺失 Windows 或 Linux 的半成品 |

---

## 4. Task 拆分与执行状态

| Task 编号 | 内容 | 覆盖 AC | 状态 | 验证证据 |
|---|---|---|---|---|
| **T231** | 编写 `resources/installer.nsh` 并配置 `electron-builder.json` | AC-23.1, AC-23.2 | Done | 宏语法完备，`deleteAppDataOnUninstall: false` 已启用 |
| **T241** | 重构 `.github/workflows/release.yml` 引入锚点与硬门禁 | AC-24.1, AC-24.2 | Done | 3-stage 拓扑结构构建，`.dmg`/`.exe`/`.AppImage` 校验逻辑已就位 |
| **T242** | 全量构建与单测门禁回归 | AC-21.1–AC-24.2 | Done | 48 个套件 144 个测试全部 PASS，`npm run build` 成功 |

---

## 5. 验收记录

- **单元与保真度回归测试**：
  - 命令：`npm run test`
  - 结果：48 个测试套件，144 个测试全部 PASS（通过率 100%）。
- **打包构建验证**：
  - 命令：`npm run build`
  - 结果：Vite 渲染进程与 Electron 主进程编译全部通过，零报错。
