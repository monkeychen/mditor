import { AppTheme } from './themeService';

export type ColorScheme = 'light' | 'dark' | 'system';
export type EditorFontFamily = 'system' | 'sans-serif' | 'serif';
export type CodeFontFamily = 'monospace' | 'jetbrains-mono' | 'fira-code' | 'sf-mono';

export interface EditorPreferences {
  // 外观 Appearance
  theme: AppTheme;
  colorScheme: ColorScheme;

  // 编辑器排版 Editor
  fontFamily: EditorFontFamily;
  fontSize: number; // 13, 14, 15, 16, 18, 20
  lineHeight: number; // 1.5, 1.6, 1.75, 1.8
  maxWidth: number | '100%'; // 720, 860, 1024, '100%'
  codeFontFamily: CodeFontFamily;
  showCodeLineNumbers: boolean;

  // 文件与保存 Files
  autoSaveDelay: number; // 0 (关闭), 1000 (1秒), 5000 (5秒), -1 (失焦时保存)
  restoreLastSession: boolean;
}

export const DEFAULT_PREFERENCES: EditorPreferences = {
  theme: 'github',
  colorScheme: 'system',
  fontFamily: 'system',
  fontSize: 16,
  lineHeight: 1.6,
  maxWidth: 860,
  codeFontFamily: 'monospace',
  showCodeLineNumbers: true,
  autoSaveDelay: 5000,
  restoreLastSession: true,
};

export const FONT_FAMILY_MAP: Record<EditorFontFamily, string> = {
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
  'sans-serif': 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  serif: 'Georgia, "Songti SC", "SimSun", serif',
};

export const CODE_FONT_MAP: Record<CodeFontFamily, string> = {
  monospace: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  'jetbrains-mono': '"JetBrains Mono", ui-monospace, monospace',
  'fira-code': '"Fira Code", ui-monospace, monospace',
  'sf-mono': '"SF Mono", Menlo, Monaco, Consolas, monospace',
};

export const STORAGE_KEY_PREFERENCES = 'mditor_preferences';

/**
 * 获取本地存储的偏好设置，若不存在或损坏则优雅回退至默认设置
 */
export function getStoredPreferences(): EditorPreferences {
  if (typeof localStorage === 'undefined') {
    return { ...DEFAULT_PREFERENCES };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFERENCES);
    if (!raw) {
      return { ...DEFAULT_PREFERENCES };
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

/**
 * 保存偏好设置至本地存储，并返回合并后的完整配置
 */
export function savePreferences(partial: Partial<EditorPreferences>): EditorPreferences {
  const current = getStoredPreferences();
  const updated: EditorPreferences = {
    ...current,
    ...partial,
  };

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  return updated;
}

/**
 * 将偏好设置的 CSS 变量注入至 document.documentElement (即时热重载生效，无需刷新)
 */
export function applyPreferencesToDOM(prefs: EditorPreferences): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.style.setProperty('--editor-font-size', `${prefs.fontSize}px`);
  root.style.setProperty('--editor-line-height', `${prefs.lineHeight}`);
  root.style.setProperty(
    '--editor-max-width',
    prefs.maxWidth === '100%' ? '100%' : `${prefs.maxWidth}px`
  );

  const fontFamily = FONT_FAMILY_MAP[prefs.fontFamily] || FONT_FAMILY_MAP.system;
  root.style.setProperty('--editor-font-family', fontFamily);

  const codeFont = CODE_FONT_MAP[prefs.codeFontFamily] || CODE_FONT_MAP.monospace;
  root.style.setProperty('--editor-code-font', codeFont);
}
