export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface PlatformActionConfig {
  revealText: string;
  revealShortcut: string;
  trashText: string;
  trashShortcut: string;
  renameShortcut: string;
  copyPathShortcut: string;
}

const WINDOWS_RESERVED_NAMES = new Set([
  'CON',
  'PRN',
  'AUX',
  'NUL',
  'COM1',
  'COM2',
  'COM3',
  'COM4',
  'COM5',
  'COM6',
  'COM7',
  'COM8',
  'COM9',
  'LPT1',
  'LPT2',
  'LPT3',
  'LPT4',
  'LPT5',
  'LPT6',
  'LPT7',
  'LPT8',
  'LPT9',
]);

const ILLEGAL_CHARS_REGEX = /[\\/:*?"<>|\x00-\x1f]/;

/**
 * 校验新建或重命名文件名的合法性 (跨平台与 Windows 特殊防御门禁)
 */
export function validateFileName(name: string): ValidationResult {
  if (!name || name.trim() === '') {
    return { valid: false, error: '文件名不能为空' };
  }

  // Windows 文件名末尾不允许为英文句点或空格
  if (name.endsWith(' ') || name.trim().endsWith('.')) {
    return { valid: false, error: '文件名末尾不能为英文句点或空格' };
  }

  const trimmed = name.trim();

  // 非法字符过滤 (\ / : * ? " < > | 及控制字符)
  if (ILLEGAL_CHARS_REGEX.test(trimmed)) {
    return { valid: false, error: '文件名不能包含 \\ / : * ? " < > | 等非法字符' };
  }

  // Windows 保留设备名称检测 (如 CON.txt, NUL.md, COM1)
  const baseName = trimmed.split('.')[0].toUpperCase();
  if (WINDOWS_RESERVED_NAMES.has(baseName)) {
    return { valid: false, error: `"${baseName}" 为系统保留设备名，禁止使用` };
  }

  return { valid: true };
}

/**
 * 跨平台路径斜杠归一化 (反斜杠统一转换为正斜杠)
 */
export function normalizePath(filePath: string): string {
  if (!filePath) return '';
  return filePath.replace(/\\/g, '/');
}

/**
 * 获取符合操作系统原生习惯的动作文案与快捷键
 */
export function getPlatformActionConfig(platform?: 'darwin' | 'win32' | 'linux' | string): PlatformActionConfig {
  const p = platform || (typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac') ? 'darwin' : 'win32');

  if (p === 'darwin') {
    return {
      revealText: '在访达中显示',
      revealShortcut: '⌥⌘R',
      trashText: '移到废纸篓',
      trashShortcut: '⌘⌫',
      renameShortcut: 'Enter',
      copyPathShortcut: '⌥⌘C',
    };
  }

  if (p === 'linux') {
    return {
      revealText: '在文件管理器中显示',
      revealShortcut: 'Alt+R',
      trashText: '移到废纸篓',
      trashShortcut: 'Delete',
      renameShortcut: 'F2',
      copyPathShortcut: 'Ctrl+Shift+C',
    };
  }

  // 默认 Windows
  return {
    revealText: '在文件资源管理器中显示',
    revealShortcut: 'Shift+Alt+R',
    trashText: '移到回收站',
    trashShortcut: 'Delete',
    renameShortcut: 'F2',
    copyPathShortcut: 'Ctrl+Shift+C',
  };
}
