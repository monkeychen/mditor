# Vibe Coding 踩坑与避坑记录

本文档持续追加，跨版本共用，记录大模型协作、环境配置、框架机制等非业务维度的坑点与解决方案。

---

## 2026-10-27 | 案例 6：多 Runner 并发创建 Draft Release 竞争导致产物分裂与全平台资产硬门禁兜底

- **现象**：v0.3.0 发版时，GitHub Release 页面仅展示 macOS 和 Linux 安装包，缺失 Windows 包；排查发现 Windows 产物被孤立上传至一个未绑定 Tag 的 Draft Release。
- **根本原因**：
  1. 多平台 Matrix Runner（macOS, Windows, Ubuntu）并发执行 `electron-builder --publish always` 时，在同一毫秒内向 GitHub API 请求创建草稿，触发服务端写竞争，导致 Windows runner 获取到单独生成的 untagged 草稿并挂载产物；
  2. 工作流收尾脚本未设全平台资产校验，静默发布了缺失 Windows 产物的半成品。
- **解决策略**：
  1. 重构 CI 工作流：前置单节点 `prepare-release` 先行创建 Draft Release 唯一定位锚点，各平台 Runner 统一向该锚点上传资产；
  2. 收尾 Job 增加 `.dmg`、`.exe`、`.AppImage` 全平台硬门禁校验，缺任一平台则 CI 报错退出。
- **适用范围**：Electron / GitHub Actions 多平台矩阵自动化发布

---

## 案例 1：发版时序倒置导致 CI 漏跑与人工上传隐患

- **现象**：v0.1.0 发版后 GitHub Release 页面缺少 Windows 安装包；随后开发者使用本地开发机打包后手动上传至 Release 附件。
- **根因分析**：
  1. **操作时序倒置**：先打 Tag `v0.1.0` 推送至远程，后续 Commit 才添加 `release.yml` CI 脚本。导致 GitHub Actions 监听 Tag 时找不到对应的工作流，云端跨平台构建完全未触发。
  2. **应急补救违背自动化原则**：发现漏包后，直接在 macOS 开发机本地打出 Windows 和 Linux 包人工补传。人工本地打包依赖本地缓存环境，不可审计，且容易因疏忽再次遗漏平台，违背了开源软件构建的可重现性（Reproducible Builds）。
- **避坑原则与铁律**：
  1. **构建脚本与配置先行**：发布前必须确保 CI 工作流在目标 Commit 上已存在并跑通。
  2. **云端 CI 为唯一准入源**：所有跨平台二进制包必须由 Tag 触发云端 CI 自动编译和挂载。除非云端 CI 出现不可抗力的多轮阻断，才允许在记录原因后以本地构建作为应急兜底。

---

## 案例 2：Electron 自定义特权协议 `local-file://` 的 Hostname 归一化吞斜杠陷阱

- **现象**：渲染进程处于 `http://localhost:5173` 时加载本地图片被 Chromium 拦截；改为注册 `standard: true` 的 `local-file://` 协议后，构造 `local-file:///Users/xxx/a.png` 依然加载失败（`naturalWidth === 0`）。
- **根因分析**：
  当协议声明 `standard: true` 时，Chromium URL 解析器会遵循 RFC 3986 标准 URL 语法，将 `local-file:///Users/...` 的第一段 `Users` 当作 Hostname 并强制转为小写 `users`，变成 `local-file://users/...`，导致主进程拿到路径时丢失了根目录 `/Users`。
- **避坑原则与铁律**：
  1. 凡是 `standard: true` 的自定义本地文件协议，前端构造 URL 必须显式指定 `localhost` 作为 Host：`local-file://localhost${encodeURI(absPath)}`；主进程通过 `decodeURIComponent(new URL(request.url).pathname)` 提取真实绝对路径。
  2. **E2E 严禁假阳性断言**：验证图片渲染必须硬性断言 `img.complete === true && img.naturalWidth > 0`，绝不能用「图片加载成功 OR 错误卡片可见」这种恒真断言掩盖 Bug。

---

## 案例 3：Milkdown 异步 `editor.create()` 在共享 Ref 下的双实例并发挂载竞态

