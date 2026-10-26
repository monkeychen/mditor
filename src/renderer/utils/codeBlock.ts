export interface CodeBlockInfo {
  language: string;
  code: string;
}

const LANG_MAP: Record<string, string> = {
  ts: 'TypeScript',
  typescript: 'TypeScript',
  js: 'JavaScript',
  javascript: 'JavaScript',
  py: 'Python',
  python: 'Python',
  sh: 'Shell',
  bash: 'Shell',
  json: 'JSON',
  html: 'HTML',
  css: 'CSS',
  md: 'Markdown',
  markdown: 'Markdown',
  sql: 'SQL',
  rust: 'Rust',
  go: 'Go',
};

export function formatLanguageName(rawLang: string): string {
  const clean = rawLang.trim().toLowerCase();
  if (!clean) return 'Code';
  return LANG_MAP[clean] || (clean.charAt(0).toUpperCase() + clean.slice(1));
}

export function parseCodeBlockInfo(fencedText: string): CodeBlockInfo {
  if (!fencedText) return { language: 'Code', code: '' };

  const lines = fencedText.split('\n');
  if (lines.length < 2) return { language: 'Code', code: fencedText };

  // 首行匹配 ```lang 或 ~~~lang
  const firstLine = lines[0];
  const langMatch = firstLine.match(/^(?:```|~~~)(\w+)?/);
  const rawLang = langMatch && langMatch[1] ? langMatch[1] : '';
  const language = formatLanguageName(rawLang);

  // 截取中间代码行（去掉首行与末行的定界符）
  let endIdx = lines.length;
  if (lines[lines.length - 1].trim().match(/^(?:```|~~~)$/)) {
    endIdx = lines.length - 1;
  }

  const codeLines = lines.slice(1, endIdx);
  const code = codeLines.join('\n');

  return {
    language,
    code,
  };
}

export async function copyCodeToClipboard(code: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(code);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
