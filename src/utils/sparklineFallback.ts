export function safeSparkline(
  points?: Array<number | null | undefined> | null,
  length = 30
): number[] {
  const cleaned = (points ?? []).filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v)
  );

  if (cleaned.length >= 2) return cleaned;

  return makeFakeSparkline(length);
}

function makeFakeSparkline(length: number, base = 100) {
  let cur = base + Math.random() * 10;

  return Array.from({ length }, () => {
    const diff = (Math.random() - 0.5) * 2;
    cur = Math.max(1, cur + diff);
    return Number(cur.toFixed(2));
  });
}
