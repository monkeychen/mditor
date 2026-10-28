import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import OutlineDrawer from '../../src/renderer/components/OutlineDrawer';

// Polyfill PointerEvent for jsdom if needed
if (typeof window !== 'undefined' && typeof window.PointerEvent === 'undefined') {
  class MockPointerEvent extends MouseEvent {
    pointerId: number;
    _clientX: number;
    constructor(type: string, params: any = {}) {
      super(type, params);
      this.pointerId = params.pointerId || 0;
      this._clientX = params.clientX || 0;
    }
    get clientX() {
      return this._clientX;
    }
  }
  (window as any).PointerEvent = MockPointerEvent;
  (global as any).PointerEvent = MockPointerEvent;
}

describe('Sidebar Resize Handle (T501 / F30 / AC-30.1 ~ AC-30.4)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders with default width of 240px when no saved width in localStorage', () => {
    render(
      <OutlineDrawer
        isOpen={true}
        outline={[]}
        onSelectHeading={vi.fn()}
      />
    );

    const sidebar = screen.getByTestId('typora-sidebar');
    expect(sidebar).toHaveStyle({ width: '240px' });
    expect(screen.getByTestId('sidebar-resize-handle')).toBeInTheDocument();
  });

  it('restores initial width from localStorage if present and within 180-520px', () => {
    localStorage.setItem('mditor_sidebar_width', '320');
    render(
      <OutlineDrawer
        isOpen={true}
        outline={[]}
        onSelectHeading={vi.fn()}
      />
    );

    const sidebar = screen.getByTestId('typora-sidebar');
    expect(sidebar).toHaveStyle({ width: '320px' });
  });

  it('clamps width within 180px - 520px on pointermove drag and persists to localStorage on pointerup', () => {
    render(
      <OutlineDrawer
        isOpen={true}
        outline={[]}
        onSelectHeading={vi.fn()}
      />
    );

    const sidebar = screen.getByTestId('typora-sidebar');
    const handle = screen.getByTestId('sidebar-resize-handle');

    // 1. 开始拖拽
    fireEvent(handle, new PointerEvent('pointerdown', { clientX: 240, bubbles: true }));

    // 2. 移动到 350px
    fireEvent(window, new PointerEvent('pointermove', { clientX: 350 }));
    expect(sidebar).toHaveStyle({ width: '350px' });

    // 3. 移动超过最大限制 600px -> 夹紧为 520px
    fireEvent(window, new PointerEvent('pointermove', { clientX: 600 }));
    expect(sidebar).toHaveStyle({ width: '520px' });

    // 4. 移动低于最小限制 120px -> 夹紧为 180px
    fireEvent(window, new PointerEvent('pointermove', { clientX: 120 }));
    expect(sidebar).toHaveStyle({ width: '180px' });

    // 5. 移动到 280px 并松开鼠标
    fireEvent(window, new PointerEvent('pointermove', { clientX: 280 }));
    fireEvent(window, new PointerEvent('pointerup', { clientX: 280 }));

    expect(sidebar).toHaveStyle({ width: '280px' });
    expect(localStorage.getItem('mditor_sidebar_width')).toBe('280');
  });

  it('resets width to default 240px on double-clicking the resize handle', () => {
    localStorage.setItem('mditor_sidebar_width', '380');
    render(
      <OutlineDrawer
        isOpen={true}
        outline={[]}
        onSelectHeading={vi.fn()}
      />
    );

    const sidebar = screen.getByTestId('typora-sidebar');
    expect(sidebar).toHaveStyle({ width: '380px' });

    const handle = screen.getByTestId('sidebar-resize-handle');
    fireEvent.doubleClick(handle);

    expect(sidebar).toHaveStyle({ width: '240px' });
    expect(localStorage.getItem('mditor_sidebar_width')).toBe('240');
  });
});
