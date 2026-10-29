import React, { useState, useEffect } from 'react';
import { X, BookOpen, GitGraph, Sigma, Copy, Check, Plus, ExternalLink } from 'lucide-react';

export type GuideTab = 'markdown' | 'mermaid' | 'math';

export interface GuideModalProps {
  isOpen: boolean;
  initialTab?: GuideTab;
  onClose: () => void;
  onInsertSnippet?: (snippet: string) => void;
  onOpenAsDocument?: (title: string, markdownContent: string) => void;
}

interface GuideItem {
  title: string;
  desc: string;
  snippet: string;
}

const MARKDOWN_GUIDE_ITEMS: GuideItem[] = [
  {
    title: '标题与层级',
    desc: '使用 1~6 个 # 号表示一至六级标题',
    snippet: '# 一级标题\n## 二级标题\n### 三级标题\n#### 四级标题',
  },
  {
    title: '文本强调与样式',
    desc: '粗体、斜体、删除线与高亮标记',
    snippet: '**粗体文本**\n*斜体文本*\n~~删除线~~\n==高亮标记==\nX^2^ (上标) 与 H~2~O (下标)',
  },
  {
    title: '无序、有序与任务列表',
    desc: '标准清单与支持勾选交互的 Todo 任务项',
    snippet: '- [x] 已完成任务\n- [ ] 待处理任务\n- 无序列表项 A\n- 无序列表项 B\n1. 第一步\n2. 第二步',
  },
  {
    title: '引用与嵌套块',
    desc: '使用 > 符号创建段落引用与多层嵌套',
    snippet: '> 沉浸式写作是思维与文字的无障碍碰撞。\n>> 嵌套引用：深入探究核心细节。',
  },
  {
    title: '代码块与语法高亮',
    desc: '以三个反引号包裹，后接编程语言标签',
    snippet: '```typescript\ninterface Editor {\n  mode: "wysiwyg" | "source";\n  isFocused: boolean;\n}\n```',
  },
  {
    title: 'GFM 数据表格',
    desc: '使用竖线 | 与破折号 - 分隔单元格与表头',
    snippet: '| 功能 | 快捷键 | 模式 |\n|---|---|---|\n| 所见即所得/源码切换 | ⌘/ | 双模式 |\n| 快速打开文件 | ⌘P | 全局 |\n| 全文检索 | ⌘⇧F | 侧边栏 |',
  },
  {
    title: '超链接、图片与脚注',
    desc: '文本锚点链接与尾部脚注引用',
    snippet: '[访问 mditor 仓库](https://github.com/monkeychen/mditor)\n\n这是一个带脚注的名词[^1]。\n\n[^1]: 这里是脚注的详细阐释。',
  },
];

const MERMAID_GUIDE_ITEMS: GuideItem[] = [
  {
    title: '流程图 (Flowchart)',
    desc: '清晰描述系统架构与业务执行流转分支',
    snippet: '```mermaid\nflowchart TD\n  Start([用户打开文档]) --> Check{文件是否存在?}\n  Check -- 是 --> Load[加载 Milkdown 画布]\n  Check -- 否 --> Create[新建空白文档]\n  Load --> Edit[实时所见即所得编辑]\n  Create --> Edit\n```',
  },
  {
    title: '时序图 (Sequence Diagram)',
    desc: '直观展现进程与对象之间的时序消息交互',
    snippet: '```mermaid\nsequenceDiagram\n  autonumber\n  actor User as 用户\n  participant GUI as 渲染进程 (App.tsx)\n  participant Main as 主进程 (Electron)\n  participant FS as 本地文件系统\n\n  User->>GUI: 按下 ⌘S 保存\n  GUI->>Main: file:save (IPC 调用)\n  Main->>FS: 原子写入磁盘\n  FS-->>Main: 落盘成功\n  Main-->>GUI: 返回 saved 状态\n  GUI-->>User: 状态栏提示已保存\n```',
  },
  {
    title: '类图 (Class Diagram)',
    desc: '面向对象模型与组件实体结构定义',
    snippet: '```mermaid\nclassDiagram\n  class TabItem {\n    +string id\n    +string fileName\n    +string content\n    +boolean isDirty\n  }\n  class WorkspaceFolder {\n    +string path\n    +FileTreeNode tree\n  }\n  WorkspaceFolder "1" *-- "*" TabItem\n```',
  },
  {
    title: '状态图 (State Diagram)',
    desc: '有限状态机（FSM）生命周期迁移',
    snippet: '```mermaid\nstateDiagram-v2\n  [*] --> 浏览态\n  浏览态 --> 编辑态: 聚焦输入\n  编辑态 --> 保存中: 触发 ⌘S\n  保存中 --> 浏览态: 写入完成\n```',
  },
  {
    title: '饼图 (Pie Chart)',
    desc: '数据比例统计与占比分布直观可视化',
    snippet: '```mermaid\npie title 知识库文档格式分布\n  "Markdown (.md)" : 70\n  "TypeScript / Code" : 20\n  "JSON / YAML" : 10\n```',
  },
  {
    title: 'Git 分支图 (Git Graph)',
    desc: '版本迭代、分支 Merge 与 Tag 演进轨迹',
    snippet: '```mermaid\ngitGraph\n  commit id: "v0.4.0"\n  branch feat/v0.5.0\n  checkout feat/v0.5.0\n  commit id: "F30 侧边栏调宽"\n  commit id: "F31 快速打开"\n  commit id: "F35 出版级导出"\n  checkout main\n  merge feat/v0.5.0 id: "Merge v0.5.0"\n  commit id: "v0.5.1 Help 菜单"\n```',
  },
];

