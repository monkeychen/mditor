export interface DocumentStats {
  charCount: number;
  charCountNoSpaces: number;
  wordCount: number;
  lineCount: number;
  readingTimeMinutes: number;
}

export function calculateDocumentStats(text: string): DocumentStats {
  if (!text) {
    return {
      charCount: 0,
      charCountNoSpaces: 0,
      wordCount: 0,
      lineCount: 1,
      readingTimeMinutes: 0,
    };
  }

  const charCount = text.length;
  const charCountNoSpaces = text.replace(/\s+/g, '').length;
  const lineCount = text.split('\n').length;

  // 汉字算 1 词，连续英文数字单词算 1 词
  const words = text.match(/[\u4e00-\u9fa5]|[a-zA-Z0-9_-]+/g);
  const wordCount = words ? words.length : 0;

  // 预计阅读时长 (按 300 词/分钟计算，非空且有词时至少 1 分钟)
  const readingTimeMinutes = wordCount === 0 ? 0 : Math.max(1, Math.ceil(wordCount / 300));

  return {
    charCount,
    charCountNoSpaces,
    wordCount,
    lineCount,
    readingTimeMinutes,
  };
}
