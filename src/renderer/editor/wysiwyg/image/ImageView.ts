import type { Node } from '@milkdown/prose/model';
import type { EditorView, NodeView } from '@milkdown/prose/view';

function joinAndNormalize(baseDir: string, relativePath: string): string {
  const normalizedBase = baseDir.replace(/\\/g, '/');
  const normalizedRel = relativePath.replace(/\\/g, '/');
  const parts = (normalizedBase + '/' + normalizedRel).split('/');
  const resolved: string[] = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      resolved.pop();
    } else {
      resolved.push(part);
    }
  }
  const isAbs = normalizedBase.startsWith('/');
  return (isAbs ? '/' : '') + resolved.join('/');
}

export function resolveImageSource(rawSrc: string, docFilePath: string | null): string {
  if (!rawSrc) return '';
  if (
    rawSrc.startsWith('http://') ||
    rawSrc.startsWith('https://') ||
    rawSrc.startsWith('data:')
  ) {
    return rawSrc;
  }
  if (rawSrc.startsWith('local-file://')) {
    return rawSrc;
  }

  let absPath = rawSrc;
  if (rawSrc.startsWith('file://')) {
    absPath = rawSrc.replace(/^file:\/\//, '');
  } else if (!rawSrc.startsWith('/') && !/^[a-zA-Z]:[/\\]/.test(rawSrc)) {
    // 相对路径 (基于文档所在目录)
    if (docFilePath) {
      const normalizedDoc = docFilePath.replace(/\\/g, '/');
      const lastSlash = normalizedDoc.lastIndexOf('/');
      const docDir = lastSlash > 0 ? normalizedDoc.substring(0, lastSlash) : '';
      absPath = joinAndNormalize(docDir, rawSrc);
    }
  }

  const normalized = absPath.replace(/\\/g, '/');
  if (normalized.startsWith('/') || /^[a-zA-Z]:/.test(normalized)) {
    const urlPath = normalized.startsWith('/') ? normalized : `/${normalized}`;
    return `local-file://localhost${encodeURI(urlPath)}`;
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
    wrapper.contentEditable = 'false';
    wrapper.className =
      'image-widget-wrapper relative group my-4 flex flex-col items-center select-none w-fit max-w-full mx-auto';

    const rawSrc = node.attrs.src || '';
    const alt = node.attrs.alt || '';
    const resolvedSrc = resolveImageSource(rawSrc, this.getDocFilePath());

    // 悬浮微露出 Markdown 源码药丸浮层
    const pill = document.createElement('div');
    pill.contentEditable = 'false';
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
    errorCard.contentEditable = 'false';
    errorCard.className =
      'image-error-card hidden bg-stone-50 border border-dashed border-stone-300 rounded-xl p-5 flex-col items-center justify-center text-center space-y-1.5 max-w-md w-full';
    errorCard.innerHTML = `
      <div class="text-lg">🖼️</div>
      <div class="text-xs font-medium text-stone-700">图片无法加载</div>
      <div class="text-[11px] font-mono text-stone-400 bg-stone-200/50 px-2 py-0.5 rounded truncate max-w-xs">${rawSrc}</div>
    `;
    this.errorCard = errorCard;

    // 监听加载成功与加载失败事件
    img.addEventListener('load', () => {
      img.style.display = '';
      errorCard.classList.add('hidden');
      errorCard.classList.remove('flex');
    });

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

  ignoreMutation(): boolean {
    return true;
  }

  stopEvent(event: Event): boolean {
    const target = event.target as HTMLElement | null;
    if (target && target.closest('.image-source-pill')) {
      return true;
    }
    return false;
  }
}
