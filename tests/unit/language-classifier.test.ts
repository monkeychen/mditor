import { describe, it, expect } from 'vitest';
import {
  isMarkdownFile,
  isSupportedTextFile,
  getFileExtension,
  getLanguageInfo,
} from '../../src/renderer/utils/languageClassifier';

describe('Language Classifier Module (T401 / AC-29.1 ~ AC-29.2)', () => {
  it('correctly identifies markdown files', () => {
    expect(isMarkdownFile('readme.md')).toBe(true);
    expect(isMarkdownFile('/path/to/doc.MARKDOWN')).toBe(true);
    expect(isMarkdownFile('notes.mdown')).toBe(true);

    expect(isMarkdownFile('server.py')).toBe(false);
    expect(isMarkdownFile('config.json')).toBe(false);
    expect(isMarkdownFile('query.sql')).toBe(false);
    expect(isMarkdownFile('plain.txt')).toBe(false);
  });

  it('correctly extracts lowercased file extensions', () => {
    expect(getFileExtension('app.py')).toBe('.py');
    expect(getFileExtension('/var/log/system.LOG')).toBe('.log');
    expect(getFileExtension('archive.tar.gz')).toBe('.gz');
    expect(getFileExtension('Dockerfile')).toBe('dockerfile');
    expect(getFileExtension('.env')).toBe('.env');
  });

  it('verifies support for comprehensive text and programming language files', () => {
    const testCases = [
      'main.py',
      'query.sql',
      'App.java',
      'index.ts',
      'util.js',
      'config.json',
      'data.yaml',
      'settings.yml',
      'cargo.toml',
      'pom.xml',
      'run.sh',
      'deploy.bash',
      'script.zsh',
      'main.go',
      'lib.rs',
      'hello.c',
      'world.cpp',
      'test.cs',
      'error.log',
      'notes.txt',
      'changes.diff',
      'patch.patch',
      'document.md',
    ];

    for (const file of testCases) {
      expect(isSupportedTextFile(file)).toBe(true);
    }

    // Binary / unsupported files
    expect(isSupportedTextFile('image.png')).toBe(false);
    expect(isSupportedTextFile('music.mp3')).toBe(false);
    expect(isSupportedTextFile('binary.exe')).toBe(false);
    expect(isSupportedTextFile('video.mp4')).toBe(false);
  });

  it('returns rich language metadata for display and smart routing', () => {
    const pyInfo = getLanguageInfo('server.py');
    expect(pyInfo.isMarkdown).toBe(false);
    expect(pyInfo.languageId).toBe('python');
    expect(pyInfo.displayName).toBe('Python');
    expect(pyInfo.iconType).toBe('python');

    const sqlInfo = getLanguageInfo('queries/users.sql');
    expect(sqlInfo.isMarkdown).toBe(false);
    expect(sqlInfo.languageId).toBe('sql');
    expect(sqlInfo.displayName).toBe('SQL');
    expect(sqlInfo.iconType).toBe('database');

    const jsonInfo = getLanguageInfo('package.json');
    expect(jsonInfo.isMarkdown).toBe(false);
    expect(jsonInfo.languageId).toBe('json');
    expect(jsonInfo.displayName).toBe('JSON');
    expect(jsonInfo.iconType).toBe('data');

    const mdInfo = getLanguageInfo('docs/spec.md');
    expect(mdInfo.isMarkdown).toBe(true);
    expect(mdInfo.languageId).toBe('markdown');
    expect(mdInfo.displayName).toBe('Markdown');
    expect(mdInfo.iconType).toBe('markdown');

    const logInfo = getLanguageInfo('/tmp/debug.log');
    expect(logInfo.isMarkdown).toBe(false);
    expect(logInfo.languageId).toBe('plaintext');
    expect(logInfo.displayName).toBe('Log');
    expect(logInfo.iconType).toBe('text');
  });
});
