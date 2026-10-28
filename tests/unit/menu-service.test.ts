import { describe, it, expect, vi } from 'vitest';
import { buildMenuTemplate } from '../../src/main/menuService';

describe('Application Menu Service & Help Menu', () => {
  const version = '0.5.0';

  it('builds a menu template containing a Help menu with version, GitHub link, and author information', () => {
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

    // 1. Version item
    const versionItem = submenu.find((item) => item.label?.includes(version));
    expect(versionItem).toBeDefined();
    expect(versionItem?.label).toContain(`v${version}`);

    // Clicking version item triggers about dialog
    versionItem?.click?.({} as any, undefined as any, {} as any);
    expect(onShowAbout).toHaveBeenCalledTimes(1);

    // 2. Project GitHub URL item
    const repoItem = submenu.find((item) => item.label?.includes('https://github.com/monkeychen/mditor') || item.label?.includes('GitHub'));
    expect(repoItem).toBeDefined();
    expect(repoItem?.label).toContain('https://github.com/monkeychen/mditor');

    // Clicking repo item opens the URL externally
    repoItem?.click?.({} as any, undefined as any, {} as any);
    expect(openExternal).toHaveBeenCalledWith('https://github.com/monkeychen/mditor');

    // 3. Author information item
    const authorItem = submenu.find((item) => item.label?.includes('陈志安') && item.label?.includes('cza55007@gmail.com'));
    expect(authorItem).toBeDefined();
    expect(authorItem?.label).toContain('陈志安');
    expect(authorItem?.label).toContain('cza55007@gmail.com');

    // Clicking author item opens mailto: externally
    authorItem?.click?.({} as any, undefined as any, {} as any);
    expect(openExternal).toHaveBeenCalledWith('mailto:cza55007@gmail.com');
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