const MATH_GUIDE_ITEMS: GuideItem[] = [
  {
    title: '行内与独立公式',
    desc: '行内公式使用 $...$，独立公式块使用 $$...$$',
    snippet: '爱因斯坦质能方程行内表达：$E = mc^2$\n\n高斯积分独立公式块：\n$$\n\\int_{-\\infty}^{+\\infty} e^{-x^2} dx = \\sqrt{\\pi}\n$$',
  },
  {
    title: '上下标、根号与分式',
    desc: '基础代数运算符号组合',
    snippet: '$$\nx = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\n$$',
  },
  {
    title: '微积分与求和',
    desc: '导数、极限、求和与积分运算',
    snippet: '$$\n\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1, \\quad \\sum_{k=1}^n k = \\frac{n(n+1)}{2}\n$$',
  },
  {
    title: '矩阵 (Matrix)',
    desc: '使用 pmatrix (圆括号) 或 bmatrix (方括号) 组织矩阵',
    snippet: '$$\n\\begin{bmatrix}\na_{11} & a_{12} & a_{13} \\\\\na_{21} & a_{22} & a_{23} \\\\\na_{31} & a_{32} & a_{33}\n\\end{bmatrix}\n$$',
  },
  {
    title: '分段函数与方程组 (Cases)',
    desc: '使用 cases 环境构建条件分支方程',
    snippet: '$$\nf(x) = \\begin{cases}\nx^2, & \\text{若 } x \\ge 0 \\\\\n-x, & \\text{若 } x < 0\n\\end{cases}\n$$',
  },
  {
    title: '常用希腊字母与数学符号',
    desc: '高频学术与科学计算字符',
    snippet: '$$\n\\alpha, \\beta, \\gamma, \\theta, \\lambda, \\mu, \\pi, \\sigma, \\omega, \\Delta, \\Omega \\\\\n\\le, \\ge, \\neq, \\approx, \\times, \\div, \\infty, \\rightarrow, \\forall, \\exists\n$$',
  },
];

