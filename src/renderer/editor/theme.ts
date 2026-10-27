import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { HighlightStyle, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import type { AppTheme } from '../services/themeService';

export const lightSyntaxHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#af00db', fontWeight: 'bold' },
  { tag: [tags.name, tags.deleted, tags.character, tags.propertyName, tags.macroName], color: '#001080' },
  { tag: [tags.function(tags.variableName), tags.labelName], color: '#795e26' },
  { tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)], color: '#0070c1' },
  { tag: [tags.definition(tags.name), tags.separator], color: '#001080' },
  { tag: [tags.typeName, tags.className, tags.number, tags.changed, tags.annotation, tags.modifier, tags.self, tags.namespace], color: '#267f99' },
  { tag: [tags.operator, tags.operatorKeyword, tags.url, tags.escape, tags.regexp, tags.link], color: '#000000' },
  { tag: [tags.meta, tags.comment], color: '#008000', fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: tags.link, color: '#0969da', textDecoration: 'underline' },
  { tag: tags.heading, fontWeight: 'bold', color: '#0000ff' },
  { tag: [tags.atom, tags.bool, tags.special(tags.variableName)], color: '#0000ff' },
  { tag: [tags.processingInstruction, tags.string, tags.inserted], color: '#a31515' },
  { tag: tags.invalid, color: '#ff0000' },
]);

export const darkSyntaxHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#c586c0', fontWeight: 'bold' },
  { tag: [tags.name, tags.deleted, tags.character, tags.propertyName, tags.macroName], color: '#9cdcfe' },
  { tag: [tags.function(tags.variableName), tags.labelName], color: '#dcdcaa' },
  { tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)], color: '#4fc1ff' },
  { tag: [tags.definition(tags.name), tags.separator], color: '#9cdcfe' },
  { tag: [tags.typeName, tags.className, tags.number, tags.changed, tags.annotation, tags.modifier, tags.self, tags.namespace], color: '#4ec9b0' },
  { tag: [tags.operator, tags.operatorKeyword, tags.url, tags.escape, tags.regexp, tags.link], color: '#d4d4d4' },
  { tag: [tags.meta, tags.comment], color: '#6a9955', fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: tags.link, color: '#3794ff', textDecoration: 'underline' },
  { tag: tags.heading, fontWeight: 'bold', color: '#569cd6' },
  { tag: [tags.atom, tags.bool, tags.special(tags.variableName)], color: '#569cd6' },
  { tag: [tags.processingInstruction, tags.string, tags.inserted], color: '#ce9178' },
  { tag: tags.invalid, color: '#f44747' },
]);

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
  const isDark = theme === 'night';
  const highlightExt = isDark ? darkSyntaxHighlight : lightSyntaxHighlight;

  let themeExt: Extension;
  switch (theme) {
    case 'github':
      themeExt = githubEditorTheme;
      break;
    case 'night':
      themeExt = nightEditorTheme;
      break;
    case 'newsprint':
      themeExt = newsprintEditorTheme;
      break;
    case 'macos-light':
    default:
      themeExt = macosEditorTheme;
      break;
  }

  return [themeExt, syntaxHighlighting(highlightExt), syntaxHighlighting(defaultHighlightStyle, { fallback: true })];
}
