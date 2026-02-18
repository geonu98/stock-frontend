// src/pages/Portfolio.tsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

function fmt(n: number | null | undefined, fractionDigits = 0) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "-";
  return n.toLocaleString("ko-KR", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  });
}

export default function Portfolio() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // ✅ v1: 아직 실제 포트폴리오 계산/거래내역 API 연결 전이므로 placeholder
  // 나중에 /api/trades, /api/portfolio 같은 엔드포인트 붙이면 여기 데이터를 채우면 됨.
  const summary = useMemo(() => {
    return {
      totalValueKrw: null as number | null,
      investedKrw: null as number | null,
      pnlKrw: null as number | null,
      pnlPct: null as number | null,
    };
  }, []);

  const displayName = useMemo(() => {
    const u: any = user;
    return u?.nickname ?? u?.name ?? u?.email ?? "내 포트폴리오";
  }, [user]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">포트폴리오</h1>
          <p className="text-sm text-gray-500">
            {displayName}님의 거래내역과 수익률을 확인할 수 있어요.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="rounded-md border px-3 py-2 text-sm font-semibold hover:bg-gray-50"
          >
            뒤로
          </button>
          <button
            onClick={() => navigate("/market")}
            className="rounded-md border px-3 py-2 text-sm font-semibold hover:bg-gray-50"
          >
            마켓
          </button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SummaryCard title="총 자산(원)" value={fmt(summary.totalValueKrw)} />
        <SummaryCard title="투입금(원)" value={fmt(summary.investedKrw)} />
        <SummaryCard title="손익(원)" value={fmt(summary.pnlKrw)} />
        <SummaryCard
          title="수익률"
          value={
            summary.pnlPct == null
              ? "-"
              : `${summary.pnlPct > 0 ? "+" : ""}${fmt(summary.pnlPct, 2)}%`
          }
        />
      </div>

      {/* 보유 종목(placeholder) */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-gray-900">보유 종목</div>
            <div className="mt-1 text-sm text-gray-500">
              종목별 수량/평균단가/평가손익을 표시할 예정이에요.
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/market")}
            className="h-10 rounded-2xl border border-gray-200 px-4 text-sm font-semibold hover:bg-gray-50"
          >
            종목 보러가기
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-500">
          아직 데이터가 없어요. 마켓에서 가상 매수/매도를 해보면 여기에 반영되도록
          만들 거예요.
        </div>
      </div>

      {/* 거래 내역(placeholder) */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="text-base font-bold text-gray-900">거래 내역</div>
        <div className="mt-1 text-sm text-gray-500">
          최신 거래부터 리스트로 표시하고, 필터/정렬도 추가할 예정이에요.
        </div>

        <div className="mt-4 rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-500">
          아직 거래 내역 API 연결 전입니다. 다음 단계에서{" "}
          <span className="font-semibold">/api/trades</span> 기반으로 붙일 수 있어요.
        </div>
      </div>

      {/* 다음 작업 안내 */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="text-base font-bold text-gray-900">다음 작업</div>
        <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>거래 내역 조회 API 연결</li>
          <li>보유 종목/평균단가 계산</li>
          <li>수익률(실현/미실현) 계산</li>
          <li>기간별(7일/30일/전체) 성과 보기</li>
        </ul>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate("/market")}
            className="h-12 flex-1 rounded-2xl bg-gray-900 text-white font-semibold hover:bg-black"
          >
            지금 거래하러 가기
          </button>
          <button
            type="button"
            onClick={() => navigate("/mypage")}
            className="h-12 flex-1 rounded-2xl border border-gray-200 bg-white font-semibold hover:bg-gray-50"
          >
            마이페이지
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="mt-1 text-lg font-bold text-gray-900">{value}</div>
    </div>
  );
}
