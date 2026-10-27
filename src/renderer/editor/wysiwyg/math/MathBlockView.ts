import type { Node } from '@milkdown/prose/model';
import type { EditorView, NodeView } from '@milkdown/prose/view';
import { renderMathToString } from './katexRenderer';

export class MathBlockView implements NodeView {
  dom: HTMLElement;
  private cardEl: HTMLElement;
  private renderEl: HTMLElement;
  private footerEl: HTMLElement;
  private sourcePreviewEl: HTMLElement;

  private drawerEl: HTMLElement;
  private textareaEl: HTMLTextAreaElement;
  private previewSlotEl: HTMLElement;
  private isExpanded = false;
  private onDocMouseDown: ((e: MouseEvent) => void) | null = null;

  constructor(
    private node: Node,
    private view: EditorView,
    private getPos: () => number | undefined
  ) {
    this.dom = document.createElement('div');
    this.dom.className = 'math-block-wrapper my-6 relative select-none';

    // 1. 默认折叠展示态卡片（完全还原原型与用户截图）
    this.cardEl = document.createElement('div');
    this.cardEl.className =
      'math-block-card math-block-container rounded-xl border border-stone-200/90 bg-[#FAFAFA] hover:border-blue-400 hover:shadow-sm transition cursor-pointer overflow-hidden';
    this.cardEl.title = '点击展开交互编辑面板';

    // 上半部分：居中大字号公式展示区
    this.renderEl = document.createElement('div');
    this.renderEl.className = 'math-block-render flex justify-center text-lg p-6 pb-5 overflow-x-auto';

    // 下半部分：TeX 源码条与点击展开提示
    this.footerEl = document.createElement('div');
    this.footerEl.className =
      'math-block-footer border-t border-stone-200/60 px-4 py-2 flex items-center justify-between text-[11px] text-stone-400 font-mono bg-stone-50/70 hover:bg-stone-100/70 transition';

    this.sourcePreviewEl = document.createElement('span');
    this.sourcePreviewEl.className = 'math-block-source-preview truncate max-w-[70%] text-stone-500 font-mono';

    const expandHint = document.createElement('span');
    expandHint.className =
      'text-stone-400 hover:text-blue-600 transition flex items-center gap-1 cursor-pointer shrink-0';
    expandHint.textContent = '点击展开交互编辑面板 ▾';

    this.footerEl.appendChild(this.sourcePreviewEl);
    this.footerEl.appendChild(expandHint);

    this.cardEl.appendChild(this.renderEl);
    this.cardEl.appendChild(this.footerEl);

    // 2. 交互式公式块编辑抽屉面板（完全还原原型与用户截图）
    this.drawerEl = document.createElement('div');
    this.drawerEl.className =
      'math-block-drawer hidden p-4 bg-white border border-blue-400 rounded-xl shadow-xl space-y-3 transition animate-in fade-in duration-150';

    // 顶部标题栏
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between';

    const titleLeft = document.createElement('div');
    titleLeft.className = 'flex items-center gap-1.5 text-xs font-semibold text-blue-900';
    titleLeft.innerHTML = `
      <span>📐 独立公式块编辑器</span>
      <span class="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono font-normal">DisplayMode</span>
    `;

    const titleRight = document.createElement('div');
    titleRight.className = 'flex items-center space-x-2 text-xs';

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className =
      'copy-btn px-2 py-1 text-stone-600 hover:bg-stone-100 rounded border border-stone-200 text-xs transition cursor-pointer';
    copyBtn.textContent = '复制代码';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className =
      'close-btn text-stone-400 hover:text-stone-700 hover:bg-stone-100 px-2 py-0.5 rounded text-xs font-semibold transition cursor-pointer';
    closeBtn.title = '收起';
    closeBtn.textContent = '收起 ✕';

    titleRight.appendChild(copyBtn);
    titleRight.appendChild(closeBtn);
    header.appendChild(titleLeft);
    header.appendChild(titleRight);

    // LaTeX 源码多行文本编辑框
    this.textareaEl = document.createElement('textarea');
    this.textareaEl.rows = 3;
    this.textareaEl.className =
      'w-full p-2.5 bg-white border border-blue-400 rounded-lg font-mono text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y';
    this.textareaEl.placeholder = '输入 LaTeX 表达式，如 \\int_{-\\infty}^{+\\infty} e^{-x^2} dx = \\sqrt{\\pi}';

    // 独立实时公式预览容器（放置在 Textarea 正下方）
    this.previewSlotEl = document.createElement('div');
    this.previewSlotEl.className =
      'math-block-drawer-preview p-3 bg-stone-50/80 rounded-lg border border-stone-100 min-h-[56px] flex items-center justify-center overflow-x-auto';

    // 底部操作栏：右侧「完成」按钮
    const footerAction = document.createElement('div');
    footerAction.className = 'flex justify-end gap-2';

    const doneBtn = document.createElement('button');
    doneBtn.type = 'button';
    doneBtn.className =
      'done-btn px-3.5 py-1.5 text-xs text-stone-700 hover:bg-stone-100 bg-stone-50 border border-stone-200 rounded-lg font-medium transition cursor-pointer';
    doneBtn.textContent = '完成';

    footerAction.appendChild(doneBtn);

    this.drawerEl.appendChild(header);
    this.drawerEl.appendChild(this.textareaEl);
    this.drawerEl.appendChild(this.previewSlotEl);
    this.drawerEl.appendChild(footerAction);

    this.dom.appendChild(this.cardEl);
    this.dom.appendChild(this.drawerEl);

    this.renderFormula();
    this.setupListeners(copyBtn, closeBtn, doneBtn);
  }

