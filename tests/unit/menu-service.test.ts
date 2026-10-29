import { describe, it, expect, vi } from 'vitest';
import { buildMenuTemplate } from '../../src/main/menuService';

describe('Application Menu Service & Help Menu', () => {
  const version = '0.5.1';

  it('builds a menu template containing syntax guides and About card, without naked version or author rows', () => {
    const onTrigger = vi.fn();
    const onShowAbout = vi.fn();
    const openExternal = vi.fn();

    const template = buildMenuTemplate({
      appVersion: version,
      platform: 'darwin',
      onTrigger,
      onShowAbout,
      openExternal,
    });

    // Find the Help menu item
    const helpMenu = template.find((item) => item.role === 'help' || item.label === 'Help' || item.label === '帮助');
    expect(helpMenu).toBeDefined();
    expect(helpMenu?.submenu).toBeDefined();

    const submenu = helpMenu?.submenu as Electron.MenuItemConstructorOptions[];
    expect(Array.isArray(submenu)).toBe(true);

    // 1. Markdown syntax guide item
    const mdGuideItem = submenu.find((item) => item.label?.includes('Markdown 语法指南'));
    expect(mdGuideItem).toBeDefined();
    mdGuideItem?.click?.({} as any, undefined as any, {} as any);
    expect(onTrigger).toHaveBeenCalledWith('guide:markdown');

    // 2. Mermaid diagram guide item
    const mermaidGuideItem = submenu.find((item) => item.label?.includes('Mermaid 图表指南'));
    expect(mermaidGuideItem).toBeDefined();
    mermaidGuideItem?.click?.({} as any, undefined as any, {} as any);
    expect(onTrigger).toHaveBeenCalledWith('guide:mermaid');

    // 3. LaTeX / Math formula syntax guide item
    const mathGuideItem = submenu.find((item) => item.label?.includes('数学公式语法指南'));
    expect(mathGuideItem).toBeDefined();
    mathGuideItem?.click?.({} as any, undefined as any, {} as any);
    expect(onTrigger).toHaveBeenCalledWith('guide:math');

    // 4. About card item is preserved
    const aboutItem = submenu.find((item) => item.label?.includes('关于 mditor') || item.label?.includes('关于'));
    expect(aboutItem).toBeDefined();
    aboutItem?.click?.({} as any, undefined as any, {} as any);
    expect(onShowAbout).toHaveBeenCalledTimes(1);

    // 5. Version number and author information are NOT shown as separate standalone menu items
    const standaloneVersionItem = submenu.find((item) => item.label?.startsWith('版本:'));
    expect(standaloneVersionItem).toBeUndefined();

    const standaloneAuthorItem = submenu.find((item) => item.label?.startsWith('作者:'));
    expect(standaloneAuthorItem).toBeUndefined();
  });

  it('includes standard application menu on macOS and file actions', () => {
    const onTrigger = vi.fn();
    const template = buildMenuTemplate({
      appVersion: version,
      platform: 'darwin',
      onTrigger,
    });

    const fileMenu = template.find((item) => item.label === '文件' || item.label === 'File');
    expect(fileMenu).toBeDefined();
    const fileSubmenu = fileMenu?.submenu as Electron.MenuItemConstructorOptions[];

    const newItem = fileSubmenu.find((item) => item.label?.includes('新建'));
    expect(newItem).toBeDefined();
    newItem?.click?.({} as any, undefined as any, {} as any);
    expect(onTrigger).toHaveBeenCalledWith('new');
  });
});
