import { normaliseForMatch } from "@/domain/text";

/** Renders text with the evidence quotation highlighted (case/whitespace-insensitive match on the original text). */
export function Highlight({ text, quote }: { text: string; quote?: string | null }) {
  if (!quote) return <>{text}</>;
  const nText = normaliseForMatch(text);
  const nQuote = normaliseForMatch(quote);
  const idx = nText.indexOf(nQuote);
  if (idx < 0) return <>{text}</>;
  // Map normalised index back to the original string by walking both.
  const map: number[] = [];
  let prevSpace = false;
  let started = false;
  for (let i = 0; i < text.length; i++) {
    const isSpace = /\s/.test(text[i]!);
    if (!started && isSpace) continue;
    started = true;
    if (isSpace) {
      if (!prevSpace) map.push(i);
      prevSpace = true;
    } else {
      map.push(i);
      prevSpace = false;
    }
  }
  const start = map[idx] ?? 0;
  const endIdx = map[idx + nQuote.length - 1];
  const end = endIdx == null ? text.length : endIdx + 1;
  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded bg-warning-soft px-0.5 text-text ring-1 ring-warning">{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  );
}
