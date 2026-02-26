export function n(v: any) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

// 토스 느낌: 금액은 보통 소수 2자리(USD), KRW는 0자리
export function usd(v: any, digits = 2) {
  const x = n(v);
  return x.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function krw(v: any) {
  const x = n(v);
  return x.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function pct(v: any, digits = 2) {
  const x = n(v);
  return x.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function signedUsd(v: any, digits = 2) {
  const x = n(v);
  const abs = Math.abs(x);
  const sign = x >= 0 ? "+" : "-";
  return `${sign}$${usd(abs, digits)}`;
}

export function signedPct(v: any, digits = 2) {
  const x = n(v);
  const sign = x >= 0 ? "+" : "";
  return `${sign}${pct(x, digits)}%`;
}

export function signColor(x: number) {
  return x >= 0 ? "#16a34a" : "#ef4444";
}