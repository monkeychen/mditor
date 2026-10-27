import type { Node } from '@milkdown/prose/model';
import type { EditorView, NodeView } from '@milkdown/prose/view';
import { renderMathToString } from './katexRenderer';

export class InlineMathView implements NodeView {
  dom: HTMLElement;
  private previewEl: HTMLElement;
  private popoverEl: HTMLElement;
  private inputEl: HTMLInputElement;
  private previewSlotEl: HTMLElement;
  private isEditing = false;
  private onDocMouseDown: ((e: MouseEvent) => void) | null = null;

  constructor(
    private node: Node,
    private view: EditorView,
    private getPos: () => number | undefined
  ) {
    this.dom = document.createElement('span');
    this.dom.className =
      'inline-math-wrapper relative inline-flex items-center align-baseline select-none';

    // 1. 行内公式预览 Badge（正常状态）
    this.previewEl = document.createElement('span');
    this.previewEl.className =
      'inline-math-preview math-inline-badge inline-flex items-center align-baseline px-1.5 py-0.5 mx-0.5 rounded cursor-pointer transition select-none hover:bg-blue-50/80 hover:outline hover:outline-1 hover:outline-blue-200';
    this.previewEl.title = '点击编辑数学公式';

    // 2. 交互式行内编辑卡片（浮窗弹层，完全对齐原型设计）
    this.popoverEl = document.createElement('div');
    this.popoverEl.className =
      'inline-math-editor inline-math-popover hidden absolute left-0 top-full mt-1.5 z-50 p-3 bg-amber-50/95 backdrop-blur-md border border-amber-300 rounded-xl shadow-xl space-y-2 text-xs min-w-[340px] text-stone-800 animate-in fade-in duration-100';

    // 头部提示
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between text-amber-900 font-semibold mb-1';
    header.innerHTML = `
      <span class="flex items-center gap-1">
        <span>✏️ 正在编辑行内 LaTeX 公式</span>
      </span>
      <span class="text-[10px] text-amber-700 font-mono">按 Enter 确认 / Esc 取消</span>
    `;

    // 输入行
    const inputRow = document.createElement('div');
    inputRow.className = 'flex items-center space-x-1.5';

    const leftDollar = document.createElement('span');
    leftDollar.className = 'font-mono text-stone-400 font-bold';
    leftDollar.textContent = '$';

    this.inputEl = document.createElement('input');
    this.inputEl.type = 'text';
    this.inputEl.className =
      'inline-math-input flex-1 px-2.5 py-1.5 bg-white border border-amber-300 rounded-md font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-900';
    this.inputEl.placeholder = '输入 LaTeX，如 E=mc^2';

    const rightDollar = document.createElement('span');
    rightDollar.className = 'font-mono text-stone-400 font-bold';
    rightDollar.textContent = '$';

    const applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.className =
      'inline-math-apply-btn px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-md font-medium text-xs transition cursor-pointer';
    applyBtn.textContent = '应用';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className =
      'inline-math-cancel-btn px-2.5 py-1.5 text-stone-500 hover:bg-stone-200/50 rounded-md text-xs transition cursor-pointer';
    cancelBtn.textContent = '取消';

    inputRow.appendChild(leftDollar);
    inputRow.appendChild(this.inputEl);
    inputRow.appendChild(rightDollar);
    inputRow.appendChild(applyBtn);
    inputRow.appendChild(cancelBtn);

    // 实时预览槽
    const previewRow = document.createElement('div');
    previewRow.className =
      'inline-preview-row text-[11px] text-stone-500 flex items-center gap-1.5 pt-1.5 border-t border-amber-200/60 overflow-x-auto';
    previewRow.innerHTML = '<span class="shrink-0 text-stone-500">实时预览：</span>';

    this.previewSlotEl = document.createElement('span');
    this.previewSlotEl.className = 'inline-preview-slot font-normal text-stone-900';
    previewRow.appendChild(this.previewSlotEl);

    this.popoverEl.appendChild(header);
    this.popoverEl.appendChild(inputRow);
    this.popoverEl.appendChild(previewRow);

    this.dom.appendChild(this.previewEl);
    this.dom.appendChild(this.popoverEl);

    this.renderFormula();
    this.setupListeners(applyBtn, cancelBtn);
  }