- **现象**：在第一行输入字符时，输入焦点突然跳到窗口最下方，同时文档中出现两份完全相同的内容。
- **根因分析**：
  1. `editor.create()` 是异步 Promise。若使用跨 `useEffect` 共享的 `isDestroyedRef` 记录销毁状态，当组件发生快速 `unmount -> remount` 时，第二次 mount 会把 `isDestroyedRef.current` 重置为 `false`，导致第一次尚未完成的 `editor.create()` 回调通过检查，继续挂载到同一个 DOM 容器中，形成上下两个 `.ProseMirror` 编辑器实例并存。
  2. 外层容器 `onClick` 兜底聚焦未过滤 `.ProseMirror` 内部点击，干扰了 ProseMirror 原生鼠标落点选区计算。
- **避坑原则与铁律**：
  1. 异步创建的编辑器实例在 `useEffect` 中必须使用**每次 Effect 独立的局部闭包变量** `let isEffectCancelled = false;`，并在挂载前与卸载时执行 `container.innerHTML = ''`。
  2. 外层容器点击聚焦兜底必须首先判断 `if (target.closest('.ProseMirror')) return;`，绝不干预编辑器内部原生焦点。
  3. E2E 测试必须包含 `expect(window.locator('.ProseMirror')).toHaveCount(1)` 唯一实例断言。

---

## 案例 4：Tailwind Preflight 的 `img { display: block }` 导致 ProseMirror 标题输入 `# ` 后光标跳到下一行

- **现象**：在空行输入 `#` 再输入空格转换为一级标题时，看到的 `# ` 在第一行，而闪烁的输入光标自己跳到了下一行（`<h1>` 高度从单行 `41.6px` 变成双行 `83.5px`）。
- **根因分析**：
  1. 当用户输入 `# ` 触发标题转换时，`delimiterPlugin` 会在 `<h1>` 开头插入一个 `contenteditable="false"` 的定界符 Widget（`<span class="milkdown-heading-marker"># </span>`）。
  2. ProseMirror 为了让浏览器光标能停靠在 `contenteditable="false"` 节点旁，会自动在其后方插入一个 `<img class="ProseMirror-separator" alt="">`。
  3. Tailwind CSS 的 Preflight 全局重置默认给所有 `img` 设置了 `display: block;`！这导致 `<img class="ProseMirror-separator">` 变成了块级元素，直接在 `# ` 后面强行换行，把后面的 `<br class="ProseMirror-trailingBreak">` 和输入光标推到了第二行。
- **避坑原则与铁律**：
  在引入 Tailwind CSS 的 ProseMirror / Milkdown 项目中，必须显式声明 `.ProseMirror img.ProseMirror-separator { display: inline !important; border: none !important; margin: 0 !important; width: 0 !important; height: 0 !important; }`，并在 E2E 测试中校验输入 `# ` 后的 `h1` 高度为单行高度（`< 52px`）。

---

## 案例 5：electron-builder 多平台并发构建默认留存 Draft Release 陷阱

- **现象**：打 Tag 触发 GitHub Actions 编译发布，macOS、Windows、Ubuntu 三个 Runner 全部成功构建并上传了安装包，但普通访客在 GitHub Releases 页面依然看不到新版本（只能看到旧版本）。
- **根因分析**：
  `electron-builder --publish always` 在多平台 Matrix 并发运行策略下，为了防止多个 Runner 在不同时段上传时发生竞争冲突，默认行为是创建/追加到 **Draft Release（草稿）**。如果工作流没有在所有构建 Job 结束后显式调用 GitHub API 发布草稿，该 Release 会一直停留在草稿状态，对外不可见。
- **避坑原则与铁律**：
  在 GitHub Actions 的 `release.yml` 中，必须声明依赖 `needs: release` 的汇聚 Job `finalize-release`，在全部 Runner 上传完成后执行 `gh release edit "$TAG_NAME" --draft=false` 自动发布，实现全流程 0 人工干预。

---

## 案例 7：未 Memoize 的衍生数组传入 useEffect 导致单测无限重渲染死锁与拖拽把手双击拦截

- **现象**：
  1. `OutlineDrawer` 增加全工作区搜索 `useEffect` 后，Vitest 单测运行卡死挂起 40 多分钟，CPU 占用居高不下；
  2. 拖拽调宽把手在触发双击复位时，被误判为微小拖拽位移，导致宽度未能成功复位到 240px。
