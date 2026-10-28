import { app, Menu, dialog, shell, BrowserWindow } from 'electron';

export interface MenuServiceOptions {
  appVersion: string;
  platform?: 'darwin' | 'win32' | 'linux';
  onTrigger?: (action: 'new' | 'open' | 'save' | 'saveAs' | 'preferences') => void;
  onShowAbout?: () => void;
  openExternal?: (url: string) => Promise<void> | void;
}

export const GITHUB_REPO_URL = 'https://github.com/monkeychen/mditor';
export const AUTHOR_NAME = '陈志安';
export const AUTHOR_EMAIL = 'cza55007@gmail.com';

export function showAboutDialog(appVersion: string, openExternalFn?: (url: string) => Promise<void> | void) {
  const openUrl = openExternalFn || shell.openExternal;

  dialog
    .showMessageBox({
      type: 'info',
      title: '关于 mditor',
      message: `mditor v${appVersion}`,
      detail: `一款兼具 macOS 极致优雅视觉与丝滑交互体验的跨平台 Markdown 编辑器\n\n项目地址：${GITHUB_REPO_URL}\n作者信息：${AUTHOR_NAME} (Mail: ${AUTHOR_EMAIL})`,
      buttons: ['确定', '访问 GitHub', '联系作者'],
      defaultId: 0,
      cancelId: 0,
      noLink: true,
    })
    .then((res) => {
      if (res.response === 1) {
        openUrl(GITHUB_REPO_URL);
      } else if (res.response === 2) {
        openUrl(`mailto:${AUTHOR_EMAIL}`);
      }
    })
    .catch(() => {});
}

export function setupAboutPanel(appVersion: string) {
  if (process.platform === 'darwin') {
    app.setAboutPanelOptions({
      applicationName: 'mditor',
      applicationVersion: appVersion,
      version: appVersion,
      copyright: `Copyright © 2026 ${AUTHOR_NAME}`,
      website: GITHUB_REPO_URL,
      credits: `作者：${AUTHOR_NAME} (Mail: ${AUTHOR_EMAIL})\n项目地址：${GITHUB_REPO_URL}`,
    });
  }
}

export function buildMenuTemplate(options: MenuServiceOptions): Electron.MenuItemConstructorOptions[] {
  const {
    appVersion,
    platform = process.platform,
    onTrigger,
    onShowAbout,
    openExternal = shell?.openExternal ? (url: string) => shell.openExternal(url) : undefined,
  } = options;

  const isMac = platform === 'darwin';

  const triggerAbout = () => {
    if (onShowAbout) {
      onShowAbout();
    } else {
      showAboutDialog(appVersion, openExternal);
    }
  };

  const handleOpenExternal = (url: string) => {
    if (openExternal) {
      openExternal(url);
    }
  };

  const template: Electron.MenuItemConstructorOptions[] = [];

  // macOS App Menu
  if (isMac) {
    template.push({
      label: 'mditor',
      submenu: [
        {
          label: '关于 mditor',
          click: triggerAbout,
        },
        { type: 'separator' },
        {
          label: '偏好设置...',
          accelerator: 'CmdOrCtrl+,',
          click: () => onTrigger?.('preferences'),
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
  }

  // 文件菜单 (File)
  template.push({
    label: '文件',
    submenu: [
      {
        label: '新建标签页',
        accelerator: 'CmdOrCtrl+N',
        click: () => onTrigger?.('new'),
      },
      {
        label: '打开文件...',
        accelerator: 'CmdOrCtrl+O',
        click: () => onTrigger?.('open'),
      },
      { type: 'separator' },
      {
        label: '保存',
        accelerator: 'CmdOrCtrl+S',
        click: () => onTrigger?.('save'),
      },
      {
        label: '另存为...',
        accelerator: 'CmdOrCtrl+Shift+S',
        click: () => onTrigger?.('saveAs'),
      },
      { type: 'separator' },
      isMac ? { role: 'close' } : { role: 'quit' },
    ],
  });

  // 编辑菜单 (Edit)
  template.push({
    label: '编辑',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectAll' },
    ],
  });

  // 视图菜单 (View)
  template.push({
    label: '视图',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
    ],
  });

  // 窗口菜单 (Window)
  template.push({
    label: '窗口',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(isMac
        ? [{ type: 'separator' as const }, { role: 'front' as const }, { role: 'window' as const }]
        : [{ role: 'close' as const }]),
    ],
  });

  // 帮助菜单 (Help)
  template.push({
    role: 'help',
    label: 'Help',
    submenu: [
      {
        label: `版本: v${appVersion}`,
        click: triggerAbout,
      },
      {
        label: `项目地址: ${GITHUB_REPO_URL}`,
        click: () => handleOpenExternal(GITHUB_REPO_URL),
      },
      {
        label: `作者: ${AUTHOR_NAME} (Mail: ${AUTHOR_EMAIL})`,
        click: () => handleOpenExternal(`mailto:${AUTHOR_EMAIL}`),
      },
      { type: 'separator' },
      {
        label: '关于 mditor',
        click: triggerAbout,
      },
    ],
  });

  return template;
}

export function setupApplicationMenu(mainWindow: BrowserWindow | null, appVersion: string) {
  const template = buildMenuTemplate({
    appVersion,
    platform: process.platform as any,
    onTrigger: (action) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('menu:trigger', action);
      }
    },
  });

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
