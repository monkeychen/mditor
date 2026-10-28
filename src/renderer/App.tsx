import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useTabs } from './hooks/useTabs';
import { MilkdownEditor, MilkdownEditorRef } from './editor/wysiwyg/MilkdownEditor';
import { SourceEditor } from './editor/source/SourceEditor';
import TabBar from './components/TabBar';
import OutlineDrawer, { SidebarViewMode } from './components/OutlineDrawer';
import UnsavedConfirmModal from './components/UnsavedConfirmModal';
import SearchPanel from './components/SearchPanel';
import { WordCountPopover } from './components/WordCountPopover';
import { InsertTableModal } from './components/InsertTableModal';
import { ThemeSelectorPopover } from './components/ThemeSelectorPopover';
import PreferencesModal from './components/PreferencesModal';
import QuickOpenModal from './components/QuickOpenModal';
import ExportModal from './components/ExportModal';
import { extractWorkspaceFiles } from './utils/fuzzySearch';
import {
  EditorPreferences,
  DEFAULT_PREFERENCES,
  getStoredPreferences,
  savePreferences,
  applyPreferencesToDOM,
} from './services/settingsService';
import {
  AppTheme,
  getStoredTheme,
  setAppTheme,
  applyThemeToDOM,
  THEME_LIST,
} from './services/themeService';
import { extractOutline, OutlineItem } from './utils/outline';
import { calculateDocumentStats } from './utils/counter';
import { findMatches, replaceSingle, replaceAll } from './utils/search';
import { copyWechatHtmlToClipboard } from './utils/wechatFormatter';
import { exportToHtml, exportToPdf } from './services/exportService';
import {
  openDocument,
  openDocumentByPath,
  openFolderDialog,
  scanDirectoryTree,
  saveDocument,
  saveDocumentAs,
  revealInExplorer,
  moveToTrash,
  createFileOnDisk,
  createFolderOnDisk,
  renameItemOnDisk,
} from './services/fileService';
import type { WorkspaceFolder, PdfExportOptions } from '../types';
import type { ContextMenuTarget } from './components/SidebarContextMenu';
import { isMarkdownFile, getLanguageInfo } from './utils/languageClassifier';

const STORAGE_KEY_WORKSPACE_FOLDERS = 'mditor_workspace_folders';

function getStoredWorkspaceFolderPaths(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WORKSPACE_FOLDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((p) => typeof p === 'string');
    }
  } catch {
    // ignore
  }
  return [];
}

function saveStoredWorkspaceFolderPaths(paths: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY_WORKSPACE_FOLDERS, JSON.stringify(paths));
  } catch {
    // ignore
  }
}
import {
  FolderOpen,
  Save,
  Search,
  Share2,
  Check,
  FileCode,
  FileText,
  Table,
  Eye,
  AlignCenter,
  Sigma,
  SquareSigma,
  Palette,
  PanelLeft,
  PanelTop,
  ChevronUp,
  Settings,
} from 'lucide-react';

const INITIAL_CONTENT = `# 设计第一性原理与 macOS 手感

用户体验是所有产品的最高准则。**后端可以很复杂，但用户触碰到的每一层必须丝滑。** 在 \`mditor\` 中，我们拒绝一切形式的交互迟滞。

## 核心交互特性

> 系统承担复杂性：能自动化的不手动，能推断的不让用户填，能一步完成的不拆成三步。

- [x] 基于 CodeMirror 6 纯文本架构，坚决不破坏 Markdown 源语法
- [x] 多标签页（Tab）与快捷键导航 (⌘T, ⌘W, ⌘1..9)
- [x] 本地图片直接粘贴自动存入 ./assets/
- [x] 悬浮式查找与替换 (⌘F, ⌘H)
- [x] 微信公众号/知乎 Inline CSS 一键富文本复制

## 本地图片自动落盘与渲染

![macOS 原生沉浸式无边框窗口布局](./assets/macos-window.png)

## 代码块高级渲染与一键复制

\`\`\`typescript
interface EditorConfig {
  livePreview: boolean;
  autoSave: boolean;
  theme: 'macos-light' | 'macos-dark';
}

export function initMditor(config: EditorConfig) {
  console.log("mditor started smoothly.");
}
\`\`\`

---

按快捷键 <kbd>⌘S</kbd> 即可即时存盘，无需担心文档意外丢失。`;

