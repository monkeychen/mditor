import type { Node } from '@milkdown/prose/model';
import type { EditorView, NodeView } from '@milkdown/prose/view';

const COMMON_LANGUAGES = [
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

  constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;

    // 外层包装容器
    const wrapper = document.createElement('div');
    wrapper.className =
      'cm-code-block-wrapper relative group my-4 rounded-xl overflow-hidden border border-stone-200/80 bg-[#1E1E1E] text-stone-200 shadow-md';

    // 右上角浮动 Header
    const header = document.createElement('div');
    header.contentEditable = 'false';
    header.className =
      'cm-code-block-header absolute top-2 right-2 flex items-center gap-2 z-10 select-none';

    // 语言选择下拉菜单
    const langSelect = document.createElement('select');
    langSelect.className =
      'code-lang-selector bg-stone-800/90 hover:bg-stone-700 text-stone-300 text-xs px-2 py-0.5 rounded border border-stone-700/60 font-mono outline-none cursor-pointer transition';

    const currentLang = (node.attrs.language || '').toLowerCase();

    // 填充常用语言列表（若当前语言不在常用列表中，优先置顶）
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

    // 复制代码按钮
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className =
      'code-copy-btn bg-stone-800/90 hover:bg-stone-700 text-stone-300 hover:text-white text-xs px-2.5 py-0.5 rounded border border-stone-700/60 font-mono flex items-center gap-1 transition';
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

      const fallbackCopy = () => {
        try {
          const ta = document.createElement('textarea');
          ta.value = codeText;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        } catch {
          // ignore
        }
        setCopied();
      };

      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard
          .writeText(codeText)
          .then(setCopied)
          .catch(() => {
            fallbackCopy();
          });
      } else {
        fallbackCopy();
      }
    });

    header.appendChild(langSelect);
    header.appendChild(copyBtn);

    // 内容区 pre 与 code
    const pre = document.createElement('pre');
    pre.className =
      'p-5 pt-8 text-sm font-mono overflow-x-auto leading-relaxed text-emerald-400 bg-transparent m-0';
    const code = document.createElement('code');
    code.className = 'font-mono text-emerald-300';
    pre.appendChild(code);

    wrapper.appendChild(header);
    wrapper.appendChild(pre);

    this.dom = wrapper;
    this.contentDOM = code;
  }

  update(newNode: Node): boolean {
    if (newNode.type !== this.node.type) return false;
    this.node = newNode;
    return true;
  }

  ignoreMutation(mutation: any): boolean {
    // 任何发生在 header 或非 code 区域的 DOM 变更，均由组件自身管理，禁止 ProseMirror 重置
    return !this.contentDOM || !this.contentDOM.contains(mutation.target);
  }

  stopEvent(event: Event): boolean {
    const target = event.target as HTMLElement | null;
    if (
      target &&
      (target.closest('.cm-code-block-header') ||
        target.tagName === 'SELECT' ||
        target.tagName === 'BUTTON')
    ) {
      return true;
    }
    return false;
  }
}
