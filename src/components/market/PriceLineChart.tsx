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
};

export default function PriceLineChart({ data, title = "일별 종가" }: Props) {
  const chartData = data.map((d) => ({
    날짜: d.date.slice(5), // MM-DD
    종가: d.close,
  }));

  return (
    <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </div>

      <div className="h-64 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
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
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
