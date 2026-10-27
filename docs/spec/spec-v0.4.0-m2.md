---
doc: spec
product: v0.4.0
milestone: m2
date: 2026-10-27
status: draft
---

# spec-v0.4.0-m2：跨平台侧边栏文件夹上下文管理与安全回收机制

## 1. 里程碑目标与覆盖范围

### 1.1 目标
在当前支持多工作区文件夹浏览与通用代码/文本文件打开渲染的基础上，补齐侧边栏文件管理能力的「最后一公里」。提供沉浸式、符合操作系统习惯的右键上下文菜单，支持新建文件/文件夹、重命名、全平台原生文件管理器精确定位（Finder / Explorer / File Manager）、严格调用系统回收机制（废纸篓 / 回收站，严禁硬删除）以及跨平台快捷键与 Windows 非法字符防御，彻底形成文件管理完整闭环。

### 1.2 覆盖范围
- **功能需求**：F28（工作区文件夹右键上下文管理与跨平台适配，覆盖 macOS / Windows / Linux）
- **验收标准**：
  - **AC-28.1**：目录项右键菜单（新建文件、新建文件夹、在系统文件管理器中定位、从工作区移除）；
  - **AC-28.2**：文件项右键菜单（重命名、安全移入废纸篓/回收站、在系统文件管理器中定位、复制绝对/相对路径）；与多标签页联动（删除自动关 Tab、重命名同步更新路径与标题）；
  - **AC-28.3**：平台文案与快捷键自适应（macOS vs Windows vs Linux），Windows 非法字符与保留名校验防御，路径分隔符归一化。

---

## 2. 关键架构与核心设计思路

### 2.1 操作系统平台感知与文案/快捷键映射表

由主进程安全通过 Preload 暴露 `window.electronAPI.platform`（`'darwin' | 'win32' | 'linux'`）：

| 平台 | 操作系统显示文案 | 回收删除文案 | 重命名快捷键 | 删除快捷键 | 路径复制快捷键 |
|---|---|---|---|---|---|
| **macOS (`darwin`)** | 在访达中显示 (Reveal in Finder) | 移到废纸篓 (Move to Trash) | `Enter` | `⌘⌫` | `⌥⌘C` |
| **Windows (`win32`)** | 在文件资源管理器中显示 (Show in File Explorer) | 移到回收站 (Move to Recycle Bin) | `F2` | `Delete` | `Ctrl+Shift+C` |
| **Linux (`linux`)** | 在文件管理器中显示 (Open in File Manager) | 移到废纸篓 (Move to Trash) | `F2` | `Delete` | `Ctrl+Shift+C` |

### 2.2 IPC 通信与底层文件系统安全约束

严禁在删除操作中使用 `fs.unlink` 或 `fs.rm`，所有删除必须调用操作系统原生回收机制：
1. **安全移入废纸篓/回收站 (`file:moveToTrash`)**：
   - 调用 Electron `shell.trashItem(fullPath)`；
   - Windows 平台文件将移入「回收站（Recycle Bin）」，macOS 移入「废纸篓（Trash）」，Linux 遵循 freedesktop.org 规范；
   - 用户可随时在系统回收站中「放回原处 / Restore」，彻底杜绝误删数据丢失风险；
2. **在原生文件管理器中高亮定位 (`file:revealInExplorer`)**：
   - 调用 Electron `shell.showItemInFolder(fullPath)`；
3. **新建与重命名安全写入**：
   - `file:create`：若目标文件已存在，阻止覆盖并提示；
   - `file:rename`：原子化调用 `fs.rename`，若目标路径已存在则阻断；
   - `folder:create`：调用 `fs.mkdir(dirPath, { recursive: true })`。

### 2.3 Windows 非法字符与系统保留名防御门禁 (`fileNameValidator.ts`)

为了保证在 Windows 以及跨平台同步场景下不损坏文件系统，在用户输入时进行前端与主进程双层校验：
1. **非法字符过滤**：
   - 禁止包含：`\ / : * ? " < > |` 以及 ASCII 0-31 控制字符；
2. **Windows 系统保留名拦截**（大小写不敏感，含带扩展名场景）：
   - `CON`, `PRN`, `AUX`, `NUL`, `COM1`~`COM9`, `LPT1`~`LPT9`；
3. **边缘格式校验**：
   - 文件名不能为空或全空格；
   - 不允许以空格或英文句点 `.` 结尾（Windows 特殊限制）；
4. **校验失败反馈**：
   - 阻断保存并立即弹出轻量 Toast 友好提示具体原因。

### 2.4 内联树节点交互与 Tab 状态联动

1. **内联编辑状态（Inline Editing）**：
   - 重命名或新建文件时，树节点原地切换为内联 Input，自动选中文本（新建时选中主文件名，保留扩展名）；
   - 按 `Enter` 提交校验并写入磁盘；
   - 按 `Esc` 或点击外部自动取消；
2. **Tab 状态实时联动**：
   - **重命名**：若被重命名的文件恰好在当前标签页打开，自动更新该 Tab 的 `filePath`、`fileName` 及模式路由；
   - **删除**：若被删除的文件已在 Tab 中打开，自动无弹窗关闭该 Tab；若有未保存内容，移入回收站前由系统统一清理。

---

## 3. 任务拆解与 TDD 计划（Task Breakdown）

- [x] **T405：文件名合法性校验器与主进程原生能力扩展** (`fileNameValidator.ts`, `src/main/folderService.ts`, `src/preload/index.ts` + 单元测试)
- [x] **T406：侧边栏跨平台右键上下文菜单组件** (`SidebarContextMenu.tsx` + 单元测试)
- [x] **T407：文件树内联新建、重命名、安全回收与 Tab 状态联动** (`OutlineDrawer.tsx`, `App.tsx` + 单元测试)
- [x] **T408：跨平台快捷键自适应、非法名称防御门禁与 E2E 验证** (Playwright E2E: `v0.4.0-m2-workspace-fs.spec.ts`)

---

## 4. 验证与验收标准

1. **单元测试门禁**：
   - `tests/unit/file-name-validator.test.ts`：覆盖所有合法/非法字符、Windows 保留名、跨平台路径斜杠归一化；
   - `tests/unit/sidebar-context-menu.test.tsx`：覆盖 macOS/Windows/Linux 各自的文案与事件分发；
   - `tests/unit/outline-drawer-context.test.tsx`：覆盖右键呼出、内联新建/重命名及删除事件回调；
2. **端到端测试门禁**：
   - `tests/e2e/v0.4.0-m2-workspace-fs.spec.ts`：端到端新建文件、打开编辑、原地重命名、同步 Tab、在系统文件管理器中显示与安全移入回收站。
