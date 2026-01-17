import type { DailyCandle } from "../../api/market";

type Props = {
  candles: DailyCandle[];
};

export default function CandleChart({ candles }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-4">
      <div className="font-semibold mb-3">Candles (v2 예정)</div>
      <div className="text-sm text-gray-500 dark:text-gray-300">
        데이터 {candles.length}개 로드됨
      </div>
    </div>
  );
}
