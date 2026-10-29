# 贡献指南 (Contributing to mditor)

感谢你对 **mditor** 的关注与支持！我们热忱欢迎来自开源社区的 Issue 反馈、体验建议与 Pull Request 代码贡献。

为了保障工业级的打字交互手感、严格的源文件保真度与高度可维护性，请在提交代码前仔细阅读以下规范。

---

## 🛠️ 开发与测试规范（TDD 门禁）

本仓库严格遵循 **测试驱动开发 (TDD)** 与 **全流程自动化验证**：

1. **测试先行（Red-Green-Refactor）**：
   - 任何新功能、交互改进或缺陷修复，必须在 `tests/unit/`、`tests/integration/` 或 `tests/fidelity/` 中先编写失败的测试用例（红）；
   - 编写实现代码使测试通过（绿）；
   - 优化代码结构并确保全量测试依然通过（重构）。
2. **严禁破坏规则**：
   - 严禁为让测试通过而删改或弱化断言；
   - 核心编辑链路与源文件读写禁止纯 Mock 覆盖；
   - 提交 PR 前必须确保一条命令跑通所有测试（`npm run test:all` 或 `npm test` + `npm run build`）。
3. **Commit 信息规范**：
   - 英文 Commit Message，推荐采用一个 Task 一个 Commit，包含清晰的语义化前缀：
     - `feat`: 新增特性或用户可见交互
     - `fix`: 缺陷修复
     - `test`: 测试用例补充与回归
     - `docs`: 文档变更与规范沉淀
     - `refactor`: 重构优化（不改变外部行为）
     - `chore`: 构建配置、依赖或工具链变动
   - 示例：`feat(editor): implement table row and column navigation`。

---

## 🚀 本地开发与调试步骤

```bash
# 1. 克隆你 fork 的仓库并创建特性分支
git clone git@github.com:<your-username>/mditor.git
cd mditor
git checkout -b feature/my-awesome-feature

# 2. 安装项目依赖
npm install

# 3. 启动本地桌面开发环境 (Vite + Electron 热重载)
npm run dev

# 4. 执行全量测试与静态类型检查
npm run lint          # TypeScript 静态类型校验
npm test              # 运行 260+ 项 Vitest 单元与保真测试
npm run test:e2e      # 运行 Playwright 桌面端到端真机测试
npm run test:all      # 一键执行全部测试套件

# 5. 验证生产构建
npm run build

# 6. 提交变更并向 main 分支发起 Pull Request
```

---

## 💡 架构设计与代码约定

- **双引擎分工与边界**：
  - **所见即所得模式（WYSIWYG）**：基于 **Milkdown（ProseMirror + remark）** 语义块文档模型，位于 `src/renderer/editor/wysiwyg/`。表格、列表、数学公式和图表等富交互节点在排版中原生原地编辑，杜绝光标进出时的跳变；
  - **源码模式（Source Mode）**：基于 **CodeMirror 6**，位于 `src/renderer/editor/source/`。专精纯文本源码流，供用户通过 `⌘/` 精准把控底层字符；
  - **源文件保真铁律**：任何 Markdown AST 转换与序列化规则变更，必须保证 `tests/fidelity/fidelity.test.ts` 中的 42 组黄金用例实现「打开→保存逐字节不变」，绝不容许无故改写用户的 Markdown 符号（如 `*` 变 `-`、篡改表格缩进等）。
- **安全沙箱隔离**：
  - 渲染进程严禁直接调用 Node.js 原生底层模块；
  - 主进程与渲染进程的通信必须通过 `src/preload/index.ts` 暴露最小必要且具备类型安全的白名单 API；
  - 外部链接必须通过主进程白名单机制调用系统安全协议（仅放行 `https:`、`http:`、`mailto:`）。
- **macOS 原生工业级质感**：
  - 界面遵循无干扰、内敛、高信噪比的设计语言；
  - 组件样式基于 Tailwind CSS 与语义化 CSS 主题变量，所有弹出层和浮窗需自适应亮暗与经典排版主题。

---

再次感谢你让 mditor 变得更加优雅和强大！
