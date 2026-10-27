import type { Node } from '@milkdown/prose/model';
import type { EditorView, NodeView } from '@milkdown/prose/view';

export class FrontmatterView implements NodeView {
  dom: HTMLElement;
  private headerEl: HTMLElement;
  private bodyEl: HTMLElement;
  private toggleBtn: HTMLButtonElement;
  private toggleText: HTMLElement;
  private isExpanded = true;

  constructor(
    private node: Node,
    _view: EditorView,
    _getPos: () => number | undefined
  ) {
    this.dom = document.createElement('div');
    this.dom.className =
      'frontmatter-card my-4 rounded-xl border border-stone-200/90 bg-stone-50/70 overflow-hidden shadow-2xs select-none transition-all duration-150';

    // 头部栏
    this.headerEl = document.createElement('div');
    this.headerEl.className =
      'px-3.5 py-2 flex items-center justify-between cursor-pointer hover:bg-stone-100/70 transition';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'flex items-center gap-2 text-xs font-semibold text-stone-700';
    titleDiv.innerHTML = '<span>📄</span><span>文档元数据 (YAML Front Matter)</span>';

    this.toggleBtn = document.createElement('button');
    this.toggleBtn.type = 'button';
    this.toggleBtn.className = 'text-xs text-stone-500 hover:text-stone-800 transition font-sans';
    this.toggleText = document.createElement('span');
    this.toggleText.textContent = '▲ 收起';
    this.toggleBtn.appendChild(this.toggleText);

    this.headerEl.appendChild(titleDiv);
    this.headerEl.appendChild(this.toggleBtn);

    // 内容展示区
    this.bodyEl = document.createElement('div');
    this.bodyEl.className =
      'p-3.5 pt-2.5 font-mono text-xs text-stone-700 space-y-1 border-t border-stone-200/40 bg-white/60 leading-relaxed';

    this.renderContent();

    this.headerEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    this.dom.appendChild(this.headerEl);
    this.dom.appendChild(this.bodyEl);
  }

  private toggle() {
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded) {
      this.bodyEl.classList.remove('hidden');
      this.toggleText.textContent = '▲ 收起';
    } else {
      this.bodyEl.classList.add('hidden');
      this.toggleText.textContent = '▼ 展开';
    }
  }

  private renderContent() {
    const rawYaml = this.node.attrs.value || '';
    this.bodyEl.innerHTML = '';

    const lines = rawYaml.split('\n').filter((l: string) => l.trim().length > 0);
    if (lines.length === 0) {
      this.bodyEl.innerHTML = '<span class="text-stone-400 italic">（空元数据）</span>';
      return;
    }

    for (const line of lines) {
      const lineDiv = document.createElement('div');
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim();
        const val = line.slice(colonIdx + 1).trim();
        lineDiv.innerHTML = `<span class="text-purple-600 font-semibold">${key}:</span> <span class="text-stone-800">${val}</span>`;
      } else {
        lineDiv.textContent = line;
      }
      this.bodyEl.appendChild(lineDiv);
    }
  }

  update(newNode: Node): boolean {
    if (newNode.type !== this.node.type) return false;
    this.node = newNode;
    this.renderContent();
    return true;
  }

  destroy() {
    // cleanup
  }
}
