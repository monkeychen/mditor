# 贡献指南 (Contributing to mditor)

感谢你对 **mditor** 的关注！我们欢迎来自社区的 Issue 报告与 Pull Request 代码贡献。为了保证代码质量与良好的打字交互手感，请在提交代码前仔细阅读以下规范。

---

## 🛠️ 开发与测试规范

本仓库严格遵循 **测试驱动开发 (TDD)** 流程：

1. **先写测试后写实现**：每个新增的功能或修复的 Bug，必须在 `tests/unit/` 或 `tests/integration/` 中提供对应的自动化测试用例。
2. **禁止破坏规则**：
   - 不允许为让测试通过而弱化断言；
   - 提交前必须保证全量测试一条命令跑完并全部通过（`npm run test:all`）；
   - 提交前必须通过 TypeScript 静态校验（`npm run lint`）。
3. **Commit 规范**：
   - 英文 Commit Message，采用语义化前缀：
     - `feat`: 新增特性
     - `fix`: 缺陷修复
     - `test`: 测试用例补充
     - `docs`: 文档变更
     - `refactor`: 重构优化
   - 推荐格式：`feat(editor): implement heading live preview`。

---

## 🚀 本地开发步骤

```bash
# 1. 克隆你 fork 的仓库并创建特性分支
git checkout -b feature/my-awesome-feature

# 2. 安装依赖
npm install

# 3. 启动开发模式进行调试
npm run dev

# 4. 执行全量测试与校验
npm run lint
npm run test:all

# 5. 提交 PR
```

---

## 💡 代码与架构约定

- **纯文本优先**：核心编辑器扩展必须通过 CodeMirror 6 的 ViewPlugin / Decoration 实现，坚决不直接修改底层 Markdown 纯文本字符。
- **安全隔离**：严禁在渲染进程直接调用 Node.js 原生模块；主进程与渲染进程必须严格通过 `src/preload/index.ts` 暴露白名单 API。
- **macOS 原生审美**：保持界面无干扰、高信噪比，优先使用系统字体栈与沉浸式无边框微透质感。
