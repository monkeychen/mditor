import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../../src/renderer/App';

describe('App Scaffold (AC1.1)', () => {
  it('renders macOS window header and placeholder editor container', () => {
    const { container } = render(<App />);
    expect(screen.getByText('Untitled.md')).toBeInTheDocument();
    expect(screen.getByText('已保存')).toBeInTheDocument();
    const editorContainer = container.querySelector('#editor-container');
    expect(editorContainer).not.toBeNull();
  });
});
