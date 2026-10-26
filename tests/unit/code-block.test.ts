import { describe, it, expect } from 'vitest';
import { parseCodeBlockInfo, copyCodeToClipboard } from '../../src/renderer/utils/codeBlock';

describe('Code Block Enhancement (AC2.5)', () => {
  it('parses language and raw code from fenced code block', () => {
    const fencedText = '```typescript\nconst greeting = "Hello mditor";\nconsole.log(greeting);\n```';
    const info = parseCodeBlockInfo(fencedText);

    expect(info.language).toBe('TypeScript');
    expect(info.code).toBe('const greeting = "Hello mditor";\nconsole.log(greeting);');
  });

  it('defaults to Code when no language tag is provided', () => {
    const fencedText = '```\necho "no language specified"\n```';
    const info = parseCodeBlockInfo(fencedText);

    expect(info.language).toBe('Code');
    expect(info.code).toBe('echo "no language specified"');
  });

  it('copies code text to clipboard via navigator.clipboard', async () => {
    const code = 'console.log("copy me")';
    const success = await copyCodeToClipboard(code);
    expect(success).toBe(true);
  });
});
