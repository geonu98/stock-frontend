// src/components/market/PriceLineChart.tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DailyCandle } from "../../api/market";

type Props = {
  data: DailyCandle[];
  title?: string;
  onPriceSelect?: (price: number) => void;
};

export default function PriceLineChart({
  data,
  title = "일별 종가",
  onPriceSelect,
}: Props) {
  const chartData = data.map((d) => ({
    날짜: d.date.slice(5), // MM-DD
    종가: d.close,
  }));

  const handleClick = (state: any) => {
    console.log("[Chart] click state =", state);

    // 1) index로 뽑기 (가장 빠름)
    let idx: number | null =
      typeof state?.activeTooltipIndex === "number"
        ? state.activeTooltipIndex
        : typeof state?.activeIndex === "number"
        ? state.activeIndex
        : null;

    // 2) index가 없으면 label(날짜)로 찾아서 idx 결정
    if (idx == null) {
      const label = String(state?.activeLabel ?? "");
      if (label) {
        const found = chartData.findIndex((row) => row["날짜"] === label);
        idx = found >= 0 ? found : null;
      }
    }

    console.log("[Chart] resolved idx =", idx);

    if (idx == null) return;

    const row = chartData[idx];
    const close = row?.["종가"];
    const n = Number(close);

    console.log("[Chart] picked =", { idx, row, close, n });

    if (!Number.isFinite(n) || n <= 0) return;

    onPriceSelect?.(Math.round(n));
    console.log("[Chart] onPriceSelect called =", Math.round(n));
  };

  return (
    <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
      {title ? (
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </div>
      ) : null}

      <div className="h-64 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} onClick={handleClick}>
            <XAxis
              dataKey="날짜"
              tick={{ fontSize: 12, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{ fontSize: 12, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              width={44}
              domain={["auto", "auto"]}
              tickFormatter={(v) =>
                typeof v === "number" ? v.toLocaleString() : String(v)
              }
            />

            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #E5E7EB",
                fontSize: 12,
              }}
              labelStyle={{ fontWeight: 600 }}
              formatter={(value: unknown) => {
                const n =
                  typeof value === "number"
                    ? value
                    : typeof value === "string"
                    ? Number(value)
                    : NaN;

                const text = Number.isFinite(n) ? n.toLocaleString() : "-";
                return [text, "종가"] as [string, string];
              }}
              labelFormatter={(label) => `날짜 ${label}`}
            />

            <Line
              type="monotone"
              dataKey="종가"
              stroke="#2563EB"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 7 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
