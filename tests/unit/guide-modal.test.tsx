import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GuideModal } from '../../src/renderer/components/GuideModal';

describe('GuideModal Component (Help Menu Syntax Guides)', () => {
  it('renders modal when isOpen is true and hides when isOpen is false', () => {
    const onClose = vi.fn();

    const { rerender } = render(
      <GuideModal isOpen={false} onClose={onClose} />
    );

    expect(screen.queryByTestId('guide-modal')).not.toBeInTheDocument();

    rerender(
      <GuideModal isOpen={true} onClose={onClose} />
    );

    expect(screen.getByTestId('guide-modal')).toBeInTheDocument();
    expect(screen.getByText(/使用指南/)).toBeInTheDocument();
  });

  it('switches between Markdown, Mermaid, and Math tabs', () => {
    render(<GuideModal isOpen={true} initialTab="markdown" onClose={vi.fn()} />);

    // Default is markdown
    expect(screen.getByTestId('guide-tab-markdown')).toBeInTheDocument();
    expect(screen.getByText(/标题与层级/)).toBeInTheDocument();

    // Switch to Mermaid
    fireEvent.click(screen.getByTestId('guide-tab-mermaid'));
    expect(screen.getByText(/流程图/)).toBeInTheDocument();
    expect(screen.getByText(/时序图/)).toBeInTheDocument();

    // Switch to Math
    fireEvent.click(screen.getByTestId('guide-tab-math'));
    expect(screen.getByText(/行内与独立公式/)).toBeInTheDocument();
    expect(screen.getByText(/微积分与求和/)).toBeInTheDocument();
  });

  it('handles initialTab prop correctly', () => {
    render(<GuideModal isOpen={true} initialTab="mermaid" onClose={vi.fn()} />);

    expect(screen.getByText(/流程图/)).toBeInTheDocument();
  });

  it('triggers onInsertSnippet when clicking insert button', () => {
    const onInsert = vi.fn();
    render(<GuideModal isOpen={true} initialTab="markdown" onClose={vi.fn()} onInsertSnippet={onInsert} />);

    const insertBtns = screen.getAllByTestId('guide-insert-btn');
    expect(insertBtns.length).toBeGreaterThan(0);
    fireEvent.click(insertBtns[0]);

    expect(onInsert).toHaveBeenCalled();
  });

  it('triggers onOpenAsDocument when clicking open full doc button', () => {
    const onOpenDoc = vi.fn();
    render(<GuideModal isOpen={true} initialTab="mermaid" onClose={vi.fn()} onOpenAsDocument={onOpenDoc} />);

    const openDocBtn = screen.getByTestId('guide-open-doc-btn');
    fireEvent.click(openDocBtn);

    expect(onOpenDoc).toHaveBeenCalled();
  });

  it('closes on Escape key, close button click, or backdrop click', () => {
    const onClose = vi.fn();
    render(<GuideModal isOpen={true} onClose={onClose} />);

    // Click close button
    const closeBtn = screen.getByTestId('guide-close-btn');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    // Escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);

    // Backdrop click
    const backdrop = screen.getByTestId('guide-modal-backdrop');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
