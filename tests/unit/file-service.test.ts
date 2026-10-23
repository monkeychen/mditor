import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openDocument, saveDocument, saveDocumentAs } from '../../src/renderer/services/fileService';

describe('File Service (AC3.1, AC3.2)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('openDocument should return document info when file is selected', async () => {
    const mockResult = {
      filePath: '/Users/test/notes/demo.md',
      fileName: 'demo.md',
      content: '# Hello Demo',
    };
    window.electronAPI = {
      openFile: vi.fn().mockResolvedValue(mockResult),
      saveFile: vi.fn(),
      saveFileAs: vi.fn(),
    };

    const doc = await openDocument();
    expect(doc).toEqual(mockResult);
    expect(window.electronAPI.openFile).toHaveBeenCalledOnce();
  });

  it('openDocument should return null when user cancels dialog', async () => {
    window.electronAPI = {
      openFile: vi.fn().mockResolvedValue(null),
      saveFile: vi.fn(),
      saveFileAs: vi.fn(),
    };

    const doc = await openDocument();
    expect(doc).toBeNull();
  });

  it('saveDocument should call saveFile when filePath exists', async () => {
    window.electronAPI = {
      openFile: vi.fn(),
      saveFile: vi.fn().mockResolvedValue({ success: true, filePath: '/test/demo.md' }),
      saveFileAs: vi.fn(),
    };

    const result = await saveDocument('/test/demo.md', '# Content');
    expect(result.success).toBe(true);
    expect(window.electronAPI.saveFile).toHaveBeenCalledWith('/test/demo.md', '# Content');
  });

  it('saveDocument should fall back to saveDocumentAs when filePath is null', async () => {
    const mockSaveAsResult = {
      filePath: '/test/new.md',
      fileName: 'new.md',
      content: '# New Content',
    };
    window.electronAPI = {
      openFile: vi.fn(),
      saveFile: vi.fn(),
      saveFileAs: vi.fn().mockResolvedValue(mockSaveAsResult),
    };

    const result = await saveDocument(null, '# New Content', 'new.md');
    expect(result.success).toBe(true);
    expect(result.filePath).toBe('/test/new.md');
    expect(window.electronAPI.saveFileAs).toHaveBeenCalledWith('new.md', '# New Content');
  });

  it('saveDocumentAs should return null if canceled', async () => {
    window.electronAPI = {
      openFile: vi.fn(),
      saveFile: vi.fn(),
      saveFileAs: vi.fn().mockResolvedValue(null),
    };

    const result = await saveDocumentAs('Untitled.md', '# Content');
    expect(result).toBeNull();
  });
});