  private renderFormula() {
    const latex = (this.node.attrs.value || '').trim();
    if (!latex) {
      this.renderEl.innerHTML =
        '<span class="text-stone-400 font-mono text-xs italic">[空独立公式块 - 点击展开编辑]</span>';
      this.sourcePreviewEl.textContent = 'TeX 源码: [空公式]';
    } else {
      this.renderEl.innerHTML = renderMathToString(latex, true);
      this.sourcePreviewEl.textContent = `TeX 源码: ${latex}`;
    }
  }

  private updateDrawerPreview() {
    const latex = this.textareaEl.value.trim();
    if (!latex) {
      this.previewSlotEl.innerHTML =
        '<span class="text-stone-400 font-mono text-xs italic">[请输入 LaTeX 表达式]</span>';
    } else {
      this.previewSlotEl.innerHTML = renderMathToString(latex, true);
    }
  }

  private setupListeners(
    copyBtn: HTMLButtonElement,
    closeBtn: HTMLButtonElement,
    doneBtn: HTMLButtonElement
  ) {
    this.cardEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.expand();
    });

    this.textareaEl.addEventListener('input', () => {
      this.updateDrawerPreview();
    });

    this.textareaEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.collapse();
      } else {
        // 阻止编辑区内的击键冒泡触发 ProseMirror 删除或换行
        e.stopPropagation();
      }
    });

    this.textareaEl.addEventListener('keyup', (e) => e.stopPropagation());
    this.textareaEl.addEventListener('keypress', (e) => e.stopPropagation());

    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(this.textareaEl.value);
      copyBtn.textContent = '已复制!';
      setTimeout(() => {
        copyBtn.textContent = '复制代码';
      }, 1500);
    });

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.collapse();
    });

    doneBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.collapse();
    });
  }

  private expand() {
    this.isExpanded = true;
    this.cardEl.classList.add('hidden');
    this.drawerEl.classList.remove('hidden');

    this.textareaEl.value = this.node.attrs.value || '';
    this.updateDrawerPreview();

    setTimeout(() => {
      this.textareaEl.focus();
    }, 20);

    this.onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as globalThis.Node | null;
      if (target && !this.dom.contains(target)) {
        this.collapse();
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

  private collapse() {
    this.cleanupDocListener();
    this.isExpanded = false;
    this.drawerEl.classList.add('hidden');
    this.cardEl.classList.remove('hidden');

    const nextValue = this.textareaEl.value.trim();
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

  update(node: Node): boolean {
    if (node.type !== this.node.type) return false;
    this.node = node;
    if (!this.isExpanded) {
      this.renderFormula();
    }
    return true;
  }

  stopEvent(event: Event): boolean {
    if (this.isExpanded) {
      return true;
    }
    const target = event.target as HTMLElement | null;
    if (target && target.closest('.math-block-footer')) {
      return true;
    }
    return false;
  }

  ignoreMutation(): boolean {
    return true;
  }

  selectNode() {
    this.cardEl.classList.add('ring-2', 'ring-blue-400');
  }

  deselectNode() {
    this.cardEl.classList.remove('ring-2', 'ring-blue-400');
  }

  destroy() {
    this.cleanupDocListener();
  }
}
