import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchPanel from '../../src/renderer/components/SearchPanel';

describe('SearchPanel Component (AC6.1, AC6.2, AC6.3)', () => {
  it('renders search input and counter', () => {
    const handleNext = vi.fn();
    const handlePrev = vi.fn();
    const handleToggle = vi.fn();

    render(
      <SearchPanel
        isOpen={true}
        isReplaceOpen={false}
        query="test"
        replaceText=""
        matches={[{ index: 0, from: 0, to: 4 }, { index: 1, from: 10, to: 14 }]}
        currentIndex={0}
        onQueryChange={vi.fn()}
        onReplaceTextChange={vi.fn()}
        onNext={handleNext}
        onPrev={handlePrev}
        onToggleReplace={handleToggle}
        onReplaceSingle={vi.fn()}
        onReplaceAll={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText('在当前文档中查找...')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    // 触发下一个
    const nextBtn = screen.getByTitle('下一个 (Enter)');
    fireEvent.click(nextBtn);
    expect(handleNext).toHaveBeenCalled();
  });

  it('renders replace row when isReplaceOpen is true', () => {
    render(
      <SearchPanel
        isOpen={true}
        isReplaceOpen={true}
        query="test"
        replaceText="bar"
        matches={[{ index: 0, from: 0, to: 4 }]}
        currentIndex={0}
        onQueryChange={vi.fn()}
        onReplaceTextChange={vi.fn()}
        onNext={vi.fn()}
        onPrev={vi.fn()}
        onToggleReplace={vi.fn()}
        onReplaceSingle={vi.fn()}
        onReplaceAll={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText('替换为...')).toBeInTheDocument();
    expect(screen.getByText('替换')).toBeInTheDocument();
    expect(screen.getByText('全部')).toBeInTheDocument();
  });
});
