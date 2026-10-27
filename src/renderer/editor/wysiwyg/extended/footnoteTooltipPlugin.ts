import { Plugin, PluginKey } from '@milkdown/prose/state';

export const footnoteTooltipPluginKey = new PluginKey('mditor_footnote_tooltip_plugin');

export function createFootnoteTooltipPlugin(): Plugin {
  let tooltipEl: HTMLElement | null = null;
  let tooltipHeader: HTMLElement | null = null;
  let tooltipBody: HTMLElement | null = null;

  function ensureTooltip(): HTMLElement {
    if (tooltipEl && document.body.contains(tooltipEl)) {
      return tooltipEl;
    }

    tooltipEl = document.createElement('div');
    tooltipEl.className =
      'mditor-footnote-tooltip hidden fixed z-50 p-3 bg-white/95 backdrop-blur-md border border-stone-200/90 rounded-xl shadow-xl max-w-sm text-xs text-stone-700 animate-in fade-in duration-100 select-none pointer-events-auto';

    tooltipHeader = document.createElement('div');
    tooltipHeader.className =
      'flex items-center justify-between text-[10px] text-stone-400 border-b border-stone-100 pb-1 mb-1.5 font-mono';

    tooltipBody = document.createElement('p');
    tooltipBody.className = 'leading-relaxed text-stone-800 text-xs';

    tooltipEl.appendChild(tooltipHeader);
    tooltipEl.appendChild(tooltipBody);
    document.body.appendChild(tooltipEl);

    return tooltipEl;
  }

  function handleShow(view: import('@milkdown/prose/view').EditorView, event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (!target) return false;

    const refEl = target.closest(
      '.footnote-ref, [data-type="footnote_reference"], sup'
    ) as HTMLElement | null;
    if (!refEl) return false;

    // 获取脚注标识 label
    const label =
      refEl.getAttribute('data-label') ||
      refEl.textContent?.replace(/[\[\]^]/g, '').trim() ||
      '1';

    // 从 ProseMirror doc 中查找对应脚注定义的正文
    let defText = '';
    view.state.doc.descendants((node) => {
      if (
        node.type.name === 'footnote_definition' ||
        node.type.name === 'footnote_def'
      ) {
        const nodeLabel = node.attrs.label || node.attrs.identifier || '';
        if (!nodeLabel || nodeLabel === label) {
          defText = node.textContent;
        }
      }
    });

    if (!defText) {
      // 从 DOM 查找兜底
      const defDom = view.dom.querySelector(
        `.footnote-definition, [data-label="${label}"], .footnote-def`
      );
      if (defDom) {
        defText = defDom.textContent || '';
      }
    }

    if (!defText) return false;

    const tip = ensureTooltip();
    if (tooltipHeader) {
      tooltipHeader.innerHTML = `<span>💡 脚注 [^${label}] 预览</span><span class="text-[9px] text-blue-500">点击定位</span>`;
    }
    if (tooltipBody) {
      tooltipBody.textContent = defText;
    }

    const rect = refEl.getBoundingClientRect();
    tip.style.left = `${Math.max(10, rect.left - 20)}px`;
    tip.style.top = `${Math.max(10, rect.top - 80)}px`;
    tip.classList.remove('hidden');

    return false;
  }

  function handleHide(_view: import('@milkdown/prose/view').EditorView, event: MouseEvent) {
    const related = event.relatedTarget as HTMLElement | null;
    if (tooltipEl && (!related || !tooltipEl.contains(related))) {
      tooltipEl.classList.add('hidden');
    }
    return false;
  }

  return new Plugin({
    key: footnoteTooltipPluginKey,
    props: {
      handleDOMEvents: {
        mouseover: handleShow,
        mouseenter: handleShow,
        mouseout: handleHide,
        mouseleave: handleHide,

        click(view, event) {
          const target = event.target as HTMLElement | null;
          if (!target) return false;

          const refEl = target.closest(
            '.footnote-ref, [data-type="footnote_reference"], sup'
          ) as HTMLElement | null;
          if (!refEl) return false;

          if (tooltipEl) {
            tooltipEl.classList.add('hidden');
          }

          // 平滑滚动到底部脚注定义
          const label =
            refEl.getAttribute('data-label') ||
            refEl.textContent?.replace(/[\[\]^]/g, '').trim() ||
            '1';

          const defDom = view.dom.querySelector(
            `.footnote-definition, [data-label="${label}"], .footnote-def, dl`
          );
          if (defDom && typeof defDom.scrollIntoView === 'function') {
            defDom.scrollIntoView({ behavior: 'smooth', block: 'center' });
            defDom.classList.add('bg-amber-100/60');
            setTimeout(() => defDom.classList.remove('bg-amber-100/60'), 1500);
            return true;
          }

          return false;
        },
      },
    },
    destroy() {
      if (tooltipEl && document.body.contains(tooltipEl)) {
        tooltipEl.remove();
        tooltipEl = null;
      }
    },
  });
}
