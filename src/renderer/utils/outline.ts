export interface OutlineItem {
  id: string;
  level: number;
  text: string;
  line: number;
  from: number;
}

export function cleanHeadingText(raw: string): string {
  return raw
    .replace(/\*\*([^*]+)\*\*/g, '$1') // **bold**
    .replace(/__([^_]+)__/g, '$1') // __bold__
    .replace(/\*([^*]+)\*/g, '$1') // *italic*
    .replace(/_([^_]+)_/g, '$1') // _italic_
    .replace(/`([^`]+)`/g, '$1') // `code`
    .replace(/~~([^~]+)~~/g, '$1') // ~~strikethrough~~
    .trim();
}

export function extractOutline(content: string): OutlineItem[] {
  if (!content) return [];

  const lines = content.split('\n');
  const outline: OutlineItem[] = [];
  let inCodeBlock = false;
  let charOffset = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 检测围栏代码块 ``` 或 ~~~
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      inCodeBlock = !inCodeBlock;
      charOffset += line.length + 1;
      continue;
    }

    if (!inCodeBlock) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const rawText = match[2];
        const cleanedText = cleanHeadingText(rawText);

        outline.push({
          id: `heading-${i + 1}-${charOffset}`,
          level,
          text: cleanedText,
          line: i + 1,
          from: charOffset,
        });
      }
    }

    charOffset += line.length + 1;
  }

  return outline;
}
