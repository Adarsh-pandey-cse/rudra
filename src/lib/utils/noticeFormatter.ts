export function autoFormatNoticeText(text: string): string {
  if (!text) return "";

  const lines = text.split('\n');
  
  const formattedLines = lines.map(line => {
    let trimmed = line.trim();
    if (!trimmed) return "";

    const isBulletLike = /^[-•*]/.test(trimmed) || /^\d+\./.test(trimmed);
    const isShortSentence = trimmed.length > 5 && trimmed.length < 80;
    const startsWithVerbOrAction = /^(Bring|Wear|Submit|Please|Note|Important|Exam|Test|Holiday|Class)/i.test(trimmed);
    
    if (!isBulletLike && isShortSentence && startsWithVerbOrAction) {
      trimmed = `✓ ${trimmed}`;
    }

    return trimmed;
  });

  return formattedLines.join('\n');
}

export function parseHighlights(text: string) {
  const importantKeywords = [
    "mandatory", "compulsory", "urgent", "important", "tomorrow",
    "exam", "test", "holiday", "deadline", "attention", "required"
  ];
  
  let formatted = text;
  importantKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
    formatted = formatted.replace(regex, '!!$1!!'); 
  });
  
  return formatted;
}
