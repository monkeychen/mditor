export type AppTheme = 'macos-light' | 'github' | 'night' | 'newsprint';

export interface ThemeConfig {
  id: AppTheme;
  label: string;
  icon: string;
  description: string;
  isDark: boolean;
  accentColor: string;
  previewBg: string;
}

export const THEME_STORAGE_KEY = 'mditor:theme';
export const DEFAULT_THEME: AppTheme = 'macos-light';

export const THEME_LIST: ThemeConfig[] = [
  {
    id: 'macos-light',
    label: 'macOS Light',
    icon: '☀️',
    description: 'macOS 现代简约清爽浅色',
    isDark: false,
    accentColor: '#2563EB',
    previewBg: '#FFFFFF',
  },
  {
    id: 'github',
    label: 'GitHub',
    icon: '🐙',
    description: 'GitHub 官方文档清晰对比排版',
    isDark: false,
    accentColor: '#0969DA',
    previewBg: '#F6F8FA',
  },
  {
    id: 'night',
    label: 'Night (暗黑)',
    icon: '🌙',
    description: 'Typora 经典暗黑深炭灰护眼模式',
    isDark: true,
    accentColor: '#3B82F6',
    previewBg: '#1E1E1E',
  },
  {
    id: 'newsprint',
    label: 'Newsprint (羊皮纸)',
    icon: '📰',
    description: '温润米黄羊皮纸与典雅衬线字体',
    isDark: false,
    accentColor: '#B45309',
    previewBg: '#F6F3ED',
  },
];

type ThemeListener = (theme: AppTheme) => void;
const listeners = new Set<ThemeListener>();

/**
 * 获取本地持久化的主题，若无或无效则返回默认主题
 */
export function getStoredTheme(): AppTheme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && THEME_LIST.some((t) => t.id === stored)) {
      return stored as AppTheme;
    }
  } catch {
    // ignore localStorage errors (e.g. during SSR or restricted context)
  }
  return DEFAULT_THEME;
}

/**
 * 将主题应用到 DOM 根节点
 */
export function applyThemeToDOM(theme: AppTheme): void {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

/**
 * 设置并持久化当前应用主题，并通知所有已注册的监听器
 */
export function setAppTheme(theme: AppTheme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore
  }

  applyThemeToDOM(theme);

  // 广播通知
  listeners.forEach((listener) => {
    try {
      listener(theme);
    } catch (e) {
      console.error('[ThemeService] listener error:', e);
    }
  });
}

/**
 * 订阅主题变更事件
 */
export function subscribeThemeChange(listener: ThemeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * 判断指定主题是否为深色暗黑主题
 */
export function isDarkTheme(theme: AppTheme): boolean {
  const cfg = THEME_LIST.find((t) => t.id === theme);
  return cfg ? cfg.isDark : false;
}
