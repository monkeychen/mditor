import { EditorView } from '@codemirror/view';

export const macosEditorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '16px',
    backgroundColor: '#FAF8F5',
    color: '#1D1D1F',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Helvetica Neue", sans-serif',
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'inherit',
    lineHeight: '1.75',
    padding: '24px 0',
  },
  '.cm-content': {
    caretColor: '#D97706',
    maxWidth: '820px',
    margin: '0 auto',
    padding: '0 32px 120px 32px',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#D97706',
    borderLeftWidth: '2px',
  },
  '&.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'rgba(217, 119, 6, 0.18) !important',
  },
  '.cm-line': {
    padding: '2px 0',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(217, 119, 6, 0.03)',
  },
  '.cm-gutters': {
    display: 'none', // 默认沉浸式隐藏行号槽
  },
});