export const GuideModal: React.FC<GuideModalProps> = ({
  isOpen,
  initialTab = 'markdown',
  onClose,
  onInsertSnippet,
  onOpenAsDocument,
}) => {
  const [activeTab, setActiveTab] = useState<GuideTab>(initialTab);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // ESC 键关闭
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentItems =
    activeTab === 'markdown'
      ? MARKDOWN_GUIDE_ITEMS
      : activeTab === 'mermaid'
        ? MERMAID_GUIDE_ITEMS
        : MATH_GUIDE_ITEMS;

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex((prev) => (prev === index ? null : prev));
    }, 2000);
  };

  const handleOpenDoc = () => {
    if (!onOpenAsDocument) return;
    const title =
      activeTab === 'markdown'
        ? 'Markdown 语法使用指南'
        : activeTab === 'mermaid'
          ? 'Mermaid 图表使用指南'
          : '数学公式 (LaTeX) 使用指南';

    const content = `# ${title}\n\n> 本指南汇集 mditor 支持的核心语法与代码示例，支持在所见即所得画布中实时预览与二次编辑。\n\n` +
      currentItems
        .map((item) => `### ${item.title}\n\n${item.desc}：\n\n${item.snippet}\n`)
        .join('\n');

    onOpenAsDocument(title, content);
    onClose();
  };

  return (
    <div
      data-testid="guide-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs transition-opacity duration-150 select-none"
    >
      <div
        data-testid="guide-modal"
        className="w-[740px] max-h-[85vh] bg-[#FAF8F5] dark:bg-stone-900 border border-black/10 dark:border-stone-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* 顶部标题栏 */}
        <div className="h-12 border-b border-black/5 dark:border-stone-700/60 flex items-center justify-between px-5 bg-white/60 dark:bg-stone-800/60 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-stone-800 dark:text-stone-100">
              使用指南与语法速查
            </span>
            <span className="text-[10px] bg-amber-500/10 text-amber-800 dark:bg-amber-400/20 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
              mditor Help
            </span>
          </div>
          <button
            data-testid="guide-close-btn"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xs px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>关闭 (Esc)</span>
          </button>
        </div>

        {/* 选项卡导航 */}
        <div className="flex border-b border-black/5 dark:border-stone-700/60 bg-stone-100/70 dark:bg-stone-800/40 px-5 gap-6 text-xs font-medium text-stone-500 dark:text-stone-400 shrink-0">
          <button
            data-testid="guide-tab-markdown"
            onClick={() => setActiveTab('markdown')}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'markdown'
                ? 'border-stone-800 text-stone-900 dark:border-stone-200 dark:text-stone-100 font-semibold'
                : 'border-transparent hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Markdown 语法</span>
          </button>
          <button
            data-testid="guide-tab-mermaid"
            onClick={() => setActiveTab('mermaid')}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'mermaid'
                ? 'border-stone-800 text-stone-900 dark:border-stone-200 dark:text-stone-100 font-semibold'
                : 'border-transparent hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <GitGraph className="w-3.5 h-3.5" />
            <span>Mermaid 图表</span>
          </button>
          <button
            data-testid="guide-tab-math"
            onClick={() => setActiveTab('math')}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'math'
                ? 'border-stone-800 text-stone-900 dark:border-stone-200 dark:text-stone-100 font-semibold'
                : 'border-transparent hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Sigma className="w-3.5 h-3.5" />
            <span>数学公式 (LaTeX)</span>
          </button>
        </div>

        {/* 核心卡片列表滚动容器 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {currentItems.map((item, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-stone-800/90 border border-black/5 dark:border-stone-700/60 rounded-xl p-4 shadow-2xs space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-stone-800 dark:text-stone-100">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-stone-400 mt-0.5">{item.desc}</div>
                </div>

                <div className="flex items-center gap-1.5">
                  {onInsertSnippet && (
                    <button
                      data-testid="guide-insert-btn"
                      onClick={() => {
                        onInsertSnippet(item.snippet);
                        onClose();
                      }}
                      className="px-2 py-1 text-[11px] bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 rounded font-medium flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>插入</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleCopy(item.snippet, idx)}
                    className="px-2 py-1 text-[11px] bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 rounded font-medium flex items-center gap-1 transition cursor-pointer"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>复制</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <pre className="bg-[#F6F4F0] dark:bg-stone-900 border border-black/5 dark:border-stone-800 rounded-lg p-2.5 font-mono text-xs text-stone-800 dark:text-stone-200 overflow-x-auto whitespace-pre-wrap select-text">
                {item.snippet}
              </pre>
            </div>
          ))}
        </div>

        {/* 底部动作栏 */}
        <div className="h-12 border-t border-black/5 dark:border-stone-700/60 bg-stone-50 dark:bg-stone-800/80 px-5 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-stone-400">
            支持一键复制或直接插入到当前光标所在编辑位置
          </span>
          {onOpenAsDocument && (
            <button
              data-testid="guide-open-doc-btn"
              onClick={handleOpenDoc}
              className="text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>在新标签页中打开完整文档</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuideModal;
