import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../../src/renderer/App';

describe('App Scaffold (AC1.1)', () => {
  it('renders macOS window header, document title and status', () => {
    const { container } = render(<App />);
    expect(screen.getByText('Untitled.md')).toBeInTheDocument();
    expect(screen.getByText('已自动保存')).toBeInTheDocument();
    const cmElement = container.querySelector('.cm-editor');
    expect(cmElement).not.toBeNull();
  });
});