  private renderFormula() {
    const latex = this.node.attrs.value || '';
    if (!latex.trim()) {
      this.previewEl.innerHTML =
        '<span class="text-stone-400 font-mono text-xs italic">[空公式]</span>';
    } else {
      this.previewEl.innerHTML = renderMathToString(latex, false);
    }
  }

  private updatePreview(val: string) {
    const trimmed = val.trim();
    if (!trimmed) {
      this.previewSlotEl.innerHTML =
        '<span class="text-stone-400 font-mono text-xs italic">[请输入公式]</span>';
    } else {
      this.previewSlotEl.innerHTML = renderMathToString(trimmed, false);
    }
  }

  private setupListeners(applyBtn: HTMLButtonElement, cancelBtn: HTMLButtonElement) {
    this.previewEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.enterEditMode();
    });

    this.inputEl.addEventListener('input', () => {
      this.updatePreview(this.inputEl.value);
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
      } else {
        // 阻止按键向上冒泡到 ProseMirror
        e.stopPropagation();
      }
    });

    this.inputEl.addEventListener('keyup', (e) => e.stopPropagation());
    this.inputEl.addEventListener('keypress', (e) => e.stopPropagation());

    applyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.saveAndExit();
    });

    cancelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.cancelEdit();
    });
  }

  private enterEditMode() {
    this.isEditing = true;
    this.previewEl.classList.add('math-inline-editing');

    // 检查弹层位置防溢出
    const rect = this.dom.getBoundingClientRect();
    if (rect.left + 350 > window.innerWidth) {
      this.popoverEl.style.left = 'auto';
      this.popoverEl.style.right = '0';
    } else {
      this.popoverEl.style.left = '0';
      this.popoverEl.style.right = 'auto';
    }

    this.popoverEl.classList.remove('hidden');
    this.inputEl.value = this.node.attrs.value || '';
    this.updatePreview(this.inputEl.value);

    setTimeout(() => {
      this.inputEl.focus();
      this.inputEl.select();
    }, 20);

    // 监听全局点击自动收起保存
    this.onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as globalThis.Node | null;
      if (target && !this.dom.contains(target)) {
        this.saveAndExit();
      }
    };
    document.addEventListener('mousedown', this.onDocMouseDown);
  }

  private cleanupDocListener() {
    if (this.onDocMouseDown) {
      document.removeEventListener('mousedown', this.onDocMouseDown);
      this.onDocMouseDown = null;
    }
  }

  private saveAndExit() {
    this.cleanupDocListener();
    const nextValue = this.inputEl.value.trim();
    this.isEditing = false;
    this.popoverEl.classList.add('hidden');
    this.previewSlotEl.innerHTML = '';
    this.previewEl.classList.remove('math-inline-editing');

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
    this.cleanupDocListener();
    this.isEditing = false;
    this.popoverEl.classList.add('hidden');
    this.previewSlotEl.innerHTML = '';
    this.previewEl.classList.remove('math-inline-editing');
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

  stopEvent(event: Event): boolean {
    if (this.isEditing) {
      return true;
    }
    const target = event.target as HTMLElement | null;
    if (target && this.dom.contains(target) && target !== this.dom) {
      return true;
    }
    return false;
  }

  ignoreMutation(): boolean {
    return true;
  }

  selectNode() {
    this.previewEl.classList.add('ring-2', 'ring-blue-400');
  }

  deselectNode() {
    this.previewEl.classList.remove('ring-2', 'ring-blue-400');
  }

  destroy() {
    this.cleanupDocListener();
  }
}
