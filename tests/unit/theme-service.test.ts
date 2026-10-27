import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_THEME,
  THEME_LIST,
  getStoredTheme,
  setAppTheme,
  isDarkTheme,
} from '../../src/renderer/services/themeService';

describe('Theme Service (T401 / AC-22.1 / AC-22.3)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('provides the 4 standard Typora-style themes', () => {
    const ids = THEME_LIST.map((t) => t.id);
    expect(ids).toEqual(['macos-light', 'github', 'night', 'newsprint']);
    expect(DEFAULT_THEME).toBe('macos-light');
  });

  it('reads default theme when localStorage is empty', () => {
    expect(getStoredTheme()).toBe('macos-light');
  });

  it('reads stored theme when valid theme exists in localStorage', () => {
    localStorage.setItem('mditor:theme', 'night');
    expect(getStoredTheme()).toBe('night');

    localStorage.setItem('mditor:theme', 'newsprint');
    expect(getStoredTheme()).toBe('newsprint');
  });

  it('falls back to default theme if invalid theme string is in localStorage', () => {
    localStorage.setItem('mditor:theme', 'invalid-theme-xyz');
    expect(getStoredTheme()).toBe('macos-light');
  });

  it('persists theme into localStorage and updates DOM attribute', () => {
    setAppTheme('night');
    expect(localStorage.getItem('mditor:theme')).toBe('night');
    expect(document.documentElement.getAttribute('data-theme')).toBe('night');

    setAppTheme('github');
    expect(localStorage.getItem('mditor:theme')).toBe('github');
    expect(document.documentElement.getAttribute('data-theme')).toBe('github');
  });

  it('correctly identifies dark themes', () => {
    expect(isDarkTheme('night')).toBe(true);
    expect(isDarkTheme('macos-light')).toBe(false);
    expect(isDarkTheme('github')).toBe(false);
    expect(isDarkTheme('newsprint')).toBe(false);
  });
});
