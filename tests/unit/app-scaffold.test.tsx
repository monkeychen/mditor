import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../../src/renderer/App';

describe('App Scaffold (M2)', () => {
  it('renders macOS tabs bar and outline drawer', () => {
    const { container } = render(<App />);
    expect(screen.getByText('macOS-Philosophy.md')).toBeInTheDocument();
    expect(screen.getByText('文档大纲')).toBeInTheDocument();
    const cmElement = container.querySelector('.cm-editor');
    expect(cmElement).not.toBeNull();
  });
});
