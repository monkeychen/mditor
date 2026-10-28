import { generateStandaloneHtml, generatePrintHtml } from '../utils/htmlExporter';
import type { PdfExportOptions } from '../../types';

export async function exportToHtml(fileName: string, markdown: string): Promise<boolean> {
  const html = generateStandaloneHtml(fileName, markdown);
  if (window.electronAPI?.exportHtml) {
    const res = await window.electronAPI.exportHtml(fileName, html);
    return res.success;
  }
  return false;
}

export async function exportToPdf(
  fileName: string,
  markdown: string,
  options?: PdfExportOptions
): Promise<boolean> {
  const html = generatePrintHtml(fileName, markdown, options);
  if (window.electronAPI?.exportPdf) {
    const res = await window.electronAPI.exportPdf(fileName, html, options);
    return res.success;
  }
  return false;
}

export async function exportToDocx(fileName: string, markdown: string): Promise<boolean> {
  if (window.electronAPI?.exportDocx) {
    const res = await window.electronAPI.exportDocx(fileName, markdown);
    return res.success;
  }
  return false;
}
