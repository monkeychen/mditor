import { describe, it, expect, beforeEach } from 'vitest';
import {
  applyThemeToDOM,
  subscribeThemeChange,
  setAppTheme,
} from '../../src/renderer/services/themeService';

describe('Theme DOM & Event Sync (T402 / AC-22.1 / AC-22.2)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('sets data-theme attribute on documentElement', () => {
    applyThemeToDOM('night');
    expect(document.documentElement.getAttribute('data-theme')).toBe('night');

    applyThemeToDOM('newsprint');
    expect(document.documentElement.getAttribute('data-theme')).toBe('newsprint');
  });

  it('notifies listeners when theme is changed via setAppTheme', () => {
    const received: string[] = [];
    const unsubscribe = subscribeThemeChange((theme) => {
      received.push(theme);
    });

    setAppTheme('github');
    setAppTheme('night');
    setAppTheme('macos-light');

    expect(received).toEqual(['github', 'night', 'macos-light']);
    unsubscribe();

    setAppTheme('newsprint');
    expect(received).toEqual(['github', 'night', 'macos-light']); // 不再增加
  });
});
