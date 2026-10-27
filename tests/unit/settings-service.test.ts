import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_PREFERENCES,
  getStoredPreferences,
  savePreferences,
  applyPreferencesToDOM,
  FONT_FAMILY_MAP,
  CODE_FONT_MAP,
  EditorPreferences,
} from '../../src/renderer/services/settingsService';

describe('Settings Service (T409 / AC-27.2 ~ AC-27.3)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.cssText = '';
  });

  it('returns default preferences when localStorage is empty', () => {
    const prefs = getStoredPreferences();
    expect(prefs).toEqual(DEFAULT_PREFERENCES);
    expect(prefs.fontSize).toBe(16);
    expect(prefs.maxWidth).toBe(860);
    expect(prefs.lineHeight).toBe(1.6);
  });

  it('safely merges partial or corrupted stored data with defaults', () => {
    localStorage.setItem('mditor_preferences', JSON.stringify({ fontSize: 18 }));
    const prefs = getStoredPreferences();
    expect(prefs.fontSize).toBe(18);
    expect(prefs.maxWidth).toBe(860); // 兜底保持默认值
    expect(prefs.theme).toBe('github');

    // 损坏数据容错
    localStorage.setItem('mditor_preferences', 'invalid-json{{{');
    const fallback = getStoredPreferences();
    expect(fallback).toEqual(DEFAULT_PREFERENCES);
  });

  it('saves preferences to localStorage and returns merged object', () => {
    const updated = savePreferences({ fontSize: 20, maxWidth: 1024 });
    expect(updated.fontSize).toBe(20);
    expect(updated.maxWidth).toBe(1024);

    const stored = JSON.parse(localStorage.getItem('mditor_preferences') || '{}');
    expect(stored.fontSize).toBe(20);
    expect(stored.maxWidth).toBe(1024);
  });

  it('applies preferences CSS variables to document.documentElement', () => {
    const customPrefs: EditorPreferences = {
      ...DEFAULT_PREFERENCES,
      fontSize: 18,
      lineHeight: 1.75,
      maxWidth: 1024,
      fontFamily: 'serif',
      codeFontFamily: 'jetbrains-mono',
    };

    applyPreferencesToDOM(customPrefs);

    expect(document.documentElement.style.getPropertyValue('--editor-font-size')).toBe('18px');
    expect(document.documentElement.style.getPropertyValue('--editor-line-height')).toBe('1.75');
    expect(document.documentElement.style.getPropertyValue('--editor-max-width')).toBe('1024px');
    expect(document.documentElement.style.getPropertyValue('--editor-font-family')).toBe(FONT_FAMILY_MAP.serif);
    expect(document.documentElement.style.getPropertyValue('--editor-code-font')).toBe(CODE_FONT_MAP['jetbrains-mono']);
  });

  it('applies 100% max-width properly when configured as 100%', () => {
    applyPreferencesToDOM({
      ...DEFAULT_PREFERENCES,
      maxWidth: '100%',
    });

    expect(document.documentElement.style.getPropertyValue('--editor-max-width')).toBe('100%');
  });
});
