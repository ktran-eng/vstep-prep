/** Counts words the way examiners usually do: tokens separated by whitespace that contain a letter or digit. Hyphenated words and contractions count as one. */
export function countWords(text: string): number {
  if (!text) return 0;
  return text
    .trim()
    .split(/\s+/)
    .filter((tok) => /[\p{L}\p{N}]/u.test(tok)).length;
}

export function splitParagraphs(passage: string): string[] {
  return passage
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Whitespace/quote-normalised containment check used to verify evidence quotations. */
export function normaliseForMatch(s: string): string {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function containsQuote(haystack: string, quote: string): boolean {
  return normaliseForMatch(haystack).includes(normaliseForMatch(quote));
}
