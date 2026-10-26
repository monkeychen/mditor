import type { Node } from '@milkdown/prose/model';
import type { EditorView, NodeView } from '@milkdown/prose/view';

export function resolveImageSource(rawSrc: string, docFilePath: string | null): string {
  if (!rawSrc) return '';
  if (
    rawSrc.startsWith('http://') ||
    rawSrc.startsWith('https://') ||
    rawSrc.startsWith('data:') ||
    rawSrc.startsWith('file://')
  ) {
    return rawSrc;
  }
  // 本地绝对路径
  if (rawSrc.startsWith('/')) {
    return `file://${rawSrc}`;
  }
  // 本地相对路径 (基于文档所在目录)
  if (docFilePath) {
    const lastSlash = docFilePath.lastIndexOf('/');
    const docDir = lastSlash > 0 ? docFilePath.substring(0, lastSlash) : '';
    const cleanRelative = rawSrc.startsWith('./') ? rawSrc.slice(2) : rawSrc;
    return `file://${docDir}/${cleanRelative}`;
  }
  return rawSrc;
}

export class ImageView implements NodeView {
  dom: HTMLElement;
  node: Node;
  view: EditorView;
  getPos: () => number | undefined;
  getDocFilePath: () => string | null;

  private imgElement: HTMLImageElement;
  private errorCard: HTMLElement;
  private pill: HTMLElement;

  constructor(
    node: Node,
    view: EditorView,
    getPos: () => number | undefined,
    getDocFilePath: () => string | null
  ) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.getDocFilePath = getDocFilePath;

    // 外层容器
    const wrapper = document.createElement('div');
    wrapper.className =
      'image-widget-wrapper relative group my-4 flex flex-col items-center select-none w-fit max-w-full mx-auto';

    const rawSrc = node.attrs.src || '';
    const alt = node.attrs.alt || '';
    const resolvedSrc = resolveImageSource(rawSrc, this.getDocFilePath());

    // 悬浮微露出 Markdown 源码药丸浮层
    const pill = document.createElement('div');
    pill.className =
      'image-source-pill absolute -top-3.5 bg-stone-900/90 text-white text-[11px] font-mono px-3 py-0.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-150 flex items-center gap-2 z-10 cursor-pointer';
    pill.textContent = `![${alt}](${rawSrc})`;
    pill.title = '点击编辑图片路径与说明';

    pill.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const newPath = window.prompt('编辑图片路径:', rawSrc);
      if (newPath !== null && newPath !== rawSrc) {
        const pos = typeof this.getPos === 'function' ? this.getPos() : undefined;
        if (pos !== undefined) {
          const tr = this.view.state.tr.setNodeMarkup(pos, undefined, {
            ...this.node.attrs,
            src: newPath,
          });
          this.view.dispatch(tr);
        }
      }
    });

    this.pill = pill;
    wrapper.appendChild(pill);

    // 图片元素
    const img = document.createElement('img');
    img.src = resolvedSrc;
    img.alt = alt;
    img.className =
      'max-w-full h-auto rounded-lg shadow-xs border border-stone-200/40 object-contain transition-all';
    this.imgElement = img;

    // 加载失败错误占位卡片 (初始隐藏)
    const errorCard = document.createElement('div');
    errorCard.className =
      'image-error-card hidden bg-stone-50 border border-dashed border-stone-300 rounded-xl p-5 flex-col items-center justify-center text-center space-y-1.5 max-w-md w-full';
    errorCard.innerHTML = `
      <div class="text-lg">🖼️</div>
      <div class="text-xs font-medium text-stone-700">图片无法加载</div>
      <div class="text-[11px] font-mono text-stone-400 bg-stone-200/50 px-2 py-0.5 rounded truncate max-w-xs">${rawSrc}</div>
    `;
    this.errorCard = errorCard;

    // 监听加载失败事件
    img.addEventListener('error', () => {
      img.style.display = 'none';
      errorCard.classList.remove('hidden');
      errorCard.classList.add('flex');
    });

    wrapper.appendChild(img);
    wrapper.appendChild(errorCard);

    this.dom = wrapper;
  }

  update(newNode: Node): boolean {
    if (newNode.type !== this.node.type) return false;
    this.node = newNode;

    const rawSrc = newNode.attrs.src || '';
    const alt = newNode.attrs.alt || '';
    const resolvedSrc = resolveImageSource(rawSrc, this.getDocFilePath());

    this.pill.textContent = `![${alt}](${rawSrc})`;
    this.imgElement.src = resolvedSrc;
    this.imgElement.alt = alt;
    this.imgElement.style.display = '';
    this.errorCard.classList.add('hidden');
    this.errorCard.classList.remove('flex');

    return true;
  }
}
