import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
} from 'docx';
import { BrowserWindow, dialog } from 'electron';
import fs from 'fs/promises';

export interface InlineRunConfig {
  text: string;
  bold?: boolean;
  italics?: boolean;
  strike?: boolean;
  font?: string;
  size?: number;
}

export function parseInlineRuns(text: string): TextRun[] {
  if (!text) return [];

  // Match bold (**text** or __text__), strikethrough (~~text~~), inline code (`code`), italic (*text* or _text_), or normal text
  const tokenRegex = /(\*\*(?:[^*]|\*(?!\*))+\*\*|__(?:[^_]|_(?!_))+__|~~(?:[^~]|~(?!~))+~~|`[^`]+`|\*[^*]+\*|_[^_]+_|(?:\\[*_~`]|[^^*_~`])+|[*_~`])/g;
  const matches = text.match(tokenRegex) || [text];
  const runs: TextRun[] = [];

  for (const match of matches) {
    if (!match) continue;

    if ((match.startsWith('**') && match.endsWith('**')) || (match.startsWith('__') && match.endsWith('__'))) {
      const inner = match.slice(2, -2);
      runs.push(new TextRun({ text: inner, bold: true }));
    } else if (match.startsWith('~~') && match.endsWith('~~')) {
      const inner = match.slice(2, -2);
      runs.push(new TextRun({ text: inner, strike: true }));
    } else if (match.startsWith('`') && match.endsWith('`')) {
      const inner = match.slice(1, -1);
      runs.push(
        new TextRun({
          text: inner,
          font: 'Courier New',
          shading: { fill: 'F4F4F5' },
        })
      );
    } else if ((match.startsWith('*') && match.endsWith('*')) || (match.startsWith('_') && match.endsWith('_'))) {
      const inner = match.slice(1, -1);
      runs.push(new TextRun({ text: inner, italics: true }));
    } else {
      runs.push(new TextRun({ text: match }));
    }
  }

  return runs;
}

export function convertMarkdownToDocxDocument(markdown: string, title?: string): Document {
  const lines = markdown.split(/\r?\n/);
  const children: (Paragraph | Table)[] = [];

  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  let inTable = false;
  let tableRowsRaw: string[][] = [];

  const flushTable = () => {
    if (tableRowsRaw.length === 0) return;
    // Filter out separator rows like |---|---|
    const validRows = tableRowsRaw.filter((row) => !row.every((cell) => /^[-:\s]+$/.test(cell)));

    if (validRows.length > 0) {
      const docxRows = validRows.map((rowCells, rowIdx) => {
        const isHeader = rowIdx === 0;
        return new TableRow({
          children: rowCells.map(
            (cellText) =>
              new TableCell({
                width: { size: 100 / Math.max(rowCells.length, 1), type: WidthType.PERCENTAGE },
                shading: isHeader ? { fill: 'F4F4F5' } : undefined,
                children: [
                  new Paragraph({
                    children: isHeader
                      ? [new TextRun({ text: cellText.trim(), bold: true })]
                      : parseInlineRuns(cellText.trim()),
                  }),
                ],
              })
          ),
        });
      });

      children.push(
        new Table({
          rows: docxRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );
    }

    tableRowsRaw = [];
    inTable = false;
  };

  const flushCodeBlock = () => {
    if (codeBlockLines.length === 0) return;
    for (const codeLine of codeBlockLines) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: codeLine || ' ',
              font: 'Courier New',
              size: 20,
            }),
          ],
          shading: { fill: 'F7F7F8' },
        })
      );
    }
    codeBlockLines = [];
    inCodeBlock = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Code blocks ```
    if (line.trim().startsWith('```')) {
      if (inTable) flushTable();
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // 2. Table row | col | col |
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      inTable = true;
      const cells = line
        .trim()
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      tableRowsRaw.push(cells);
      continue;
    } else if (inTable) {
      flushTable();
    }

    const trimmed = line.trim();
    if (!trimmed) {
      // Empty line spacing
      continue;
    }

    // 3. Headings # ...
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      let headingLevel = HeadingLevel.HEADING_1;
      if (level === 2) headingLevel = HeadingLevel.HEADING_2;
      else if (level === 3) headingLevel = HeadingLevel.HEADING_3;
      else if (level === 4) headingLevel = HeadingLevel.HEADING_4;
      else if (level === 5) headingLevel = HeadingLevel.HEADING_5;
      else if (level === 6) headingLevel = HeadingLevel.HEADING_6;

      children.push(
        new Paragraph({
          heading: headingLevel,
          children: parseInlineRuns(text),
          spacing: { before: 240, after: 120 },
        })
      );
      continue;
    }

    // 4. Blockquotes > ...
    if (trimmed.startsWith('>')) {
      const quoteText = trimmed.replace(/^>\s*/, '');
      children.push(
        new Paragraph({
          children: parseInlineRuns(quoteText),
          indent: { left: 720 },
          spacing: { before: 120, after: 120 },
        })
      );
      continue;
    }

    // 5. Unordered / ordered lists - / * / 1.
    const listMatch = trimmed.match(/^([-*+]|\d+\.)\s+(.*)$/);
    if (listMatch) {
      const listText = listMatch[2];
      children.push(
        new Paragraph({
          children: parseInlineRuns(listText),
          bullet: { level: 0 },
        })
      );
      continue;
    }

    // 6. Normal paragraph
    children.push(
      new Paragraph({
        children: parseInlineRuns(trimmed),
        spacing: { before: 80, after: 80 },
      })
    );
  }

  if (inCodeBlock) flushCodeBlock();
  if (inTable) flushTable();

  return new Document({
    title: title || 'Document',
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
}

export async function exportDocxFile(
  window: BrowserWindow | null,
  defaultName: string,
  markdown: string
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  if (!window) return { success: false, error: 'No active window' };

  const defaultPath = (defaultName || 'Untitled').replace(/\.[^/.]+$/, '') + '.docx';
  const { canceled, filePath } = await dialog.showSaveDialog(window, {
    title: '导出为 Word 文档 (.docx)',
    defaultPath,
    filters: [
      { name: 'Word Document', extensions: ['docx'] },
      { name: '所有文件', extensions: ['*'] },
    ],
  });

  if (canceled || !filePath) {
    return { success: false };
  }

  try {
    const doc = convertMarkdownToDocxDocument(markdown, defaultName);
    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(filePath, buffer);
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
