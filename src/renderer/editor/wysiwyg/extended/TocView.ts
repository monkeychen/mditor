import type { Node } from '@milkdown/prose/model';
import type { EditorView, NodeView } from '@milkdown/prose/view';

export class TocView implements NodeView {
  dom: HTMLElement;
  private listEl: HTMLElement;

  constructor(
    private node: Node,
    private view: EditorView,
    _getPos: () => number | undefined
  ) {
    this.dom = document.createElement('div');
    this.dom.className =
      'toc-block-card p-4 my-6 rounded-xl border border-blue-100 bg-blue-50/40 space-y-2 select-none shadow-2xs';

    const header = document.createElement('div');
    header.className =
      'flex items-center justify-between text-xs font-semibold text-blue-900 border-b border-blue-100/80 pb-2';
    header.innerHTML = `
      <span class="flex items-center gap-1.5">
        <span>📑</span>
        <span>自动目录块 [TOC]</span>
      </span>
      <span class="text-[10px] text-blue-600 font-normal">点击平滑定位</span>
    `;

    this.listEl = document.createElement('ul');
    this.listEl.className = 'text-xs text-blue-800/90 space-y-1.5 pl-2 font-medium';

    this.dom.appendChild(header);
    this.dom.appendChild(this.listEl);

    this.renderHeadings();
  }

  private renderHeadings() {
    this.listEl.innerHTML = '';
    const headings: { text: string; level: number; index: number }[] = [];
    let headingIdx = 0;

    this.view.state.doc.descendants((node) => {
      if (node.type.name === 'heading') {
        headings.push({
          text: node.textContent,
          level: node.attrs.level || 1,
          index: headingIdx++,
        });
      }
    });

    if (headings.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'text-stone-400 text-xs italic pl-2';
      emptyLi.textContent = '暂无标题（输入 # 创建标题可自动生成目录）';
      this.listEl.appendChild(emptyLi);
      return;
    }

    headings.forEach((h) => {
      const li = document.createElement('li');
      // 缩进级别
      const indentClass = h.level > 1 ? `pl-${Math.min(12, (h.level - 1) * 4)}` : '';
      li.className = `cursor-pointer hover:underline hover:text-blue-950 flex items-center gap-1.5 transition ${indentClass}`;
      li.innerHTML = `<span>•</span><span>${h.text || `H${h.level} 标题`}</span>`;

      li.addEventListener('click', (e) => {
        e.stopPropagation();
        const domHeadings = this.view.dom.querySelectorAll(
          '.ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror h6'
        );
        const target = domHeadings[h.index] as HTMLElement | undefined;
        if (target && typeof target.scrollIntoView === 'function') {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });

      this.listEl.appendChild(li);
    });
  }

  update(newNode: Node): boolean {
    if (newNode.type !== this.node.type) return false;
    this.node = newNode;
    this.renderHeadings();
    return true;
  }

  destroy() {
    // cleanup
  }
}
