import { describe, it, expect } from 'vitest';
import { Packer } from 'docx';
import { convertMarkdownToDocxDocument, parseInlineRuns } from '../../src/main/docxExportService';

describe('Word .docx Structured Exporter (T510 / F36 / AC-36.1)', () => {
  const sampleMarkdown = `
# System Architecture

This is a **bold statement** and an *italic note* and \`inline code\`.

## Subsystem Details

- First bullet item
- Second bullet item

> Distributed systems require high availability and resilience.

\`\`\`rust
fn raft_election() {
    println!("vote granted");
}
\`\`\`

| Node | Status |
|---|---|
| Alpha | Active |
| Beta | Idle |
`;

  it('parses inline markdown formatted text into TextRun descriptors', () => {
    const text = 'Normal **bold** *italic* `code` ~~deleted~~';
    const runs = parseInlineRuns(text);

    expect(runs.length).toBeGreaterThan(1);
    const jsonStr = JSON.stringify(runs);
    expect(jsonStr).toContain('bold');
    expect(jsonStr).toContain('italic');
    expect(jsonStr).toContain('code');
    expect(jsonStr).toContain('deleted');
    expect(jsonStr).toContain('Courier New');
  });

  it('converts full markdown document into a valid docx Document instance', () => {
    const doc = convertMarkdownToDocxDocument(sampleMarkdown, 'System Architecture');
    expect(doc).toBeDefined();
  });

  it('serializes docx Document into valid binary buffer with Packer.toBuffer', async () => {
    const doc = convertMarkdownToDocxDocument(sampleMarkdown, 'System Architecture');
    const buffer = await Packer.toBuffer(doc);

    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(1000);
    // Standard DOCX zip header magic numbers PK (0x50 0x4B)
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4B);
  });
});
