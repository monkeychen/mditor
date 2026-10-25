import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OutlineDrawer from '../../src/renderer/components/OutlineDrawer';
import type { OutlineItem } from '../../src/renderer/utils/outline';

describe('OutlineDrawer Component (AC5.1, AC5.2, AC5.4)', () => {
  const mockOutline: OutlineItem[] = [
    { id: '1', level: 1, text: 'Title 1', line: 1, from: 0 },
    { id: '2', level: 2, text: 'Subtitle 2', line: 5, from: 40 },
  ];

  it('renders outline items when open', () => {
    const handleSelect = vi.fn();
    render(
      <OutlineDrawer
        isOpen={true}
        outline={mockOutline}
        onSelectHeading={handleSelect}
      />
    );

    expect(screen.getByText('Title 1')).toBeInTheDocument();
    expect(screen.getByText('Subtitle 2')).toBeInTheDocument();
    expect(screen.getByText('2 个小节')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Subtitle 2'));
    expect(handleSelect).toHaveBeenCalledWith(mockOutline[1]);
  });

  it('hides drawer when isOpen is false', () => {
    const { container } = render(
      <OutlineDrawer
        isOpen={false}
        outline={mockOutline}
        onSelectHeading={vi.fn()}
      />
    );

    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('w-0');
  });
});
