import mermaid from 'mermaid';

let isInitialized = false;

export function initMermaid() {
  if (isInitialized) return;
  try {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
    });
    isInitialized = true;
  } catch (e) {
    console.error('[Mermaid] Initialization error:', e);
  }
}

export interface MermaidRenderResult {
  success: boolean;
  svg?: string;
  error?: string;
}

export async function renderMermaidToSvg(
  id: string,
  code: string
): Promise<MermaidRenderResult> {
  const cleanCode = code.trim();
  if (!cleanCode) {
    return { success: true, svg: '' };
  }

  try {
    initMermaid();
    // 保证唯一合法 ID
    const validId = `mermaid_${id.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}`;
    const { svg } = await mermaid.render(validId, cleanCode);
    return { success: true, svg };
  } catch (err: any) {
    // 清理 mermaid.render 失败时插入在 body 末尾的残留临时 DOM
    if (typeof document !== 'undefined') {
      const errorElements = document.querySelectorAll('[id^="dmermaid"], [id^="mermaid_"]');
      errorElements.forEach((el) => {
        if (!el.closest('.mermaid-card')) {
          el.remove();
        }
      });
    }

    const message = err?.message || (typeof err === 'string' ? err : '语法解析失败');
    return {
      success: false,
      error: message,
    };
  }
}
