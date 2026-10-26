# Vibe Coding 踩坑与避坑记录

本文档持续追加，跨版本共用，记录大模型协作、环境配置、框架机制等非业务维度的坑点与解决方案。

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
