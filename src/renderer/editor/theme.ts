import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import type { AppTheme } from '../services/themeService';

export const macosEditorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
    fontFamily: '"SF Mono", Menlo, Monaco, Consolas, monospace',
  },
  '.cm-scroller': {
    overflow: 'auto',
    lineHeight: '1.65',
    padding: '16px 20px',
  },
  '.cm-content': {
    caretColor: '#2563EB',
    maxWidth: '820px',
    margin: '0 auto',
    padding: '0 24px 120px 24px',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#2563EB',
    borderLeftWidth: '2px',
  },
  '&.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'rgba(37, 99, 235, 0.15) !important',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: '#9CA3AF',
    borderRight: '1px solid rgba(0, 0, 0, 0.06)',
    paddingRight: '8px',
  },
  '&.cm-focused': {
    outline: 'none',
  },
});

export const githubEditorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
    backgroundColor: '#FFFFFF',
    color: '#24292F',
    fontFamily: '"SF Mono", Menlo, Monaco, Consolas, monospace',
  },
  '.cm-scroller': {
    overflow: 'auto',
    lineHeight: '1.65',
    padding: '16px 20px',
  },
  '.cm-content': {
    caretColor: '#0969DA',
    maxWidth: '820px',
    margin: '0 auto',
    padding: '0 24px 120px 24px',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#0969DA',
    borderLeftWidth: '2px',
  },
  '&.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'rgba(9, 105, 218, 0.15) !important',
  },
  '.cm-gutters': {
    backgroundColor: '#F6F8FA',
    color: '#8C959F',
    borderRight: '1px solid #D0D7DE',
    paddingRight: '8px',
  },
  '&.cm-focused': {
    outline: 'none',
  },
});

export const nightEditorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
    backgroundColor: '#1E1E1E',
    color: '#D4D4D4',
    fontFamily: '"SF Mono", Menlo, Monaco, Consolas, monospace',
  },
  '.cm-scroller': {
    overflow: 'auto',
    lineHeight: '1.65',
    padding: '16px 20px',
  },
  '.cm-content': {
    caretColor: '#3B82F6',
    maxWidth: '820px',
    margin: '0 auto',
    padding: '0 24px 120px 24px',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#3B82F6',
    borderLeftWidth: '2px',
  },
  '&.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'rgba(59, 130, 246, 0.25) !important',
  },
  '.cm-gutters': {
    backgroundColor: '#1E1E1E',
    color: '#6E7681',
    borderRight: '1px solid #333333',
    paddingRight: '8px',
  },
  '&.cm-focused': {
    outline: 'none',
  },
}, { dark: true });

export const newsprintEditorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
    backgroundColor: '#F6F3ED',
    color: '#2C2621',
    fontFamily: '"SF Mono", Menlo, Monaco, Consolas, monospace',
  },
  '.cm-scroller': {
    overflow: 'auto',
    lineHeight: '1.65',
    padding: '16px 20px',
  },
  '.cm-content': {
    caretColor: '#B45309',
    maxWidth: '820px',
    margin: '0 auto',
    padding: '0 24px 120px 24px',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#B45309',
    borderLeftWidth: '2px',
  },
  '&.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'rgba(180, 83, 9, 0.18) !important',
  },
  '.cm-gutters': {
    backgroundColor: '#ECE7DF',
    color: '#8A8275',
    borderRight: '1px solid #DDD6CA',
    paddingRight: '8px',
  },
  '&.cm-focused': {
    outline: 'none',
  },
});

export function getCodeMirrorTheme(theme: AppTheme): Extension {
  switch (theme) {
    case 'github':
      return githubEditorTheme;
    case 'night':
      return nightEditorTheme;
    case 'newsprint':
      return newsprintEditorTheme;
    case 'macos-light':
    default:
      return macosEditorTheme;
  }
}