- **根因分析**：
  1. `effectiveFolders` 是在组件函数体内每次计算返回的衍生对象（`folders ?? (...) : []`）。当外部未传入 `folders` 时，每次渲染都生成了一个全新的空数组引用 `[]`。
  2. `useEffect` 依赖了 `effectiveFolders`，且在条件不满足时无条件调用了 `setSearchResults([])` 与 `setIsSearching(false)`，导致触发重渲染 -> 生成新 `[]` -> 触发 Effect -> 再次触发重渲染，陷入无限循环死锁。
  3. 鼠标在窄把手（4px）双击时会连续触发 `pointerdown`、`pointermove`，若未设置拖拽阈值（`Math.abs(clientX - startX) < 2`），双击点处的微小指针移动会被判定为拖拽事件，覆盖双击复位。
- **避坑原则与铁律**：
  1. 任何在组件内部由 Props 衍生出的集合对象，**必须使用 `useMemo` 缓存**；传给 `useEffect` 的依赖尽量降维为基础类型值（如 `folderPaths.join(';')`）。
  2. `useEffect` 的状态清理守卫必须是幂等的，如 `setSearchResults(prev => prev.length > 0 ? [] : prev)`，避免在值无变化时触发二次重渲染。
  3. 拖拽交互（Resize / Drag）必须设置微位移启动门限（通常为 2~3px），过滤点击与双击时的误触，并在 `pointerdown` 中辅以时间戳双击检测兜底。

---

## 案例 8：HTML5 拖拽事件在 React 批处理与自动化测试环境下的数据载荷丢失陷阱

- **现象**：在 Tab 标签拖拽排序或侧边栏文件树拖拽中，如果放置处理函数（`handleDrop`）仅依赖组件内部 React state（例如 `draggedTabId`），在极速拖拽或自动化测试触发 DragEvent 时，`handleDrop` 读取到的状态可能仍为 `null`，导致放置逻辑静默失败。
- **根因分析**：
  React 18 的批量更新机制（Automatic Batching）使得 `onDragStart` 中调用的 `setDraggedTabId` 是异步渲染生效的。若 `onDrop` 在同一同步事件序列或状态合并完成前触发，`handleDrop` 闭包中的 `draggedTabId` 尚未更新，导致 `if (!draggedTabId) return;` 阻断。
- **避坑原则与铁律**：
  1. 拖拽业务协议必须优先遵循 W3C 标准：使用 `e.dataTransfer.setData(...)` 与 `e.dataTransfer.getData(...)` 传递实体 ID 与路径载荷；
  2. React state（如 `draggedTabId`、`dropIndicator`）仅用于处理幽灵卡片半透明、插入指示线等纯视觉 UI 状态，严禁作为放置业务执行的唯一判定源；
  3. 在 `handleDrop` 中采取双重回退策略：`const sourceId = draggedTabId || e.dataTransfer.getData('text/plain')`，确保在任何极速拖拽或测试派发场景下 100% 可靠。

---

## 案例 9：TypeScript 枚举对象字面量类型自动窄化与 E2E 视图前置条件对齐陷阱

- **现象**：
  1. 使用第三方库（如 `docx` 的 `HeadingLevel`）进行分支判断赋值时，`let headingLevel = HeadingLevel.HEADING_1;` 触发 `TS2322: Type '"Heading2"' is not assignable to type '"Heading1"'` 静态编译报错；
  2. Playwright E2E 测试寻找工作区文件树元素 `[data-testid="file-tree-item-*"]` 发生 6000ms 超时未找到。
- **根因分析**：
  1. TypeScript 对未显式注解的变量声明 `let x = Enum.VAL` 会采用字面量类型推断（Inferred Literal Type），将其类型收敛为单个字面量 `"Heading1"`，而非该枚举值所有可能成员的联合类型；
  2. 复合侧边栏组件在挂载时默认处于 `outline`（大纲）视图，若未显式触发切到 `sidebar-tab-files`（文件树）视图，树节点尚未渲染进 DOM，导致 E2E 定位失败。
- **避坑原则与铁律**：
  1. 涉及枚举或联合类型的多分支可变变量，必须显式声明联合类型注解：`let headingLevel: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1;`；
  2. E2E 测试操作依赖特定视图上下文的元素前，必须显式触发切换并断言对应视图 Tab 处于激活状态，杜绝依赖隐式默认视图。


