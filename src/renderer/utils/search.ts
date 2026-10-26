export interface SearchMatch {
  index: number;
  from: number;
  to: number;
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function findMatches(
  content: string,
  query: string,
  caseSensitive = false
): SearchMatch[] {
  if (!content || !query) return [];

  const flags = caseSensitive ? 'g' : 'gi';
  const regex = new RegExp(escapeRegExp(query), flags);
  const matches: SearchMatch[] = [];
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = regex.exec(content)) !== null) {
    matches.push({
      index: idx++,
      from: match.index,
      to: match.index + match[0].length,
    });
  }

  return matches;
}

export function replaceSingle(
  content: string,
  match: SearchMatch,
  replacement: string
): string {
  if (!match) return content;
  return content.slice(0, match.from) + replacement + content.slice(match.to);
}

export function replaceAll(
  content: string,
  query: string,
  replacement: string,
  caseSensitive = false
): { content: string; count: number } {
  if (!content || !query) return { content, count: 0 };

  const flags = caseSensitive ? 'g' : 'gi';
  const regex = new RegExp(escapeRegExp(query), flags);
  let count = 0;

  const newContent = content.replace(regex, () => {
    count++;
    return replacement;
  });

  return {
    content: newContent,
    count,
  };
}
