export type LanguageIconType =
  | 'markdown'
  | 'code'
  | 'data'
  | 'text'
  | 'database'
  | 'python'
  | 'shell';

export interface LanguageInfo {
  languageId: string;
  displayName: string;
  isMarkdown: boolean;
  iconType: LanguageIconType;
}

export const MARKDOWN_EXTENSIONS = new Set(['.md', '.markdown', '.mdown']);

export const SUPPORTED_EXTENSIONS = new Set([
  // Markdown
  '.md',
  '.markdown',
  '.mdown',
  // Text & Logs
  '.txt',
  '.text',
  '.log',
  '.diff',
  '.patch',
  // Data & Config
  '.json',
  '.jsonc',
  '.yaml',
  '.yml',
  '.toml',
  '.xml',
  '.ini',
  '.env',
  '.csv',
  '.properties',
  // Web & Styles
  '.html',
  '.htm',
  '.css',
  '.scss',
  '.less',
  '.svg',
  // JavaScript & TypeScript
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
  // Programming Languages
  '.py',
  '.pyw',
  '.sql',
  '.java',
  '.kt',
  '.kts',
  '.go',
  '.rs',
  '.c',
  '.cpp',
  '.cc',
  '.h',
  '.hpp',
  '.cs',
  '.sh',
  '.bash',
  '.zsh',
  '.php',
  '.rb',
  '.swift',
  // Special Names
  'dockerfile',
  '.dockerfile',
]);

export function getFileExtension(filePathOrName: string): string {
  if (!filePathOrName) return '';
  const lastSlash = Math.max(filePathOrName.lastIndexOf('/'), filePathOrName.lastIndexOf('\\'));
  const baseName = lastSlash >= 0 ? filePathOrName.substring(lastSlash + 1) : filePathOrName;

  if (baseName.toLowerCase() === 'dockerfile') {
    return 'dockerfile';
  }

  const dotIdx = baseName.lastIndexOf('.');
  if (dotIdx === 0) {
    // Hidden file like .env, treat as full name or extension
    return baseName.toLowerCase();
  }
  if (dotIdx > 0) {
    return baseName.substring(dotIdx).toLowerCase();
  }
  return baseName.toLowerCase();
}

export function isMarkdownFile(filePathOrName: string): boolean {
  const ext = getFileExtension(filePathOrName);
  return MARKDOWN_EXTENSIONS.has(ext);
}

export function isSupportedTextFile(filePathOrName: string): boolean {
  const ext = getFileExtension(filePathOrName);
  return SUPPORTED_EXTENSIONS.has(ext);
}

export function getLanguageInfo(filePathOrName: string): LanguageInfo {
  const ext = getFileExtension(filePathOrName);

  if (MARKDOWN_EXTENSIONS.has(ext)) {
    return {
      languageId: 'markdown',
      displayName: 'Markdown',
      isMarkdown: true,
      iconType: 'markdown',
    };
  }

  switch (ext) {
    case '.py':
    case '.pyw':
      return {
        languageId: 'python',
        displayName: 'Python',
        isMarkdown: false,
        iconType: 'python',
      };
    case '.sql':
      return {
        languageId: 'sql',
        displayName: 'SQL',
        isMarkdown: false,
        iconType: 'database',
      };
    case '.json':
    case '.jsonc':
      return {
        languageId: 'json',
        displayName: 'JSON',
        isMarkdown: false,
        iconType: 'data',
      };
    case '.yaml':
    case '.yml':
      return {
        languageId: 'yaml',
        displayName: 'YAML',
        isMarkdown: false,
        iconType: 'data',
      };
    case '.toml':
      return {
        languageId: 'toml',
        displayName: 'TOML',
        isMarkdown: false,
        iconType: 'data',
      };
    case '.xml':
      return {
        languageId: 'xml',
        displayName: 'XML',
        isMarkdown: false,
        iconType: 'data',
      };
    case '.ini':
    case '.properties':
    case '.env':
      return {
        languageId: 'ini',
        displayName: 'Config',
        isMarkdown: false,
        iconType: 'data',
      };
    case '.csv':
      return {
        languageId: 'csv',
        displayName: 'CSV',
        isMarkdown: false,
        iconType: 'data',
      };
    case '.js':
    case '.jsx':
    case '.mjs':
    case '.cjs':
      return {
        languageId: 'javascript',
        displayName: 'JavaScript',
        isMarkdown: false,
        iconType: 'code',
      };
    case '.ts':
    case '.tsx':
      return {
        languageId: 'typescript',
        displayName: 'TypeScript',
        isMarkdown: false,
        iconType: 'code',
      };
    case '.java':
    case '.kt':
    case '.kts':
      return {
        languageId: 'java',
        displayName: 'Java',
        isMarkdown: false,
        iconType: 'code',
      };
    case '.go':
      return {
        languageId: 'go',
        displayName: 'Go',
        isMarkdown: false,
        iconType: 'code',
      };
    case '.rs':
      return {
        languageId: 'rust',
        displayName: 'Rust',
        isMarkdown: false,
        iconType: 'code',
      };
    case '.c':
    case '.cpp':
    case '.cc':
    case '.h':
    case '.hpp':
      return {
        languageId: 'cpp',
        displayName: 'C/C++',
        isMarkdown: false,
        iconType: 'code',
      };
    case '.cs':
      return {
        languageId: 'csharp',
        displayName: 'C#',
        isMarkdown: false,
        iconType: 'code',
      };
    case '.html':
    case '.htm':
    case '.svg':
      return {
        languageId: 'html',
        displayName: 'HTML',
        isMarkdown: false,
        iconType: 'code',
      };
    case '.css':
    case '.scss':
    case '.less':
      return {
        languageId: 'css',
        displayName: 'CSS',
        isMarkdown: false,
        iconType: 'code',
      };
    case '.sh':
    case '.bash':
    case '.zsh':
      return {
        languageId: 'shell',
        displayName: 'Shell',
        isMarkdown: false,
        iconType: 'shell',
      };
    case 'dockerfile':
    case '.dockerfile':
      return {
        languageId: 'dockerfile',
        displayName: 'Dockerfile',
        isMarkdown: false,
        iconType: 'code',
      };
    case '.log':
      return {
        languageId: 'plaintext',
        displayName: 'Log',
        isMarkdown: false,
        iconType: 'text',
      };
    case '.diff':
    case '.patch':
      return {
        languageId: 'diff',
        displayName: 'Diff',
        isMarkdown: false,
        iconType: 'text',
      };
    case '.txt':
    case '.text':
    default:
      return {
        languageId: 'plaintext',
        displayName: 'Plain Text',
        isMarkdown: false,
        iconType: 'text',
      };
  }
}
