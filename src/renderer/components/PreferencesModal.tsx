import React, { useState, useEffect } from 'react';
import { X, Sliders, Palette, FileText, Check, Info, ExternalLink, Mail } from 'lucide-react';
import { APP_VERSION } from '../../types';
import type {
  EditorPreferences,
  ColorScheme,
  EditorFontFamily,
  CodeFontFamily,
} from '../services/settingsService';

export interface PreferencesModalProps {
  isOpen: boolean;
  preferences: EditorPreferences;
  platform?: 'darwin' | 'win32' | 'linux';
  onUpdatePreferences: (updates: Partial<EditorPreferences>) => void;
  onResetPreferences?: () => void;
  onClose: () => void;
}

type SettingsTab = 'appearance' | 'editor' | 'files' | 'about';

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  preferences,
  platform = 'darwin',
  onUpdatePreferences,
  onResetPreferences,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');

  // ESC 键关闭
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="preferences-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs transition-opacity duration-150 select-none"
    >
      <div
        data-testid="preferences-modal"
        className="w-[620px] bg-[#FAF8F5] dark:bg-stone-900 border border-black/10 dark:border-stone-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* 模态顶栏 */}
        <div className="h-12 border-b border-black/5 dark:border-stone-700/60 flex items-center justify-between px-5 bg-white/60 dark:bg-stone-800/60">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-stone-800 dark:text-stone-100">
              偏好设置 (Preferences)
            </span>
            <span className="text-[10px] text-stone-400 font-mono">
              {platform === 'darwin' ? '⌘,' : 'Ctrl+,'}
            </span>
          </div>
          <button
            data-testid="prefs-close-btn"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xs px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>关闭 (Esc)</span>
          </button>
        </div>

        {/* 选项卡导航 */}
        <div className="flex border-b border-black/5 dark:border-stone-700/60 bg-stone-100/70 dark:bg-stone-800/40 px-5 gap-6 text-xs font-medium text-stone-500 dark:text-stone-400">
          <button
            data-testid="tab-btn-appearance"
            onClick={() => setActiveTab('appearance')}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'appearance'
                ? 'border-stone-800 text-stone-900 dark:border-stone-200 dark:text-stone-100 font-semibold'
                : 'border-transparent hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>外观 (Appearance)</span>
          </button>
          <button
            data-testid="tab-btn-editor"
            onClick={() => setActiveTab('editor')}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'editor'
                ? 'border-stone-800 text-stone-900 dark:border-stone-200 dark:text-stone-100 font-semibold'
                : 'border-transparent hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>编辑器 (Editor)</span>
          </button>
          <button
            data-testid="tab-btn-files"
            onClick={() => setActiveTab('files')}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'files'
                ? 'border-stone-800 text-stone-900 dark:border-stone-200 dark:text-stone-100 font-semibold'
                : 'border-transparent hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>文件与保存 (Files)</span>
          </button>
          <button
            data-testid="tab-btn-about"
            onClick={() => setActiveTab('about')}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'about'
                ? 'border-stone-800 text-stone-900 dark:border-stone-200 dark:text-stone-100 font-semibold'
                : 'border-transparent hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>关于 (About)</span>
          </button>
        </div>

        {/* 设置内容区 */}
        <div className="p-6 overflow-y-auto max-h-[460px] text-xs space-y-6">
          {/* Tab 1: 外观 */}
          {activeTab === 'appearance' && (
            <div className="space-y-5">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-200 mb-2">
                  默认视觉主题
                </label>
                <div className="grid grid-cols-4 gap-3">
                  <div
                    data-testid="theme-card-macos-light"
                    onClick={() => onUpdatePreferences({ theme: 'macos-light' })}
                    className={`theme-card border-2 p-3 rounded-xl cursor-pointer hover:shadow-xs transition relative ${
                      preferences.theme === 'macos-light'
                        ? 'border-amber-600 bg-white dark:bg-stone-800'
                        : 'border-stone-200 dark:border-stone-700 bg-white/70 dark:bg-stone-800/50'
                    }`}
                  >
                    <div className="w-full h-8 bg-white border border-stone-200 rounded mb-1.5 flex items-center justify-center text-[10px] text-stone-700">
                      Aa
                    </div>
                    <div className="font-medium text-stone-800 dark:text-stone-200 text-center">macOS Light</div>
                    {preferences.theme === 'macos-light' && (
                      <Check className="w-3 h-3 text-amber-600 absolute top-2 right-2" />
                    )}
                  </div>

                  <div
                    data-testid="theme-card-github"
                    onClick={() => onUpdatePreferences({ theme: 'github' })}
                    className={`theme-card border-2 p-3 rounded-xl cursor-pointer hover:shadow-xs transition relative ${
                      preferences.theme === 'github'
                        ? 'border-amber-600 bg-white dark:bg-stone-800'
                        : 'border-stone-200 dark:border-stone-700 bg-white/70 dark:bg-stone-800/50'
                    }`}
                  >
                    <div className="w-full h-8 bg-[#F6F8FA] border border-stone-200 rounded mb-1.5 flex items-center justify-center text-[10px] text-stone-700">
                      Aa
                    </div>
                    <div className="font-medium text-stone-800 dark:text-stone-200 text-center">GitHub</div>
                    {preferences.theme === 'github' && (
                      <Check className="w-3 h-3 text-amber-600 absolute top-2 right-2" />
                    )}
                  </div>

                  <div
                    data-testid="theme-card-night"
                    onClick={() => onUpdatePreferences({ theme: 'night' })}
                    className={`theme-card border-2 p-3 rounded-xl cursor-pointer hover:shadow-xs transition relative ${
                      preferences.theme === 'night'
                        ? 'border-amber-600 bg-white dark:bg-stone-800'
                        : 'border-stone-200 dark:border-stone-700 bg-white/70 dark:bg-stone-800/50'
                    }`}
                  >
                    <div className="w-full h-8 bg-[#1E1E1E] border border-stone-800 rounded mb-1.5 flex items-center justify-center text-[10px] text-stone-200">
                      Aa
                    </div>
                    <div className="font-medium text-stone-800 dark:text-stone-200 text-center">Night (暗黑)</div>
                    {preferences.theme === 'night' && (
                      <Check className="w-3 h-3 text-amber-600 absolute top-2 right-2" />
                    )}
                  </div>

                  <div
                    data-testid="theme-card-newsprint"
                    onClick={() => onUpdatePreferences({ theme: 'newsprint' })}
                    className={`theme-card border-2 p-3 rounded-xl cursor-pointer hover:shadow-xs transition relative ${
                      preferences.theme === 'newsprint'
                        ? 'border-amber-600 bg-white dark:bg-stone-800'
                        : 'border-stone-200 dark:border-stone-700 bg-white/70 dark:bg-stone-800/50'
                    }`}
                  >
                    <div className="w-full h-8 bg-[#FBF0D9] border border-[#F3E5C8] rounded mb-1.5 flex items-center justify-center text-[10px] text-[#5B4636]">
                      Aa
                    </div>
                    <div className="font-medium text-stone-800 dark:text-stone-200 text-center">羊皮纸</div>
                    {preferences.theme === 'newsprint' && (
                      <Check className="w-3 h-3 text-amber-600 absolute top-2 right-2" />
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-black/5 dark:border-stone-700/60 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-stone-700 dark:text-stone-200">色彩模式</div>
                  <div className="text-stone-400 text-[11px]">跟随系统或强制指定明暗模式</div>
                </div>
                <select
                  value={preferences.colorScheme}
                  onChange={(e) => onUpdatePreferences({ colorScheme: e.target.value as ColorScheme })}
                  className="px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-lg text-xs outline-none cursor-pointer"
                >
                  <option value="system">跟随系统外观 (System)</option>
                  <option value="light">浅色模式 (Light)</option>
                  <option value="dark">深色模式 (Dark)</option>
                </select>
              </div>
            </div>
          )}

          {/* Tab 2: 编辑器 */}
          {activeTab === 'editor' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-stone-700 dark:text-stone-200">正文字号 (Font Size)</div>
                  <div className="text-stone-400 text-[11px]">调节所见即所得与源码模式文字大小</div>
                </div>
                <select
                  data-testid="prefs-font-size-select"
                  value={preferences.fontSize}
                  onChange={(e) => onUpdatePreferences({ fontSize: Number(e.target.value) })}
                  className="px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-lg text-xs outline-none cursor-pointer"
                >
                  <option value="13">13 px (小巧)</option>
                  <option value="14">14 px (精简)</option>
                  <option value="15">15 px (适中)</option>
                  <option value="16">16 px (默认推荐)</option>
                  <option value="18">18 px (舒适大号)</option>
                  <option value="20">20 px (超大屏)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-black/5 dark:border-stone-700/60 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-stone-700 dark:text-stone-200">画布最大行宽 (Max Content Width)</div>
                  <div className="text-stone-400 text-[11px]">限制打字行长以保证高可读性视觉焦点</div>
                </div>
                <select
                  data-testid="prefs-max-width-select"
                  value={preferences.maxWidth}
                  onChange={(e) => {
                    const val = e.target.value === '100%' ? '100%' : Number(e.target.value);
                    onUpdatePreferences({ maxWidth: val });
                  }}
                  className="px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-lg text-xs outline-none cursor-pointer"
                >
                  <option value="720">720 px (经典紧凑)</option>
                  <option value="860">860 px (黄金分割比例)</option>
                  <option value="1024">1024 px (宽屏展示)</option>
                  <option value="100%">100% (铺满整屏)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-black/5 dark:border-stone-700/60 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-stone-700 dark:text-stone-200">行高比例 (Line Height)</div>
                  <div className="text-stone-400 text-[11px]">段落文本上下行间距</div>
                </div>
                <select
                  data-testid="prefs-line-height-select"
                  value={preferences.lineHeight}
                  onChange={(e) => onUpdatePreferences({ lineHeight: Number(e.target.value) })}
                  className="px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-lg text-xs outline-none cursor-pointer"
                >
                  <option value="1.5">1.5 (紧凑)</option>
                  <option value="1.6">1.6 (默认优美)</option>
                  <option value="1.75">1.75 (通透大间距)</option>
                  <option value="1.8">1.8 (宽松)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-black/5 dark:border-stone-700/60 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-stone-700 dark:text-stone-200">正文字体族 (Font Family)</div>
                  <div className="text-stone-400 text-[11px]">选择文章主要排版字体类型</div>
                </div>
                <select
                  value={preferences.fontFamily}
                  onChange={(e) => onUpdatePreferences({ fontFamily: e.target.value as EditorFontFamily })}
                  className="px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-lg text-xs outline-none cursor-pointer"
                >
                  <option value="system">系统默认 (SF Pro / PingFang / Segoe UI)</option>
                  <option value="sans-serif">无衬线字体 (Inter / Roboto)</option>
                  <option value="serif">衬线字体 (Georgia / 宋体)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-black/5 dark:border-stone-700/60 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-stone-700 dark:text-stone-200">代码等宽字体 (Code Font)</div>
                  <div className="text-stone-400 text-[11px]">针对编程语言代码块与源码模式的排版</div>
                </div>
                <select
                  value={preferences.codeFontFamily}
                  onChange={(e) => onUpdatePreferences({ codeFontFamily: e.target.value as CodeFontFamily })}
                  className="px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-lg text-xs outline-none cursor-pointer"
                >
                  <option value="monospace">系统等宽 (SF Mono / Menlo / Consolas)</option>
                  <option value="jetbrains-mono">JetBrains Mono</option>
                  <option value="fira-code">Fira Code</option>
                  <option value="sf-mono">SF Mono</option>
                </select>
              </div>
            </div>
          )}

          {/* Tab 3: 文件与保存 */}
          {activeTab === 'files' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-stone-700 dark:text-stone-200">自动保存 (Auto Save)</div>
                  <div className="text-stone-400 text-[11px]">编辑时自动向磁盘落盘已打开的本地文件</div>
                </div>
                <select
                  data-testid="prefs-auto-save-select"
                  value={preferences.autoSaveDelay}
                  onChange={(e) => onUpdatePreferences({ autoSaveDelay: Number(e.target.value) })}
                  className="px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-lg text-xs outline-none cursor-pointer"
                >
                  <option value="0">关闭 (仅手动保存)</option>
                  <option value="1000">延迟 1 秒后自动保存</option>
                  <option value="5000">延迟 5 秒后自动保存 (推荐)</option>
                  <option value="-1">窗口失去焦点时自动保存</option>
                </select>
              </div>

              <div className="pt-3 border-t border-black/5 dark:border-stone-700/60 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-stone-700 dark:text-stone-200">冷启动恢复工作区</div>
                  <div className="text-stone-400 text-[11px]">启动应用时自动恢复上一次退出的工作区与打开的文件</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.restoreLastSession}
                  onChange={(e) => onUpdatePreferences({ restoreLastSession: e.target.checked })}
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* 关于选项卡 (About) */}
          {activeTab === 'about' && (
            <div className="space-y-6 py-2" data-testid="prefs-about-panel">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-md flex items-center justify-center text-white font-serif font-bold text-2xl select-none">
                  M
                </div>
                <div>
                  <div className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <span>mditor</span>
                    <span className="px-2 py-0.5 text-xs font-mono bg-black/5 dark:bg-white/10 rounded-full font-normal text-stone-600 dark:text-stone-300">
                      v{APP_VERSION}
                    </span>
                  </div>
                  <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    一款兼具 macOS 极致优雅视觉与丝滑交互体验的跨平台 Markdown 编辑器
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-black/5 dark:border-stone-700/60 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-black/5 dark:border-stone-700/40">
                  <span className="text-stone-500 dark:text-stone-400">当前版本</span>
                  <span className="font-mono text-stone-700 dark:text-stone-200 font-medium">v{APP_VERSION}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-black/5 dark:border-stone-700/40">
                  <span className="text-stone-500 dark:text-stone-400">项目地址</span>
                  <button
                    onClick={() => {
                      if (window.electronAPI?.openExternal) {
                        window.electronAPI.openExternal('https://github.com/monkeychen/mditor');
                      } else {
                        window.open('https://github.com/monkeychen/mditor', '_blank');
                      }
                    }}
                    className="flex items-center gap-1 text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    <span>https://github.com/monkeychen/mditor</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-stone-500 dark:text-stone-400">作者信息</span>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-800 dark:text-stone-200 font-medium">陈志安</span>
                    <span className="text-stone-300 dark:text-stone-600">|</span>
                    <button
                      onClick={() => {
                        if (window.electronAPI?.openExternal) {
                          window.electronAPI.openExternal('mailto:cza55007@gmail.com');
                        } else {
                          window.open('mailto:cza55007@gmail.com');
                        }
                      }}
                      className="flex items-center gap-1 text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      <Mail className="w-3 h-3" />
                      <span>cza55007@gmail.com</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部状态说明 */}
        <div className="h-10 border-t border-black/5 dark:border-stone-700/60 bg-stone-50 dark:bg-stone-800/80 px-5 flex items-center justify-between text-[11px] text-stone-400">
          <span>改动立即自动保存并生效，无需重启</span>
          {onResetPreferences && (
            <button
              onClick={onResetPreferences}
              className="hover:text-amber-700 dark:hover:text-amber-400 cursor-pointer transition"
            >
              恢复默认设置
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreferencesModal;
