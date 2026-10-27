import type { Node } from '@milkdown/prose/model';
import type { EditorView, NodeView } from '@milkdown/prose/view';
import { renderMermaidToSvg } from '../mermaid/mermaidRenderer';

const COMMON_LANGUAGES = [
  'mermaid',
  'typescript',
  'javascript',
  'python',
  'json',
  'bash',
  'html',
  'css',
  'markdown',
  'sql',
  'go',
  'rust',
  'yaml',
  'c',
  'cpp',
  'java',
];

export class CodeBlockView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;
  node: Node;
  view: EditorView;
  getPos: () => number | undefined;

  private isMermaid: boolean;
  private isEditingSource = false;
  private debounceTimer: any = null;
  private diagramContainer?: HTMLElement;
  private errorBanner?: HTMLElement;
  private errorMsg?: HTMLElement;
  private toggleSourceBtn?: HTMLButtonElement;
  private preEl: HTMLElement;

  constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;

    const currentLang = (node.attrs.language || '').toLowerCase();
    this.isMermaid = currentLang === 'mermaid';

    // 外层包装容器
    const wrapper = document.createElement('div');

    if (this.isMermaid) {
      wrapper.className =
        'cm-code-block-wrapper mermaid-block-wrapper relative group my-6 rounded-2xl border border-stone-200/80 bg-white text-stone-800 shadow-sm overflow-hidden transition-all duration-200';
    } else {
      wrapper.className =
        'cm-code-block-wrapper relative group my-4 rounded-xl overflow-hidden border border-stone-200/80 bg-[#1E1E1E] text-stone-200 shadow-md';
    }

    // 头部工具栏 Header
    const header = document.createElement('div');
    header.contentEditable = 'false';

    if (this.isMermaid) {
      header.className =
        'cm-code-block-header px-4 py-2 bg-stone-50/80 border-b border-stone-100 flex items-center justify-between z-10 select-none text-xs text-stone-600';
    } else {
      header.className =
        'cm-code-block-header absolute top-2 right-2 flex items-center gap-2 z-10 select-none';
    }

    // 左侧：语言选择与标题
    const leftContainer = document.createElement('div');
    leftContainer.className = 'flex items-center gap-2';

    if (this.isMermaid) {
      const titleSpan = document.createElement('span');
      titleSpan.className = 'text-xs font-semibold text-stone-700 flex items-center gap-1.5';
      titleSpan.innerHTML = '<span>📊</span><span>Mermaid 图表</span>';
      leftContainer.appendChild(titleSpan);
    }

    // 语言选择下拉菜单
    const langSelect = document.createElement('select');
    if (this.isMermaid) {
      langSelect.className =
        'code-lang-selector bg-white hover:bg-stone-100 text-stone-700 text-xs px-2 py-0.5 rounded border border-stone-200 font-mono outline-none cursor-pointer transition';
    } else {
      langSelect.className =
        'code-lang-selector bg-stone-800/90 hover:bg-stone-700 text-stone-300 text-xs px-2 py-0.5 rounded border border-stone-700/60 font-mono outline-none cursor-pointer transition';
    }

    const langOptions = [...COMMON_LANGUAGES];
    if (currentLang && !langOptions.includes(currentLang)) {
      langOptions.unshift(currentLang);
    }
    if (!currentLang) {
      langOptions.unshift('');
    }

    langOptions.forEach((lang) => {
      const opt = document.createElement('option');
      opt.value = lang;
      opt.textContent = lang || 'plaintext';
      if (lang === currentLang) {
        opt.selected = true;
      }
      langSelect.appendChild(opt);
    });

    langSelect.addEventListener('change', () => {
      const newLang = langSelect.value;
      const pos = typeof this.getPos === 'function' ? this.getPos() : undefined;
      if (pos !== undefined) {
        const tr = this.view.state.tr.setNodeMarkup(pos, undefined, {
          ...this.node.attrs,
          language: newLang,
        });
        this.view.dispatch(tr);
      }
    });

    leftContainer.appendChild(langSelect);

    // 右侧按钮工具组
    const rightContainer = document.createElement('div');
    rightContainer.className = 'flex items-center gap-1.5';

    // 若为 Mermaid，提供「查看/编辑源码」切换按钮
    if (this.isMermaid) {
      this.toggleSourceBtn = document.createElement('button');
      this.toggleSourceBtn.type = 'button';
      this.toggleSourceBtn.className =
        'mermaid-toggle-source-btn px-2.5 py-1 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-md transition flex items-center gap-1';
      this.toggleSourceBtn.innerHTML = '<span>✏️</span><span>编辑源码</span>';
      this.toggleSourceBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleSource();
      });
      rightContainer.appendChild(this.toggleSourceBtn);
    }

    // 复制代码按钮
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    if (this.isMermaid) {
      copyBtn.className =
        'code-copy-btn px-2.5 py-1 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-md transition flex items-center gap-1';
    } else {
      copyBtn.className =
        'code-copy-btn bg-stone-800/90 hover:bg-stone-700 text-stone-300 hover:text-white text-xs px-2.5 py-0.5 rounded border border-stone-700/60 font-mono flex items-center gap-1 transition';
    }
    copyBtn.innerHTML = '<span>📋</span><span>复制代码</span>';

    copyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const codeText = this.node.textContent;

      const setCopied = () => {
        copyBtn.innerHTML = '<span>✅</span><span>已复制 ✓</span>';
        setTimeout(() => {
          copyBtn.innerHTML = '<span>📋</span><span>复制代码</span>';
        }, 2000);
      };

      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(codeText).then(setCopied);
      }
    });

    rightContainer.appendChild(copyBtn);

    // 若为 Mermaid，提供「导出 SVG」按钮
    if (this.isMermaid) {
      const exportSvgBtn = document.createElement('button');
      exportSvgBtn.type = 'button';
      exportSvgBtn.className =
        'mermaid-export-svg-btn px-2.5 py-1 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-md transition flex items-center gap-1';
      exportSvgBtn.innerHTML = '<span>💾</span><span>导出 SVG</span>';
      exportSvgBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.exportSvg();
      });
      rightContainer.appendChild(exportSvgBtn);
    }

    if (this.isMermaid) {
      header.appendChild(leftContainer);
      header.appendChild(rightContainer);
    } else {
      header.appendChild(langSelect);
      header.appendChild(copyBtn);
    }

    // 内容区 pre 与 code
    const pre = document.createElement('pre');
    const code = document.createElement('code');

    if (this.isMermaid) {
      // Mermaid 模式：抽屉式折叠源码
      pre.className =
        'mermaid-source-drawer max-h-0 overflow-hidden opacity-0 p-0 m-0 border-0 pointer-events-none transition-all duration-200';
      code.className = 'font-mono text-xs text-stone-800 outline-none leading-relaxed block';
    } else {
      pre.className =
        'p-5 pt-8 text-sm font-mono overflow-x-auto leading-relaxed text-emerald-400 bg-transparent m-0';
      code.className = 'font-mono text-emerald-300';
    }

    pre.appendChild(code);
    this.preEl = pre;

    wrapper.appendChild(header);

    // 若为 Mermaid，挂载源码折叠抽屉与 SVG 图表展示容器
    if (this.isMermaid) {
      wrapper.appendChild(pre);

      this.errorBanner = document.createElement('div');
      this.errorBanner.className =
        'mermaid-error-banner hidden m-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2 select-none';
      this.errorMsg = document.createElement('span');
      this.errorBanner.innerHTML = '<span>⚠️</span>';
      this.errorBanner.appendChild(this.errorMsg);
      wrapper.appendChild(this.errorBanner);

      this.diagramContainer = document.createElement('div');
      this.diagramContainer.className =
        'mermaid-diagram-container p-6 flex flex-col items-center justify-center min-h-[140px] bg-white overflow-x-auto select-none cursor-pointer';
      this.diagramContainer.title = '点击展开/编辑 Mermaid 源码';
      this.diagramContainer.addEventListener('click', () => {
        this.toggleSource();
      });
      wrapper.appendChild(this.diagramContainer);

      // 初次挂载时触发渲染
      this.renderMermaidAsync();
    } else {
      wrapper.appendChild(pre);
    }

    this.dom = wrapper;
    this.contentDOM = code;
  }

  private toggleSource() {
    this.isEditingSource = !this.isEditingSource;
    if (this.isEditingSource) {
      this.preEl.className =
        'mermaid-source-drawer max-h-[600px] overflow-auto opacity-100 p-4 border-b border-stone-200 bg-stone-50/70 font-mono text-xs text-stone-800 transition-all duration-200';
      if (this.toggleSourceBtn) {
        this.toggleSourceBtn.innerHTML = '<span>✕</span><span>收起源码</span>';
      }
      setTimeout(() => {
        this.contentDOM.focus();
      }, 50);
    } else {
      this.preEl.className =
        'mermaid-source-drawer max-h-0 overflow-hidden opacity-0 p-0 m-0 border-0 pointer-events-none transition-all duration-200';
      if (this.toggleSourceBtn) {
        this.toggleSourceBtn.innerHTML = '<span>✏️</span><span>编辑源码</span>';
      }
    }
  }

  private renderMermaidAsync() {
    if (!this.isMermaid || !this.diagramContainer) return;

    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(async () => {
      const codeText = this.node.textContent;
      const pos = typeof this.getPos === 'function' ? this.getPos() : 0;
      const res = await renderMermaidToSvg(String(pos || 'root'), codeText);

      if (!this.diagramContainer) return;

      if (res.success && res.svg) {
        this.diagramContainer.innerHTML = res.svg;
        if (this.errorBanner) {
          this.errorBanner.classList.add('hidden');
        }
      } else if (!res.success) {
        if (this.errorBanner && this.errorMsg) {
          this.errorBanner.classList.remove('hidden');
          this.errorMsg.textContent = 'Mermaid 语法提示: ' + (res.error || '语法错误');
        }
      }
    }, 150);
  }

  private exportSvg() {
    if (!this.diagramContainer) return;
    const svgEl = this.diagramContainer.querySelector('svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(svgData);
    }
    // 触发下载
    try {
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mermaid-diagram.svg';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }

  update(newNode: Node): boolean {
    if (newNode.type !== this.node.type) return false;
    const oldLang = (this.node.attrs.language || '').toLowerCase();
    const newLang = (newNode.attrs.language || '').toLowerCase();
    if (oldLang !== newLang) {
      // 语言切换，重建视图以应用对应模式
      return false;
    }
    this.node = newNode;

    if (this.isMermaid) {
      this.renderMermaidAsync();
    }
    return true;
  }

  ignoreMutation(mutation: any): boolean {
    // 任何发生在 header、diagramContainer 或非 code 区域的 DOM 变更，由组件自身维护
    return !this.contentDOM || !this.contentDOM.contains(mutation.target);
  }

  stopEvent(event: Event): boolean {
    const target = event.target as HTMLElement | null;
    if (
      target &&
      (target.closest('.cm-code-block-header') ||
        target.closest('.mermaid-diagram-container') ||
        target.closest('.mermaid-error-banner') ||
        target.tagName === 'SELECT' ||
        target.tagName === 'BUTTON')
    ) {
      return true;
    }
    return false;
  }
}
