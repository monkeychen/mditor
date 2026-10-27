import type { Node } from '@milkdown/prose/model';
import type { EditorView, NodeView } from '@milkdown/prose/view';
import { renderMathToString } from './katexRenderer';

export class InlineMathView implements NodeView {
  dom: HTMLElement;
  private previewEl: HTMLElement;
  private editorEl: HTMLElement;
  private inputEl: HTMLInputElement;
  private isEditing = false;

  constructor(
    private node: Node,
    private view: EditorView,
    private getPos: () => number | undefined
  ) {
    this.dom = document.createElement('span');
    this.dom.className = 'inline-math-wrapper inline-flex items-center align-baseline select-none cursor-pointer';

    // 1. 公式展示容器
    this.previewEl = document.createElement('span');
    this.previewEl.className = 'inline-math-preview px-1 py-0.5 rounded hover:bg-blue-50/80 hover:outline-1 hover:outline-blue-200 transition';
    this.previewEl.title = '点击编辑数学公式';

    // 2. 原地编辑容器
    this.editorEl = document.createElement('span');
    this.editorEl.className = 'inline-math-editor hidden items-center bg-amber-50 border border-amber-300 rounded px-1 text-xs font-mono';

    const leftDollar = document.createElement('span');
    leftDollar.className = 'text-amber-600 font-bold mr-0.5';
    leftDollar.textContent = '$';

    this.inputEl = document.createElement('input');
    this.inputEl.type = 'text';
    this.inputEl.className = 'inline-math-input bg-transparent border-none outline-none font-mono text-xs text-amber-900 min-w-[3rem] px-0.5';

    const rightDollar = document.createElement('span');
    rightDollar.className = 'text-amber-600 font-bold ml-0.5';
    rightDollar.textContent = '$';

    this.editorEl.appendChild(leftDollar);
    this.editorEl.appendChild(this.inputEl);
    this.editorEl.appendChild(rightDollar);

    this.dom.appendChild(this.previewEl);
    this.dom.appendChild(this.editorEl);

    this.renderFormula();
    this.setupListeners();
  }

  private renderFormula() {
    const latex = this.node.attrs.value || '';
    if (!latex.trim()) {
      this.previewEl.innerHTML = '<span class="text-stone-400 font-mono text-xs italic">[空公式]</span>';
    } else {
      this.previewEl.innerHTML = renderMathToString(latex, false);
    }
  }

  private setupListeners() {
    this.previewEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.enterEditMode();
    });

    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        this.saveAndExit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.cancelEdit();
      }
    });

    this.inputEl.addEventListener('blur', () => {
      if (this.isEditing) {
        this.saveAndExit();
      }
    });

    // 阻止输入框击键向上冒泡引起 ProseMirror 误拦截
    this.inputEl.addEventListener('keyup', (e) => e.stopPropagation());
    this.inputEl.addEventListener('keypress', (e) => e.stopPropagation());
  }

  private enterEditMode() {
    this.isEditing = true;
    this.previewEl.classList.add('hidden');
    this.editorEl.classList.remove('hidden');
    this.editorEl.classList.add('inline-flex');
    this.inputEl.value = this.node.attrs.value || '';
    setTimeout(() => {
      this.inputEl.focus();
      this.inputEl.select();
    }, 20);
  }

  private saveAndExit() {
    const nextValue = this.inputEl.value.trim();
    this.isEditing = false;
    this.editorEl.classList.add('hidden');
    this.editorEl.classList.remove('inline-flex');
    this.previewEl.classList.remove('hidden');

    const pos = this.getPos();
    if (typeof pos === 'number' && nextValue !== this.node.attrs.value) {
      const tr = this.view.state.tr.setNodeMarkup(pos, undefined, {
        ...this.node.attrs,
        value: nextValue,
      });
      this.view.dispatch(tr);
    } else {
      this.renderFormula();
    }
    this.view.focus();
  }

  private cancelEdit() {
    this.isEditing = false;
    this.editorEl.classList.add('hidden');
    this.editorEl.classList.remove('inline-flex');
    this.previewEl.classList.remove('hidden');
    this.renderFormula();
    this.view.focus();
  }

  update(node: Node): boolean {
    if (node.type !== this.node.type) return false;
    this.node = node;
    if (!this.isEditing) {
      this.renderFormula();
    }
    return true;
  }

  selectNode() {
    this.dom.classList.add('ring-2', 'ring-blue-400', 'rounded');
  }

  deselectNode() {
    this.dom.classList.remove('ring-2', 'ring-blue-400', 'rounded');
  }

  destroy() {
    // 清理
  }
}
