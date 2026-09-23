const STOP = new Set([
  'i','a','the','to','do','na','w','we','z','ze','oraz','przez','dla','się','sie',
  'min','minut','minute','minutes','dzisiaj','today'
]);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter(t => !STOP.has(t));
}

export function questSimilarity(a: string, b: string): number {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (!A.size || !B.size) return 0;
  let intersection = 0;
  for (const t of A) if (B.has(t)) intersection++;
  const union = new Set([...A, ...B]).size;
  return union ? intersection / union : 0;
}

export function isTooSimilar(
  candidate: string,
  recent: string[],
  threshold = 0.72
): boolean {
  return recent.some(item => questSimilarity(candidate, item) >= threshold);
}