export const App: React.FC = () => {
  const {
    tabs,
    activeTabId,
    activeTab,
    closePendingTab,
    createNewTab,
    switchTab,
    reorderTabs,
    updateTabContent,
    updateTabFile,
    updateTabMode,
    updateTabCursor,
    requestCloseTab,
    forceCloseTab,
    confirmDiscardAndClose,
    cancelClose,
  } = useTabs({
    id: 'tab-init',
    filePath: null,
    fileName: 'macOS-Philosophy.md',
    content: INITIAL_CONTENT,
    isDirty: false,
    saveStatus: 'saved',
    cursorLine: 1,
    cursorCol: 1,
  });

  const milkdownRef = useRef<MilkdownEditorRef | null>(null);

  const [isOutlineOpen, setIsOutlineOpen] = useState(true);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [sidebarViewMode, setSidebarViewMode] = useState<SidebarViewMode>('outline');

  // 工作区多文件夹状态 (Typora 双视图侧边栏：文件夹 / 大纲)
  const [workspaceFolders, setWorkspaceFolders] = useState<WorkspaceFolder[]>([]);

  // 恢复持久化的工作区文件夹列表
  useEffect(() => {
    const storedPaths = getStoredWorkspaceFolderPaths();
    if (storedPaths.length > 0) {
      Promise.all(
        storedPaths.map(async (folderPath) => {
          const tree = await scanDirectoryTree(folderPath);
          const name = folderPath.split('/').pop() || folderPath;
          return {
            id: folderPath,
            name,
            path: folderPath,
            tree,
          };
        })
      ).then((folders) => {
        setWorkspaceFolders(folders.filter(Boolean));
      });
    }
  }, []);

  // 专注模式 (F8) 与打字机滚动模式 (F9)
  const [focusMode, setFocusMode] = useState(false);
  const [typewriterMode, setTypewriterMode] = useState(false);

  // 全屏与窗口最大化状态（用于自适应避让 macOS 交通灯，最大化、全屏或非 macOS 下自动消除空白）
  const [windowState, setWindowState] = useState<{ isFullScreen: boolean; isMaximized: boolean }>({
    isFullScreen: false,
    isMaximized: false,
  });
  const platform = window.electronAPI?.platform || (navigator.userAgent.includes('Mac') ? 'darwin' : 'win32');
  const isMac = platform === 'darwin';

  useEffect(() => {
    if (window.electronAPI?.getWindowState) {
      window.electronAPI.getWindowState().then((state) => {
        setWindowState({ isFullScreen: state.isFullScreen, isMaximized: state.isMaximized });
      });
    }
    if (window.electronAPI?.onWindowStateChange) {
      const cleanup = window.electronAPI.onWindowStateChange((state) => {
        setWindowState({ isFullScreen: state.isFullScreen, isMaximized: state.isMaximized });
      });
      return cleanup;
    }
  }, []);

  // 仅在 macOS 且非最大化、非全屏时显示交通灯占位
  const showTrafficLightSpacer = isMac && !windowState.isMaximized && !windowState.isFullScreen;

  // 经典多主题视觉系统 (v0.3.0 M4: AC-22.1 ~ AC-22.3)
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(getStoredTheme);
  const [isThemePopoverOpen, setIsThemePopoverOpen] = useState(false);

  // 偏好设置状态与即时热重载服务 (v0.4.0 M3: AC-27.1 ~ AC-27.3)
  const [preferences, setPreferences] = useState<EditorPreferences>(getStoredPreferences);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  // 全局闪电快速打开状态 (F31)
  const [isQuickOpenOpen, setIsQuickOpenOpen] = useState(false);

  const workspaceFiles = useMemo(() => {
    return extractWorkspaceFiles(workspaceFolders);
  }, [workspaceFolders]);

  // 顶栏分层解耦与独立可折叠编辑工具栏 (v0.3.1 F26)
  const [isToolbarOpen, setIsToolbarOpen] = useState(true);

  useEffect(() => {
    applyPreferencesToDOM(preferences);
    if (preferences.theme !== currentTheme) {
      setCurrentTheme(preferences.theme);
      setAppTheme(preferences.theme);
    }
  }, [preferences, currentTheme]);

  useEffect(() => {
    applyThemeToDOM(currentTheme);
  }, [currentTheme]);

  const handleSelectTheme = useCallback((theme: AppTheme) => {
    setCurrentTheme(theme);
    setAppTheme(theme);
    setPreferences(savePreferences({ theme }));
  }, []);

  const handleUpdatePreferences = useCallback(
    (updates: Partial<EditorPreferences>) => {
      const updated = savePreferences(updates);
      setPreferences(updated);
      if (updates.theme && updates.theme !== currentTheme) {
        setCurrentTheme(updates.theme);
        setAppTheme(updates.theme);
      }
    },
    [currentTheme]
  );

  const handleResetPreferences = useCallback(() => {
    const defaults = savePreferences(DEFAULT_PREFERENCES);
    setPreferences(defaults);
    setCurrentTheme(defaults.theme);
    setAppTheme(defaults.theme);
  }, []);

  // 字数统计浮窗与插入表格弹窗
  const [isWordCountOpen, setIsWordCountOpen] = useState(false);
  const [isInsertTableOpen, setIsInsertTableOpen] = useState(false);

  // Toast 状态
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, []);

  // 检查当前激活 Tab 是否为 Markdown
  const isCurrentTabMarkdown = isMarkdownFile(activeTab.filePath || activeTab.fileName);
  const currentLanguageInfo = getLanguageInfo(activeTab.filePath || activeTab.fileName);

  // 编辑器模式 (即时渲染 vs 纯源码) - 非 Markdown 强制锁定为 source
  const currentMode = isCurrentTabMarkdown ? (activeTab.mode || 'wysiwyg') : 'source';

  const handleToggleMode = useCallback(() => {
    if (!isCurrentTabMarkdown) {
      showToast('代码文件仅支持源码模式');
      return;
    }
    if (currentMode === 'wysiwyg' && milkdownRef.current) {
      const latestMd = milkdownRef.current.getMarkdown();
      if (latestMd && latestMd !== activeTab.content) {
        updateTabContent(activeTab.id, latestMd);
      }
    }
    const nextMode = currentMode === 'wysiwyg' ? 'source' : 'wysiwyg';
    updateTabMode(activeTab.id, nextMode);
  }, [isCurrentTabMarkdown, currentMode, activeTab.id, activeTab.content, updateTabContent, updateTabMode, showToast]);

  const handleSwitchTab = useCallback(
    (targetTabId: string) => {
      if (currentMode === 'wysiwyg' && milkdownRef.current) {
        const latestMd = milkdownRef.current.getMarkdown();
        if (latestMd && latestMd !== activeTab.content) {
          updateTabContent(activeTab.id, latestMd);
        }
      }
      switchTab(targetTabId);
    },
    [currentMode, activeTab.id, activeTab.content, updateTabContent, switchTab]
  );

  const handleCreateNewTab = useCallback(
    (fileName?: string, content?: string, filePath?: string | null) => {
      if (currentMode === 'wysiwyg' && milkdownRef.current) {
        const latestMd = milkdownRef.current.getMarkdown();
        if (latestMd && latestMd !== activeTab.content) {
          updateTabContent(activeTab.id, latestMd);
        }
      }
      createNewTab(fileName, content, filePath);
    },
    [currentMode, activeTab.id, activeTab.content, updateTabContent, createNewTab]
  );

  // 搜索替换状态
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // 导出菜单状态
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const exportMenuContainerRef = useRef<HTMLDivElement | null>(null);

  // 监听点击外部或 ESC 自动收起导出下拉菜单
  useEffect(() => {
    if (!isExportMenuOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (
        exportMenuContainerRef.current &&
        !exportMenuContainerRef.current.contains(e.target as Node)
      ) {
        setIsExportMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExportMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExportMenuOpen]);

  // 提取大纲与文档详细字数统计
  const outline = useMemo(() => {
    return extractOutline(activeTab.content);
  }, [activeTab.content]);

  const docStats = useMemo(() => {
    return calculateDocumentStats(activeTab.content);
  }, [activeTab.content]);


  // 搜索匹配计算
  const matches = useMemo(() => {
    return findMatches(activeTab.content, searchQuery);
  }, [activeTab.content, searchQuery]);

  useEffect(() => {
    if (matches.length > 0 && currentMatchIndex >= matches.length) {
      setCurrentMatchIndex(0);
    }
  }, [matches, currentMatchIndex]);

  // 保存当前 Tab (⌘S)
  const handleSaveActiveTab = useCallback(async () => {
    let contentToSave = activeTab.content;
    if (currentMode === 'wysiwyg' && milkdownRef.current) {
      const latestMd = milkdownRef.current.getMarkdown();
      if (latestMd) {
        contentToSave = latestMd;
        if (latestMd !== activeTab.content) {
          updateTabContent(activeTab.id, latestMd);
        }
      }
    }
    const res = await saveDocument(activeTab.filePath, contentToSave, activeTab.fileName);
    if (res.success && res.filePath) {
      const fileName = res.filePath.split('/').pop() || activeTab.fileName;
      updateTabFile(activeTab.id, res.filePath, fileName);
      showToast('文档已成功存盘');
    }
  }, [activeTab, currentMode, updateTabContent, updateTabFile, showToast]);

  // 另存为当前 Tab (⇧⌘S)
  const handleSaveAsActiveTab = useCallback(async () => {
    let contentToSave = activeTab.content;
    if (currentMode === 'wysiwyg' && milkdownRef.current) {
      const latestMd = milkdownRef.current.getMarkdown();
      if (latestMd) {
        contentToSave = latestMd;
      }
    }
    const res = await saveDocumentAs(activeTab.fileName, contentToSave);
    if (res && res.filePath) {
      const fileName = res.filePath.split('/').pop() || activeTab.fileName;
      updateTabFile(activeTab.id, res.filePath, fileName);
      showToast('文档已另存为新文件');
    }
  }, [activeTab, currentMode, updateTabFile, showToast]);

  // 打开本地文件并新建 Tab (⌘O)
  const handleOpenLocalFile = useCallback(async () => {
    const res = await openDocument();
    if (res) {
      handleCreateNewTab(res.fileName, res.content, res.filePath);

      // 若打开的文件存在本地磁盘路径，自动将其所在目录加入工作区（若尚未包含）
      if (res.filePath) {
        const lastSlash = res.filePath.lastIndexOf('/');
        if (lastSlash > 0) {
          const parentDir = res.filePath.substring(0, lastSlash);
          const tree = await scanDirectoryTree(parentDir);
          const name = parentDir.split('/').pop() || parentDir;
          setWorkspaceFolders((prev) => {
            if (prev.some((f) => f.path === parentDir)) return prev;
            const updated = [...prev, { id: parentDir, name, path: parentDir, tree }];
            saveStoredWorkspaceFolderPaths(updated.map((f) => f.path));
            return updated;
          });
        }
      }
    }
  }, [handleCreateNewTab]);

  // 复制微信公众号富文本 (⇧⌘C)
  const handleCopyWechat = useCallback(async () => {
    setIsExportMenuOpen(false);
    const success = await copyWechatHtmlToClipboard(activeTab.content);
    if (success) {
      showToast('已复制为公众号/知乎排版 (直接 Cmd+V 粘贴)');
    }
  }, [activeTab.content, showToast]);

  // 插入独立公式块 (Math Block - ⌥⌘M)
  const handleInsertMathBlock = useCallback(() => {
    if (currentMode === 'wysiwyg' && milkdownRef.current) {
      milkdownRef.current.insertMathBlock();
      showToast('已插入独立公式块 (⌥⌘M)');
    } else {
      updateTabContent(
        activeTab.id,
        activeTab.content + '\n\n$$\n\\int_{-\\infty}^{+\\infty} e^{-x^2} dx = \\sqrt{\\pi}\n$$\n\n'
      );
      showToast('已插入独立公式块 (⌥⌘M)');
    }
  }, [currentMode, activeTab, updateTabContent, showToast]);

  // 插入行内公式 (Inline Math - $formula$)
  const handleInsertInlineMath = useCallback(() => {
    if (currentMode === 'wysiwyg' && milkdownRef.current) {
      milkdownRef.current.insertInlineMath();
      showToast('已插入行内公式 ($formula$)');
    } else {
      updateTabContent(activeTab.id, activeTab.content + ' $E = mc^2$ ');
      showToast('已插入行内公式 ($formula$)');
    }
  }, [currentMode, activeTab, updateTabContent, showToast]);

  // 快捷键 ⌥⌘M 智能调度
  const handleInsertMath = useCallback(() => {
    handleInsertMathBlock();
  }, [handleInsertMathBlock]);

  // 快捷键监听 (全面对齐 Typora / macOS 常用快捷键)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      const keyLower = e.key.toLowerCase();

      if (isMeta && !e.shiftKey && !e.altKey && keyLower === 's') {
        e.preventDefault();
        handleSaveActiveTab();
      } else if (isMeta && e.shiftKey && !e.altKey && keyLower === 's') {
        e.preventDefault();
        handleSaveAsActiveTab();
      } else if (isMeta && !e.shiftKey && !e.altKey && keyLower === 'o') {
        e.preventDefault();
        handleOpenLocalFile();
      } else if (isMeta && !e.shiftKey && !e.altKey && keyLower === 'n') {
        e.preventDefault();
        handleCreateNewTab();
      } else if (isMeta && e.shiftKey && !e.altKey && keyLower === 'c') {
        e.preventDefault();
        handleCopyWechat();
      } else if (isMeta && e.key === '/') {
        e.preventDefault();
        handleToggleMode();
      } else if (isMeta && e.shiftKey && !e.altKey && (keyLower === 'o' || keyLower === 'l')) {
        e.preventDefault();
        setIsOutlineOpen((prev) => !prev);
      } else if (isMeta && e.shiftKey && !e.altKey && keyLower === 't') {
        e.preventDefault();
        setIsToolbarOpen((prev) => !prev);
      } else if (isMeta && e.altKey && (keyLower === 't' || e.code === 'KeyT')) {
        e.preventDefault();
        setIsInsertTableOpen(true);
      } else if (isMeta && e.altKey && (keyLower === 'm' || e.code === 'KeyM')) {
        e.preventDefault();
        handleInsertMath();
      } else if (e.key === 'F8') {
        e.preventDefault();
        setFocusMode((prev) => !prev);
      } else if (e.key === 'F9') {
        e.preventDefault();
        setTypewriterMode((prev) => !prev);
      } else if (isMeta && e.shiftKey && !e.altKey && keyLower === 'f') {
        e.preventDefault();
        setIsOutlineOpen(true);
        setSidebarViewMode('search');
      } else if (isMeta && !e.shiftKey && !e.altKey && keyLower === 'p') {
        e.preventDefault();
        setIsQuickOpenOpen((prev) => !prev);
      } else if (isMeta && !e.shiftKey && !e.altKey && keyLower === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (isMeta && e.key === ',') {
        e.preventDefault();
        setIsPreferencesOpen((prev) => !prev);
      } else if (
        isMeta &&
        (keyLower === 'h' || (e.altKey && (keyLower === 'f' || e.code === 'KeyF')))
      ) {
        e.preventDefault();
        setIsSearchOpen(true);
        setIsReplaceOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleSaveActiveTab,
    handleSaveAsActiveTab,
    handleOpenLocalFile,
    handleCreateNewTab,
    handleCopyWechat,
    handleToggleMode,
    handleInsertMath,
  ]);

  // 自动保存引擎 (Auto Save Engine: AC-27.2)
  useEffect(() => {
    if (!preferences.autoSaveDelay || preferences.autoSaveDelay <= 0) return;
    if (!activeTab.isDirty || !activeTab.filePath) return;

    const timer = setTimeout(() => {
      handleSaveActiveTab();
    }, preferences.autoSaveDelay);

    return () => clearTimeout(timer);
  }, [activeTab.isDirty, activeTab.filePath, activeTab.content, preferences.autoSaveDelay, handleSaveActiveTab]);

  // 窗口失去焦点时自动保存 (autoSaveDelay === -1)
  useEffect(() => {
    if (preferences.autoSaveDelay !== -1) return;

    const handleBlur = () => {
      if (activeTab.isDirty && activeTab.filePath) {
        handleSaveActiveTab();
      }
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [preferences.autoSaveDelay, activeTab.isDirty, activeTab.filePath, handleSaveActiveTab]);

  // 搜索上一个 / 下一个
  const handleNextMatch = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
  }, [matches]);

  const handlePrevMatch = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
  }, [matches]);

  // 替换单个 (同时同步 Tab 状态与 Milkdown WYSIWYG 视图)
  const handleReplaceSingle = useCallback(() => {
    if (matches.length === 0) return;
    const currentMatch = matches[currentMatchIndex] || matches[0];
    const newContent = replaceSingle(activeTab.content, currentMatch, replaceText);
    updateTabContent(activeTab.id, newContent);
    if (currentMode === 'wysiwyg') {
      milkdownRef.current?.setMarkdown(newContent);
    }
    showToast('已替换 1 处匹配文本');
  }, [activeTab, matches, currentMatchIndex, replaceText, currentMode, updateTabContent, showToast]);

  // 全部替换 (同时同步 Tab 状态与 Milkdown WYSIWYG 视图)
  const handleReplaceAll = useCallback(() => {
    if (!searchQuery) return;
    const res = replaceAll(activeTab.content, searchQuery, replaceText);
    if (res.count > 0) {
      updateTabContent(activeTab.id, res.content);
      if (currentMode === 'wysiwyg') {
        milkdownRef.current?.setMarkdown(res.content);
      }
      showToast(`已完成 ${res.count} 处全部替换`);
    }
  }, [activeTab, searchQuery, replaceText, currentMode, updateTabContent, showToast]);

  // 添加本地文件夹至侧边栏工作区 (支持添加多个文件夹)
  const handleAddFolder = useCallback(async () => {
    const res = await openFolderDialog();
    if (!res) return;

    setWorkspaceFolders((prev) => {
      const existing = prev.find((f) => f.path === res.folderPath);
      if (existing) {
        showToast(`文件夹 "${existing.name}" 已在工作区列表中`);
        return prev;
      }

      const name = res.folderPath.split('/').pop() || res.folderPath;
      const newFolder: WorkspaceFolder = {
        id: res.folderPath,
        name,
        path: res.folderPath,
        tree: res.tree,
      };

      const updated = [...prev, newFolder];
      saveStoredWorkspaceFolderPaths(updated.map((f) => f.path));
      showToast(`已添加文件夹 "${name}"`);
      return updated;
    });
  }, [showToast]);

  // 从侧边栏移除已添加的文件夹 (不删除磁盘文件)
  const handleRemoveFolder = useCallback(
    (folderPath: string) => {
      setWorkspaceFolders((prev) => {
        const target = prev.find((f) => f.path === folderPath);
        const updated = prev.filter((f) => f.path !== folderPath);
        saveStoredWorkspaceFolderPaths(updated.map((f) => f.path));
        if (target) {
          showToast(`已从侧边栏移除 "${target.name}"`);
        }
        return updated;
      });
    },
    [showToast]
  );

  // 重命名文件或目录并同步 Tab 与工作区
  const handleRenameItem = useCallback(
    async (oldPath: string, newName: string) => {
      const res = await renameItemOnDisk(oldPath, newName);
      if (!res.success) {
        showToast(`重命名失败: ${res.error || '未知错误'}`);
        return;
      }
      const newPath = res.newPath || oldPath;
      // 同步打开的 Tab
      tabs.forEach((tab) => {
        if (tab.filePath === oldPath) {
          updateTabFile(tab.id, newPath, newName);
        }
      });
      // 刷新所有工作区目录树
      setWorkspaceFolders((prev) => {
        Promise.all(
          prev.map(async (f) => ({
            ...f,
            name: f.path === oldPath ? newName : f.name,
            path: f.path === oldPath ? newPath : f.path,
            tree: await scanDirectoryTree(f.path === oldPath ? newPath : f.path),
          }))
        ).then((updated) => {
          setWorkspaceFolders(updated);
          saveStoredWorkspaceFolderPaths(updated.map((f) => f.path));
        });
        return prev;
      });
      showToast(`已重命名为 "${newName}"`);
    },
    [tabs, updateTabFile, showToast]
  );

  // 安全移到废纸篓 / 回收站并关闭对应 Tab
  const handleDeleteItem = useCallback(
    async (target: ContextMenuTarget) => {
      const res = await moveToTrash(target.path);
      if (!res.success) {
        showToast(`删除失败: ${res.error || '无法移到回收站'}`);
        return;
      }
      // 关闭受影响的 Tab
      tabs.forEach((tab) => {
        if (
          tab.filePath === target.path ||
          (target.type === 'folder' && tab.filePath?.startsWith(target.path + '/'))
        ) {
          forceCloseTab(tab.id);
        }
      });
      // 刷新工作区目录树
      setWorkspaceFolders((prev) => {
        Promise.all(
          prev.map(async (f) => ({
            ...f,
            tree: await scanDirectoryTree(f.path),
          }))
        ).then((updated) => setWorkspaceFolders(updated));
        return prev;
      });
      showToast(platform === 'win32' ? '已移到回收站' : '已移到废纸篓');
    },
    [tabs, forceCloseTab, platform, showToast]
  );

  // 侧边栏拖拽跨目录物理移动文件或目录 (F33)
  const handleMoveItem = useCallback(
    async (sourcePath: string, targetDirPath: string) => {
      const res = await window.electronAPI?.moveItem?.(sourcePath, targetDirPath);
      if (!res || !res.success) {
        showToast(`移动失败: ${res?.error || '无法移动项目'}`);
        return;
      }

      const newPath = res.newPath || sourcePath;
      if (newPath === sourcePath) {
        return;
      }

      const itemName = newPath.split(/[/\\]/).pop() || '';

      // 级联同步打开的 Tab 路径与名称 (保留 isDirty 和编辑状态)
      tabs.forEach((tab) => {
        if (tab.filePath === sourcePath) {
          updateTabFile(tab.id, newPath, itemName);
        } else if (
          tab.filePath &&
          (tab.filePath.startsWith(sourcePath + '/') || tab.filePath.startsWith(sourcePath + '\\'))
        ) {
          const relativeSub = tab.filePath.slice(sourcePath.length);
          const updatedSubPath = newPath + relativeSub;
          updateTabFile(tab.id, updatedSubPath, tab.fileName);
        }
      });

      // 刷新所有工作区目录树
      setWorkspaceFolders((prev) => {
        Promise.all(
          prev.map(async (f) => ({
            ...f,
            tree: await scanDirectoryTree(f.path),
          }))
        ).then((updated) => setWorkspaceFolders(updated));
        return prev;
      });

      showToast(`已移动到目标文件夹`);
    },
    [tabs, updateTabFile, showToast]
  );

  // 新建文件并自动打开新 Tab
  const handleCreateFile = useCallback(
    async (parentDir: string, fileName: string) => {
      const res = await createFileOnDisk(parentDir, fileName);
      if (!res.success || !res.filePath) {
        showToast(`新建文件失败: ${res.error || '创建失败'}`);
        return;
      }
      handleCreateNewTab(fileName, '', res.filePath);
      setWorkspaceFolders((prev) => {
        Promise.all(
          prev.map(async (f) => ({
            ...f,
            tree: await scanDirectoryTree(f.path),
          }))
        ).then((updated) => setWorkspaceFolders(updated));
        return prev;
      });
      showToast(`已新建文件 "${fileName}"`);
    },
    [handleCreateNewTab, showToast]
  );

  // 新建文件夹
  const handleCreateFolder = useCallback(
    async (parentDir: string, folderName: string) => {
      const res = await createFolderOnDisk(parentDir, folderName);
      if (!res.success) {
        showToast(`新建文件夹失败: ${res.error || '创建失败'}`);
        return;
      }
      setWorkspaceFolders((prev) => {
        Promise.all(
          prev.map(async (f) => ({
            ...f,
            tree: await scanDirectoryTree(f.path),
          }))
        ).then((updated) => setWorkspaceFolders(updated));
        return prev;
      });
      showToast(`已新建文件夹 "${folderName}"`);
    },
    [showToast]
  );

  // 在系统文件管理器中显示
  const handleRevealInExplorer = useCallback(
    async (filePath: string) => {
      await revealInExplorer(filePath);
    },
    []
  );

  // 点击侧边栏文件树中的 Markdown 文件直接打开或切换
  const handleSelectSidebarFile = useCallback(
    async (filePath: string) => {
      const existing = tabs.find((t) => t.filePath === filePath);
      if (existing) {
        handleSwitchTab(existing.id);
        return;
      }
      const res = await openDocumentByPath(filePath);
      if (res) {
        handleCreateNewTab(res.fileName, res.content, res.filePath);
      }
    },
    [tabs, handleSwitchTab, handleCreateNewTab]
  );

  // 点击侧边栏大纲项跳转至对应章节
  const handleSelectOutlineHeading = useCallback(
    (item: OutlineItem) => {
      setActiveHeadingId(item.id);
      const idx = outline.findIndex((o) => o.id === item.id);
      if (currentMode === 'wysiwyg' && idx >= 0) {
        milkdownRef.current?.scrollToHeading(idx);
      } else {
        updateTabCursor(activeTab.id, item.line, 1);
      }
    },
    [outline, currentMode, activeTab.id, updateTabCursor]
  );

  // 点击全工作区检索结果项跳转并微光定位 (F32)
  const handleSelectSearchMatch = useCallback(
    async (filePath: string, line: number) => {
      await handleSelectSidebarFile(filePath);
      setTimeout(() => {
        if (currentMode === 'wysiwyg') {
          milkdownRef.current?.scrollToLine(line);
        } else {
          updateTabCursor(activeTab.id, line, 1);
        }
      }, 60);
    },
    [handleSelectSidebarFile, currentMode, activeTab.id, updateTabCursor]
  );

  // 插入指定行列数的 GFM 表格
  const handleInsertTable = useCallback(
    (rows: number, cols: number) => {
      if (currentMode === 'wysiwyg' && milkdownRef.current) {
        milkdownRef.current.insertTable(rows, cols);
        showToast(`已插入 ${rows} 行 × ${cols} 列表格`);
      } else {
        const headers = Array.from({ length: cols }, (_, i) => `表头 ${i + 1}`).join(' | ');
        const dividers = Array.from({ length: cols }, () => '---').join(' | ');
        const bodyRows = Array.from({ length: Math.max(1, rows - 1) }, () =>
          Array.from({ length: cols }, () => '内容').join(' | ')
        )
          .map((r) => `| ${r} |`)
          .join('\n');
        const tableMd = `\n| ${headers} |\n| ${dividers} |\n${bodyRows}\n`;
        updateTabContent(activeTab.id, activeTab.content + tableMd);
        showToast(`已插入 ${rows} 行 × ${cols} 列表格`);
      }
    },
    [currentMode, activeTab, updateTabContent, showToast]
  );

  // 导出为 HTML
  const handleExportHtml = useCallback(async () => {
    setIsExportMenuOpen(false);
    const success = await exportToHtml(activeTab.fileName, activeTab.content);
    if (success) {
      showToast('已成功导出为独立 HTML 文件');
    }
  }, [activeTab, showToast]);

  // 导出为 PDF (唤起出版级导出配置)
  const handleExportPdf = useCallback(() => {
    setIsExportMenuOpen(false);
    setIsPdfModalOpen(true);
  }, []);

  const handleConfirmExportPdf = useCallback(
    async (options: PdfExportOptions) => {
      setIsPdfModalOpen(false);
      const success = await exportToPdf(activeTab.fileName, activeTab.content, options);
      if (success) {
        showToast('已成功导出出版级 PDF 文档');
      }
    },
    [activeTab, showToast]
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-[#FAF8F5] select-none text-[#1D1D1F] overflow-hidden relative">
      {/* 第一层：顶部标题栏 + 多标签栏一体化 Header (h-10) */}
      <header
        className="h-10 bg-[#FAF8F5] border-b border-black/5 flex items-center px-3 z-30 select-none shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* 左侧：避让 macOS 交通灯 (仅 macOS 非全屏时显示 70px 占位) + 原生侧边栏开关 (PanelLeft) */}
        <div
          className="flex items-center space-x-1.5 shrink-0 pr-2 transition-all duration-200"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {showTrafficLightSpacer && (
            <div
              data-testid="traffic-lights-spacer"
              className="w-[70px] h-full flex items-center transition-all duration-200"
            />
          )}
          <button
            onClick={() => setIsOutlineOpen((prev) => !prev)}
            title="切换大纲 (Cmd+Shift+O)"
            data-testid="sidebar-toggle-btn"
            className={`p-1.5 rounded-md transition ${
              isOutlineOpen ? 'bg-black/10 text-stone-900' : 'hover:bg-black/5 text-stone-600'
            }`}
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>

        {/* 中间：多标签页管理组件 (TabBar 自适应撑满剩余宽度，横向从容展开) */}
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={handleSwitchTab}
          onCloseTab={requestCloseTab}
          onNewTab={() => handleCreateNewTab()}
          onReorderTabs={reorderTabs}
        />

        {/* 右侧：仅保留窗口级全局核心开关 (快速打开 + 偏好设置 + 工具栏折叠按钮) */}
        <div
          className="shrink-0 flex items-center space-x-1.5 text-stone-500 pl-2"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={() => setIsQuickOpenOpen(true)}
            title={platform === 'darwin' ? '快速打开文件 (Cmd+P)' : '快速打开文件 (Ctrl+P)'}
            data-testid="header-quick-open-btn"
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium hover:bg-black/5 text-stone-500 hover:text-stone-700 transition cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="text-[11px]">快速打开</span>
          </button>
          <button
            onClick={() => setIsPreferencesOpen(true)}
            title={platform === 'darwin' ? '偏好设置 (Cmd+,)' : '偏好设置 (Ctrl+,)'}
            data-testid="header-preferences-btn"
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium hover:bg-black/5 text-stone-500 hover:text-stone-700 transition cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="text-[11px]">设置</span>
          </button>
          <button
            onClick={() => setIsToolbarOpen((prev) => !prev)}
            title="显示/隐藏编辑工具栏 (Cmd+Shift+T)"
            data-testid="toolbar-toggle-btn"
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition ${
              isToolbarOpen ? 'bg-black/5 text-stone-700' : 'hover:bg-black/5 text-stone-500'
            }`}
          >
            <PanelTop className="w-3.5 h-3.5" />
            <span className="text-[11px]">工具栏</span>
          </button>
        </div>
      </header>

      {/* 第二层：文档编辑专属工具栏 (Document Toolbar，高度 36px，可平滑折叠) */}
      <div
        data-testid="document-toolbar"
        className={`toolbar-container border-b border-black/5 px-4 flex items-center justify-between text-stone-600 text-xs shrink-0 select-none z-20 bg-[#FAF8F5]/95 backdrop-blur-md transition-all duration-200 ${
          isToolbarOpen
            ? 'toolbar-expanded py-1 overflow-visible'
            : 'toolbar-collapsed max-h-0 py-0 opacity-0 overflow-hidden pointer-events-none border-b-0'
        }`}
        style={{ minHeight: isToolbarOpen ? '36px' : '0px' }}
      >
        {/* 左侧逻辑分组 */}
        <div className="flex items-center space-x-1">
          {/* 插入排版组件分组 (表格、独立公式块、行内公式) */}
          <div className="flex items-center space-x-0.5">
            <button
              onClick={() => setIsInsertTableOpen(true)}
              title="插入表格 (⌥⌘T)"
              data-testid="toolbar-insert-table-btn"
              className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/5 text-stone-700 transition"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="text-[11px]">表格</span>
            </button>
            <button
              onClick={handleInsertMathBlock}
              title="插入独立公式块 (⌥⌘M)"
              data-testid="toolbar-insert-math-block-btn"
              className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/5 text-stone-700 transition"
            >
              <SquareSigma className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[11px]">公式块</span>
            </button>
            <button
              onClick={handleInsertInlineMath}
              title="插入行内公式 ($formula$)"
              data-testid="toolbar-insert-math-btn"
              className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/5 text-stone-700 transition"
            >
              <Sigma className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[11px]">行内</span>
            </button>
          </div>

          {/* 分隔线 */}
          <div className="h-3.5 w-px bg-stone-300/60 mx-1.5" />

          {/* 样式与检索分组 (排版主题、查找与替换) */}
          <div className="flex items-center space-x-0.5 relative">
            <button
              onClick={() => setIsThemePopoverOpen((prev) => !prev)}
              title="切换排版主题"
              data-testid="toolbar-theme-btn"
              className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/5 text-stone-700 transition"
            >
              <Palette className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-[11px]">主题</span>
            </button>

            <button
              onClick={() => setIsSearchOpen((prev) => !prev)}
              title="查找与替换 (Cmd+F)"
              data-testid="toolbar-search-btn"
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition ${
                isSearchOpen ? 'bg-amber-100 text-amber-800' : 'hover:bg-black/5 text-stone-700'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span className="text-[11px]">查找</span>
            </button>
          </div>

          {/* 分隔线 */}
          <div className="h-3.5 w-px bg-stone-300/60 mx-1.5" />

          {/* 文档操作分组 (打开、保存、导出) */}
          <div
            ref={exportMenuContainerRef}
            className="flex items-center space-x-0.5 relative"
          >
            <button
              onClick={handleOpenLocalFile}
              title="打开文档 (Cmd+O)"
              data-testid="toolbar-open-btn"
              className="p-1 rounded-md hover:bg-black/5 text-stone-600 hover:text-stone-900 transition"
            >
              <FolderOpen className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleSaveActiveTab}
              title="保存当前文档 (Cmd+S)"
              data-testid="toolbar-save-btn"
              className="p-1 rounded-md hover:bg-black/5 text-stone-600 hover:text-stone-900 transition"
            >
              <Save className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
              title="导出 / 分享"
              data-testid="toolbar-export-btn"
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition ml-0.5 ${
                isExportMenuOpen ? 'bg-black/10 text-stone-900' : 'hover:bg-black/5 text-stone-700'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="text-[11px]">导出</span>
            </button>

            {/* 导出下拉菜单 */}
            {isExportMenuOpen && (
              <div
                data-testid="toolbar-export-menu"
                className="absolute top-8 left-0 w-56 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-xl border border-black/10 dark:border-stone-700 shadow-2xl py-1.5 z-50 text-xs text-stone-700 dark:text-stone-200 select-none animate-in fade-in duration-100"
              >
                <div
                  data-testid="export-wechat-option"
                  onClick={handleCopyWechat}
                  className="px-3 py-2 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-900 dark:hover:text-amber-200 cursor-pointer flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold font-mono">Wx</span>
                    <span>复制为公众号/知乎排版</span>
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">⌘⇧C</span>
                </div>
                <div className="h-px bg-black/5 dark:bg-stone-800 my-1" />
                <div
                  data-testid="export-html-option"
                  onClick={handleExportHtml}
                  className="px-3 py-2 hover:bg-black/5 dark:hover:bg-stone-800 cursor-pointer flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-amber-600" />
                    <span>导出为独立 HTML</span>
                  </span>
                </div>
                <div
                  data-testid="export-pdf-option"
                  onClick={handleExportPdf}
                  className="px-3 py-2 hover:bg-black/5 dark:hover:bg-stone-800 cursor-pointer flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-red-500" />
                    <span>导出为 PDF 文档</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧：快捷收起按钮 */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsToolbarOpen(false)}
            title="收起工具栏以享受纯净打字 (Cmd+Shift+T)"
            data-testid="toolbar-collapse-btn"
            className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-700 px-2 py-0.5 rounded hover:bg-black/5 transition"
          >
            <span>收起</span>
            <ChevronUp className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 中间工作区：左侧双视图侧边栏 (文件/大纲) + 右侧连续画布编辑器 */}
      <div className="flex-1 flex overflow-hidden relative">
        <OutlineDrawer
          isOpen={isOutlineOpen}
          outline={outline}
          activeHeadingId={activeHeadingId}
          onSelectHeading={handleSelectOutlineHeading}
          folders={workspaceFolders}
          activeFilePath={activeTab.filePath}
          platform={platform}
          viewMode={sidebarViewMode}
          onViewModeChange={setSidebarViewMode}
          onSelectFile={handleSelectSidebarFile}
          onSelectSearchMatch={handleSelectSearchMatch}
          onAddFolder={handleAddFolder}
          onRemoveFolder={handleRemoveFolder}
          onRenameItem={handleRenameItem}
          onDeleteItem={handleDeleteItem}
          onMoveItem={handleMoveItem}
          onCreateFile={handleCreateFile}
          onCreateFolder={handleCreateFolder}
          onRevealInExplorer={handleRevealInExplorer}
          onValidationError={showToast}
        />

        <main className="flex-1 overflow-hidden relative bg-[var(--bg-primary,#FFFFFF)] transition-colors duration-150">
          {currentMode === 'wysiwyg' ? (
            <MilkdownEditor
              ref={milkdownRef}
              key={`${activeTab.id}-wysiwyg`}
              initialContent={activeTab.content}
              docFilePath={activeTab.filePath}
              focusMode={focusMode}
              typewriterMode={typewriterMode}
              onChange={(markdown) => updateTabContent(activeTab.id, markdown)}
              onCursorChange={(line, col) => updateTabCursor(activeTab.id, line, col)}
              onActiveHeadingChange={(idx) => {
                if (outline[idx]) {
                  setActiveHeadingId(outline[idx].id);
                }
              }}
            />
          ) : (
            <SourceEditor
              key={`${activeTab.id}-source`}
              content={activeTab.content}
              theme={currentTheme}
              cursorLine={activeTab.cursorLine}
              filePath={activeTab.filePath}
              fileName={activeTab.fileName}
              onChange={(newContent) => updateTabContent(activeTab.id, newContent)}
              onCursorChange={(line, col) => updateTabCursor(activeTab.id, line, col)}
            />
          )}

          {/* 悬浮查找替换面板 */}
          <SearchPanel
            isOpen={isSearchOpen}
            isReplaceOpen={isReplaceOpen}
            query={searchQuery}
            replaceText={replaceText}
            matches={matches}
            currentIndex={currentMatchIndex}
            onQueryChange={setSearchQuery}
            onReplaceTextChange={setReplaceText}
            onNext={handleNextMatch}
            onPrev={handlePrevMatch}
            onToggleReplace={() => setIsReplaceOpen((prev) => !prev)}
            onReplaceSingle={handleReplaceSingle}
            onReplaceAll={handleReplaceAll}
            onClose={() => setIsSearchOpen(false)}
          />
        </main>
      </div>

      {/* 底部 Typora 风格极简状态栏 */}
      <footer className="h-7 bg-[#FAF8F5] border-t border-black/5 px-4 flex items-center justify-between text-[11px] text-stone-500 font-mono select-none z-20 relative">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleMode}
            title={isCurrentTabMarkdown ? "点击切换编辑模式 (⌘/)" : "代码文件仅支持源码模式"}
            disabled={!isCurrentTabMarkdown}
            data-testid="mode-toggle-btn"
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition ${
              !isCurrentTabMarkdown
                ? 'opacity-60 cursor-not-allowed text-stone-400'
                : 'hover:bg-black/5 text-stone-700'
            }`}
          >
            {currentMode === 'wysiwyg' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                <span>🎨 实时渲染 (⌘/)</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1" />
                <span>📝 源码模式 (⌘/)</span>
              </>
            )}
          </button>

          <span
            data-testid="status-language-badge"
            className="px-1.5 py-0.5 rounded bg-black/5 text-stone-600 font-medium"
            title={`语言类型: ${currentLanguageInfo.displayName}`}
          >
            {currentLanguageInfo.displayName}
          </span>

          <button
            onClick={() => setFocusMode((prev) => !prev)}
            title="切换专注模式 (F8)"
            data-testid="focus-mode-toggle-btn"
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition ${
              focusMode
                ? 'bg-blue-500/15 text-blue-700 font-semibold'
                : 'hover:bg-black/5 text-stone-500'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>专注模式</span>
          </button>

          <button
            onClick={() => setTypewriterMode((prev) => !prev)}
            title="切换打字机滚动模式 (F9)"
            data-testid="typewriter-mode-toggle-btn"
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition ${
              typewriterMode
                ? 'bg-blue-500/15 text-blue-700 font-semibold'
                : 'hover:bg-black/5 text-stone-500'
            }`}
          >
            <AlignCenter className="w-3 h-3" />
            <span>打字机</span>
          </button>

          <span>UTF-8</span>
        </div>

        <div className="flex items-center space-x-3 text-stone-500 relative">
          <button
            onClick={() => setIsThemePopoverOpen((prev) => !prev)}
            title="切换排版主题"
            data-testid="theme-toggle-btn"
            className="px-2 py-0.5 rounded hover:bg-black/5 text-stone-600 transition flex items-center gap-1.5"
          >
            <Palette className="w-3 h-3 text-stone-400" />
            <span>{THEME_LIST.find((t) => t.id === currentTheme)?.label || '主题'}</span>
          </button>

          <button
            onClick={() => setIsWordCountOpen((prev) => !prev)}
            title="点击查看字数与阅读时间详情"
            data-testid="word-count-trigger-btn"
            className="px-2 py-0.5 rounded hover:bg-black/5 text-stone-600 transition flex items-center gap-2"
          >
            <span>{docStats.wordCount} 词</span>
            <span className="text-stone-300">|</span>
            <span>{activeTab.content.length} 字符</span>
          </button>
          <span>{outline.length} 章节</span>

          <ThemeSelectorPopover
            currentTheme={currentTheme}
            isOpen={isThemePopoverOpen}
            onSelect={handleSelectTheme}
            onClose={() => setIsThemePopoverOpen(false)}
          />

          <WordCountPopover
            stats={docStats}
            isOpen={isWordCountOpen}
            onClose={() => setIsWordCountOpen(false)}
          />
        </div>
      </footer>

      {/* 插入表格弹窗 (⌥⌘T) */}
      <InsertTableModal
        isOpen={isInsertTableOpen}
        onClose={() => setIsInsertTableOpen(false)}
        onInsert={handleInsertTable}
      />

      {/* 未保存阻断确认 Modal */}
      <UnsavedConfirmModal
        tab={closePendingTab}
        onCancel={cancelClose}
        onDiscard={confirmDiscardAndClose}
        onSave={async () => {
          if (closePendingTab) {
            await saveDocument(closePendingTab.filePath, closePendingTab.content, closePendingTab.fileName);
            confirmDiscardAndClose();
          }
        }}
      />

      {/* 全局闪电快速打开模态窗口 (Cmd+P) */}
      <QuickOpenModal
        isOpen={isQuickOpenOpen}
        files={workspaceFiles}
        onOpenFile={handleSelectSidebarFile}
        onClose={() => setIsQuickOpenOpen(false)}
      />

      {/* 偏好设置模态窗口 (Cmd+,) */}
      <PreferencesModal
        isOpen={isPreferencesOpen}
        preferences={preferences}
        platform={platform}
        onUpdatePreferences={handleUpdatePreferences}
        onResetPreferences={handleResetPreferences}
        onClose={() => setIsPreferencesOpen(false)}
      />

      {/* 出版级 PDF 导出配置模态窗口 */}
      <ExportModal
        isOpen={isPdfModalOpen}
        fileName={activeTab.fileName}
        onClose={() => setIsPdfModalOpen(false)}
        onConfirm={handleConfirmExportPdf}
      />

      {/* Toast 提示浮层 */}
      {toastMessage && (
        <div id="app-toast" data-testid="app-toast" className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-stone-900/95 text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default App;
