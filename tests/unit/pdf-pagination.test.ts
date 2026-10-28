import { describe, it, expect } from 'vitest';
import { generatePrintHtml, getPdfPrintOptions } from '../../src/renderer/utils/htmlExporter';

describe('PDF Pagination & Print Rules (T509 / F35 / AC-35.1 ~ AC-35.2)', () => {
  const sampleMarkdown = `
# Architecture Overview

Here is an introductory paragraph.

\`\`\`rust
fn consensus() {
    println!("raft heartbeat");
}
\`\`\`

| Node | Role | Status |
|---|---|---|
| A | Leader | Active |
| B | Follower | Active |

> Consensus note: High availability guaranteed.

![Diagram](https://example.com/arch.png)
`;

  it('injects break-inside: avoid for code blocks, tables, blockquotes, and images', () => {
    const html = generatePrintHtml('Architecture Doc', sampleMarkdown, { pageSize: 'A4' });

    expect(html).toContain('break-inside: avoid');
    expect(html).toContain('page-break-inside: avoid');
    // Ensure selector covers pre, code, table, blockquote, img
    expect(html).toMatch(/pre[\s\S]*table[\s\S]*blockquote[\s\S]*img/);
  });

  it('injects break-after: avoid for heading elements to prevent orphan headings', () => {
    const html = generatePrintHtml('Architecture Doc', sampleMarkdown, { pageSize: 'A4' });

    expect(html).toContain('break-after: avoid');
    expect(html).toContain('page-break-after: avoid');
    expect(html).toMatch(/h1,\s*h2,\s*h3/);
  });

  it('configures @page size for A4 and Letter accordingly', () => {
    const htmlA4 = generatePrintHtml('Doc A4', sampleMarkdown, { pageSize: 'A4' });
    expect(htmlA4).toContain('size: A4 portrait');

    const htmlLetter = generatePrintHtml('Doc Letter', sampleMarkdown, { pageSize: 'Letter' });
    expect(htmlLetter).toContain('size: Letter portrait');
  });

  it('configures margin presets correctly in HTML and print options', () => {
    const htmlStandard = generatePrintHtml('Doc', sampleMarkdown, { marginPreset: 'standard' });
    expect(htmlStandard).toContain('20mm 15mm');

    const htmlNarrow = generatePrintHtml('Doc', sampleMarkdown, { marginPreset: 'narrow' });
    expect(htmlNarrow).toContain('10mm 10mm');

    const optionsStandard = getPdfPrintOptions({
      pageSize: 'A4',
      marginPreset: 'standard',
      displayHeaderFooter: true,
      headerTitle: 'Arch Spec',
    });

    expect(optionsStandard.pageSize).toBe('A4');
    expect(optionsStandard.printBackground).toBe(true);
    expect(optionsStandard.displayHeaderFooter).toBe(true);
    expect(optionsStandard.headerTemplate).toContain('Arch Spec');
    expect(optionsStandard.footerTemplate).toContain('pageNumber');
    expect(optionsStandard.footerTemplate).toContain('totalPages');
    expect(optionsStandard.margins?.marginType).toBe('custom');
  });

  it('supports disabling header and footer', () => {
    const options = getPdfPrintOptions({
      pageSize: 'Letter',
      displayHeaderFooter: false,
    });

    expect(options.displayHeaderFooter).toBe(false);
  });
});
