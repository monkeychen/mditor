import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PreferencesModal } from '../../src/renderer/components/PreferencesModal';
import { DEFAULT_PREFERENCES } from '../../src/renderer/services/settingsService';

describe('PreferencesModal Component (T410 / AC-27.1 ~ AC-27.2)', () => {
  it('renders modal when isOpen is true and hides when isOpen is false', () => {
    const onClose = vi.fn();
    const onUpdate = vi.fn();

    const { rerender } = render(
      <PreferencesModal
        isOpen={false}
        preferences={DEFAULT_PREFERENCES}
        onUpdatePreferences={onUpdate}
        onClose={onClose}
      />
    );

    expect(screen.queryByTestId('preferences-modal')).not.toBeInTheDocument();

    rerender(
      <PreferencesModal
        isOpen={true}
        preferences={DEFAULT_PREFERENCES}
        onUpdatePreferences={onUpdate}
        onClose={onClose}
      />
    );

    expect(screen.getByTestId('preferences-modal')).toBeInTheDocument();
    expect(screen.getByText(/偏好设置/)).toBeInTheDocument();
  });

  it('switches between Appearance, Editor, and Files tabs', () => {
    render(
      <PreferencesModal
        isOpen={true}
        preferences={DEFAULT_PREFERENCES}
        onUpdatePreferences={vi.fn()}
        onClose={vi.fn()}
      />
    );

    // 默认展示外观 Tab
    expect(screen.getByTestId('tab-btn-appearance')).toBeInTheDocument();
    expect(screen.getByTestId('theme-card-github')).toBeInTheDocument();

    // 切换至编辑器 Tab
    fireEvent.click(screen.getByTestId('tab-btn-editor'));
    expect(screen.getByTestId('prefs-font-size-select')).toBeInTheDocument();
    expect(screen.getByTestId('prefs-max-width-select')).toBeInTheDocument();

    // 切换至文件与保存 Tab
    fireEvent.click(screen.getByTestId('tab-btn-files'));
    expect(screen.getByTestId('prefs-auto-save-select')).toBeInTheDocument();
  });

  it('triggers onUpdatePreferences when changing font size and max width', () => {
    const onUpdate = vi.fn();

    render(
      <PreferencesModal
        isOpen={true}
        preferences={DEFAULT_PREFERENCES}
        onUpdatePreferences={onUpdate}
        onClose={vi.fn()}
      />
    );

    // 进入编辑器 Tab
    fireEvent.click(screen.getByTestId('tab-btn-editor'));

    // 修改字号为 18
    const fontSizeSelect = screen.getByTestId('prefs-font-size-select');
    fireEvent.change(fontSizeSelect, { target: { value: '18' } });
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ fontSize: 18 }));

    // 修改行宽为 1024
    const maxWidthSelect = screen.getByTestId('prefs-max-width-select');
    fireEvent.change(maxWidthSelect, { target: { value: '1024' } });
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ maxWidth: 1024 }));

    // 修改行宽为 100%
    fireEvent.change(maxWidthSelect, { target: { value: '100%' } });
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ maxWidth: '100%' }));
  });

  it('triggers onUpdatePreferences when selecting theme card', () => {
    const onUpdate = vi.fn();

    render(
      <PreferencesModal
        isOpen={true}
        preferences={DEFAULT_PREFERENCES}
        onUpdatePreferences={onUpdate}
        onClose={vi.fn()}
      />
    );

    const darkThemeCard = screen.getByTestId('theme-card-night');
    fireEvent.click(darkThemeCard);
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ theme: 'night' }));
  });

  it('closes on close button click, Escape key, or backdrop click', () => {
    const onClose = vi.fn();

    render(
      <PreferencesModal
        isOpen={true}
        preferences={DEFAULT_PREFERENCES}
        onUpdatePreferences={vi.fn()}
        onClose={onClose}
      />
    );

    // 点击关闭按钮
    const closeBtn = screen.getByTestId('prefs-close-btn');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    // 按 Escape 键
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);

    // 点击背景遮罩
    const backdrop = screen.getByTestId('preferences-modal-backdrop');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
