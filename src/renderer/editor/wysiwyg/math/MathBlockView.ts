import type { Node } from '@milkdown/prose/model';
import type { EditorView, NodeView } from '@milkdown/prose/view';
import { renderMathToString } from './katexRenderer';

export class MathBlockView implements NodeView {
  dom: HTMLElement;
  private renderEl: HTMLElement;
  private drawerEl: HTMLElement;
  private textareaEl: HTMLTextAreaElement;
  private isExpanded = false;

  constructor(
    private node: Node,
    private view: EditorView,
    private getPos: () => number | undefined
  ) {
    this.dom = document.createElement('div');
    this.dom.className = 'math-block-wrapper my-6 relative select-none';

    // 1. 公式展示主体卡片
    this.renderEl = document.createElement('div');
    this.renderEl.className =
      'math-block-card p-5 rounded-xl border border-stone-200/80 bg-stone-50/50 hover:bg-stone-50/90 hover:border-blue-300 transition cursor-pointer flex flex-col items-center justify-center min-h-[64px] shadow-2xs';
    this.renderEl.title = '点击展开 LaTeX 公式编辑抽屉';

    // 2. 抽屉式源码编辑卡片
    this.drawerEl = document.createElement('div');
    this.drawerEl.className =
      'math-block-drawer hidden mt-2 p-3.5 bg-white border border-blue-200/90 rounded-xl shadow-lg space-y-2.5 transition animate-in fade-in duration-150';

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between text-xs text-blue-900 font-semibold';
    header.innerHTML = `
      <span class="flex items-center gap-1.5">
        <span>📐 独立公式块 LaTeX 源码</span>
        <span class="text-[10px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">$$...$$</span>
      </span>
    `;

    const btnGroup = document.createElement('div');
    btnGroup.className = 'flex items-center space-x-1.5 text-xs';

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'px-2 py-0.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded text-[11px] border border-stone-200 transition';
    copyBtn.textContent = '复制代码';
    copyBtn.onclick = (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(this.textareaEl.value);
      copyBtn.textContent = '已复制!';
      setTimeout(() => {
        copyBtn.textContent = '复制代码';
      }, 1500);
    };

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'px-2 py-0.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded text-[11px] transition';
    closeBtn.textContent = '收起 ✕';
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      this.collapse();
    };

    btnGroup.appendChild(copyBtn);
    btnGroup.appendChild(closeBtn);
    header.appendChild(btnGroup);

    this.textareaEl = document.createElement('textarea');
    this.textareaEl.rows = 3;
    this.textareaEl.className =
      'w-full p-2.5 bg-stone-50/80 border border-stone-200 rounded-lg font-mono text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y';
    this.textareaEl.placeholder = '输入 LaTeX 表达式，如 \\int_{-\\infty}^{+\\infty} e^{-x^2} dx = \\sqrt{\\pi}';

    this.drawerEl.appendChild(header);
    this.drawerEl.appendChild(this.textareaEl);

    this.dom.appendChild(this.renderEl);
    this.dom.appendChild(this.drawerEl);

    this.renderFormula();
    this.setupListeners();
  }

  private renderFormula() {
    const latex = this.node.attrs.value || '';
    if (!latex.trim()) {
      this.renderEl.innerHTML = '<span class="text-stone-400 font-mono text-xs italic">[空独立公式块 - 点击输入]</span>';
    } else {
      this.renderEl.innerHTML = renderMathToString(latex, true);
    }
  }

  private setupListeners() {
    this.renderEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!this.isExpanded) {
        this.expand();
      } else {
        this.collapse();
      }
    });

    this.textareaEl.addEventListener('input', () => {
      const nextLatex = this.textareaEl.value;
      this.renderEl.innerHTML = renderMathToString(nextLatex || '\\quad', true);
    });

    this.textareaEl.addEventListener('blur', () => {
      this.saveChanges();
    });

    this.textareaEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.collapse();
      }
      // 阻止事件冒泡干扰外部快捷键
      e.stopPropagation();
    });
    this.textareaEl.addEventListener('keyup', (e) => e.stopPropagation());
    this.textareaEl.addEventListener('keypress', (e) => e.stopPropagation());
  }

  private expand() {
    this.isExpanded = true;
    this.drawerEl.classList.remove('hidden');
    this.renderEl.classList.add('border-blue-400', 'bg-white');
    this.textareaEl.value = this.node.attrs.value || '';
    setTimeout(() => {
      this.textareaEl.focus();
    }, 20);
  }

  private collapse() {
    this.isExpanded = false;
    this.drawerEl.classList.add('hidden');
    this.renderEl.classList.remove('border-blue-400', 'bg-white');
    this.saveChanges();
    this.renderFormula();
    this.view.focus();
  }

  private saveChanges() {
    const nextValue = this.textareaEl.value.trim();
    const pos = this.getPos();
    if (typeof pos === 'number' && nextValue !== this.node.attrs.value) {
      const tr = this.view.state.tr.setNodeMarkup(pos, undefined, {
        ...this.node.attrs,
        value: nextValue,
      });
      this.view.dispatch(tr);
    }
  }

  update(node: Node): boolean {
    if (node.type !== this.node.type) return false;
    this.node = node;
    if (!this.isExpanded) {
      this.renderFormula();
    }
    return true;
  }

  selectNode() {
    this.renderEl.classList.add('ring-2', 'ring-blue-400');
  }

  deselectNode() {
    this.renderEl.classList.remove('ring-2', 'ring-blue-400');
  }

  destroy() {
    // 清理
  }
}
