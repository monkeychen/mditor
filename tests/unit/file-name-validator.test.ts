import { describe, it, expect } from 'vitest';
import {
  validateFileName,
  normalizePath,
  getPlatformActionConfig,
} from '../../src/renderer/utils/fileNameValidator';

describe('File Name Validator & Platform Adapter (T405 / AC-28.3)', () => {
  describe('validateFileName', () => {
    it('approves valid file names', () => {
      expect(validateFileName('README.md').valid).toBe(true);
      expect(validateFileName('notes_2026-10-27.txt').valid).toBe(true);
      expect(validateFileName('my-script.py').valid).toBe(true);
      expect(validateFileName('中文文档.markdown').valid).toBe(true);
    });

    it('rejects empty or whitespace-only names', () => {
      expect(validateFileName('').valid).toBe(false);
      expect(validateFileName('').error).toBe('文件名不能为空');
      expect(validateFileName('   ').valid).toBe(false);
      expect(validateFileName('   ').error).toBe('文件名不能为空');
    });

    it('rejects names with Windows illegal characters', () => {
      const illegalNames = [
        'test:file.md',
        'folder/nested.md',
        'folder\\nested.md',
        'query*all.sql',
        'what?.txt',
        'quote"name.json',
        '<tag>.html',
        'pipe|filter.sh',
      ];

      for (const name of illegalNames) {
        const res = validateFileName(name);
        expect(res.valid).toBe(false);
        expect(res.error).toContain('非法字符');
      }
    });

    it('rejects Windows reserved device names (case-insensitive and with extensions)', () => {
      const reservedNames = ['CON.md', 'con', 'prn.txt', 'AUX', 'NUL.log', 'com1.py', 'lpt9.json'];

      for (const name of reservedNames) {
        const res = validateFileName(name);
        expect(res.valid).toBe(false);
        expect(res.error).toContain('系统保留');
      }
    });

    it('rejects file names ending with dot or space', () => {
      expect(validateFileName('filename.').valid).toBe(false);
      expect(validateFileName('filename.').error).toContain('句点或空格');
      expect(validateFileName('filename ').valid).toBe(false);
      expect(validateFileName('filename ').error).toContain('句点或空格');
    });
  });

  describe('normalizePath', () => {
    it('normalizes backslashes to forward slashes', () => {
      expect(normalizePath('C:\\Users\\admin\\project\\doc.md')).toBe('C:/Users/admin/project/doc.md');
      expect(normalizePath('path/to/nested\\file.txt')).toBe('path/to/nested/file.txt');
    });
  });

  describe('getPlatformActionConfig', () => {
    it('provides macOS specific labels and shortcuts', () => {
      const config = getPlatformActionConfig('darwin');
      expect(config.revealText).toBe('在访达中显示');
      expect(config.trashText).toBe('移到废纸篓');
      expect(config.renameShortcut).toBe('Enter');
      expect(config.trashShortcut).toBe('⌘⌫');
    });

    it('provides Windows specific labels and shortcuts', () => {
      const config = getPlatformActionConfig('win32');
      expect(config.revealText).toBe('在文件资源管理器中显示');
      expect(config.trashText).toBe('移到回收站');
      expect(config.renameShortcut).toBe('F2');
      expect(config.trashShortcut).toBe('Delete');
    });

    it('provides Linux specific labels and shortcuts', () => {
      const config = getPlatformActionConfig('linux');
      expect(config.revealText).toBe('在文件管理器中显示');
      expect(config.trashText).toBe('移到废纸篓');
      expect(config.renameShortcut).toBe('F2');
      expect(config.trashShortcut).toBe('Delete');
    });
  });
});
