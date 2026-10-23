export interface DocumentStats {
  charCount: number;
  wordCount: number;
  lineCount: number;
}

export function calculateDocumentStats(text: string): DocumentStats {
  if (!text) {
    return {
      charCount: 0,
      wordCount: 0,
      lineCount: 1,
    };
  }

  const charCount = text.length;
  const lineCount = text.split('\n').length;

  // 汉字算 1 词，连续英文单词算 1 词
  const words = text.match(/[\u4e00-\u9fa5]|[\w-]+/g);
  const wordCount = words ? words.length : 0;

  return {
    charCount,
    wordCount,
    lineCount,
  };
}
