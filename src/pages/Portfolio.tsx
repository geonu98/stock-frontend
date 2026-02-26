import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { getPortfolio, type PortfolioResponse } from "../api/portfolio";
import { n, usd, krw, pct, signedUsd, signColor, signedPct } from "../utils/format";

const DONUT_COLORS = [
  "#111827", "#334155", "#475569", "#64748b", "#0f172a",
  "#1f2937", "#374151", "#4b5563", "#6b7280",
];

export default function Portfolio() {
  const nav = useNavigate();

  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getPortfolio();
        setData(res);
      } catch {
        setErr("포트폴리오 조회 실패");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const derived = useMemo(() => {
    if (!data) return null;

    const totalMv = n(data.summary.totalMarketValueUsd);

    const positions = data.positions
      .map((p) => {
        const mv = n(p.marketValueUsd);
        const weight = totalMv > 0 ? (mv / totalMv) * 100 : 0;

        return {
          ...p,
          _mv: mv,
          _weight: weight,
          _unPnl: n(p.unrealizedPnlUsd),
          _ret: n(p.unrealizedReturnPct),
        };
      })
      .sort((a, b) => b._mv - a._mv);

    const donut = positions
      .filter((p) => p._mv > 0)
      .map((p) => ({
        name: p.symbol,
        value: p._mv,
        weight: p._weight,
      }));

    return { totalMv, positions, donut };
  }, [data]);

  if (loading) return <div style={{ padding: 24 }}>로딩중...</div>;
  if (err) return <div style={{ padding: 24 }}>{err}</div>;
  if (!data || !derived) return null;

  const { summary, warnings } = data;
  const totalPnlUsd = n(summary.totalPnlUsd);

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>포트폴리오</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
            자산 요약 · 비중 · 손익
          </div>
        </div>
      </div>

      {/* Summary */}
      <Card>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 260px" }}>
            <Label>총 평가금액</Label>
            <Big>${usd(summary.totalMarketValueUsd)}</Big>
          </div>

          <div style={{ flex: "1 1 260px" }}>
            <Label>총 손익</Label>
            <Big style={{ color: signColor(totalPnlUsd) }}>
              {signedUsd(totalPnlUsd)}
            </Big>

            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Chip label={`수익률 ${pct(summary.totalReturnPct)}%`} />
              <Chip label={`실현 $${usd(summary.totalRealizedPnlUsd)}`} />
              <Chip label={`미실현 $${usd(summary.totalUnrealizedPnlUsd)}`} />
            </div>
          </div>

          {!!summary.usdKrwRate && (
            <div style={{ flex: "1 1 260px" }}>
              <Label>원화 환산</Label>
              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                <RowKV k="환율" v={`${usd(summary.usdKrwRate, 1)}`} />
                <RowKV k="평가금액" v={`${krw(summary.totalMarketValueKrw)}원`} />
                <RowKV
                  k="손익"
                  v={`${krw(summary.totalPnlKrw)}원`}
                  vColor={signColor(n(summary.totalPnlKrw))}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Allocation + Donut */}
      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 14, marginTop: 14 }}>
        <Card>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>보유 비중</div>

          {derived.donut.length === 0 ? (
            <div style={{ color: "#6b7280", fontSize: 13 }}>보유 종목이 없어요.</div>
          ) : (
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={derived.donut}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={2}
                  >
                    {derived.donut.map((_, idx) => (
                      <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div style={{ textAlign: "center", marginTop: -18 }}>
                <div style={{ fontSize: 12, color: "#6b7280" }}>총 평가금액</div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>${usd(summary.totalMarketValueUsd)}</div>
              </div>

              {/* Legend */}
              <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
                {derived.donut.slice(0, 5).map((d, idx) => (
                  <div
                    key={d.name}
                    style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 3,
                          background: DONUT_COLORS[idx % DONUT_COLORS.length],
                          display: "inline-block",
                        }}
                      />
                      <span style={{ fontWeight: 800 }}>{d.name}</span>
                    </div>
                    <span style={{ color: "#374151" }}>{pct(d.weight)}%</span>
                  </div>
                ))}
                {derived.donut.length > 5 && (
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    +{derived.donut.length - 5}개 더 있음
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Positions list */}
        <div>
          <SectionTitle title="보유 종목" />
          {derived.positions.length === 0 ? (
            <Card>
              <div style={{ color: "#6b7280", fontSize: 13 }}>보유 종목이 없어요.</div>
            </Card>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {derived.positions.map((p, idx) => {
                const pnlColor = signColor(p._unPnl);

                return (
                  <div
                    key={p.symbol}
                    onClick={() => {
                      nav(`/portfolio/${p.symbol}`, {
                        state: {
                          symbol: p.symbol,
                          position: p,
                          summary,
                        },
                      });
                    }}
                    style={{
                      cursor: "pointer",
                      borderRadius: 16,
                      border: "1px solid #e5e7eb",
                      padding: 14,
                      background: "#fff",
                      transition: "transform 120ms ease",
                    }}
                    onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.995)")}
                    onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ fontSize: 16, fontWeight: 900 }}>{p.symbol}</div>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>{p.quantity}주</div>
                          <div
                            style={{
                              fontSize: 12,
                              padding: "4px 8px",
                              borderRadius: 999,
                              background: "#f3f4f6",
                              color: "#374151",
                            }}
                          >
                            비중 {pct(p._weight)}%
                          </div>
                        </div>

                        <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
                          <MiniStat label="평가금액" value={`$${usd(p.marketValueUsd)}`} />
                          <MiniStat label="평균단가" value={`$${usd(p.avgBuyPriceUsd)}`} />
                          <MiniStat label="현재가" value={`$${usd(p.currentPriceUsd)}`} />
                        </div>
                      </div>

                      <div style={{ textAlign: "right", minWidth: 150 }}>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>미실현 손익</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: pnlColor, marginTop: 4 }}>
                          {signedUsd(p._unPnl)}
                        </div>
                        <div style={{ fontSize: 12, marginTop: 6, color: pnlColor }}>
                          {signedPct(p._ret)}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <WeightBar pct={p._weight} color={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div
          style={{
            marginTop: 16,
            borderRadius: 16,
            border: "1px solid #fde68a",
            background: "#fffbeb",
            padding: 12,
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 6 }}>⚠ 경고</div>
          <div style={{ display: "grid", gap: 6 }}>
            {warnings.map((w, i) => (
              <div key={i} style={{ fontSize: 13, color: "#92400e" }}>
                {w.symbol ? `[${w.symbol}] ` : ""}
                {w.code}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* --- UI helpers --- */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid #e5e7eb",
        padding: 18,
        background: "#fff",
        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, color: "#6b7280" }}>{children}</div>;
}

function Big({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ fontSize: 26, fontWeight: 900, marginTop: 6, ...style }}>{children}</div>;
}

function Chip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        background: "#f3f4f6",
        color: "#374151",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  );
}

function RowKV({ k, v, vColor }: { k: string; v: string; vColor?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
      <div style={{ color: "#6b7280" }}>{k}</div>
      <div style={{ fontWeight: 800, color: vColor ?? "#111827" }}>{v}</div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <div style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 900 }}>{title}</div>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 120 }}>
      <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 800, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function WeightBar({ pct, color }: { pct: number; color: string }) {
  const safe = Math.max(0, Math.min(100, pct || 0));
  return (
    <div style={{ width: "100%", height: 10, borderRadius: 999, background: "#f3f4f6", overflow: "hidden" }}>
      <div style={{ width: `${safe}%`, height: "100%", borderRadius: 999, background: color }} />
    </div>
  );
}