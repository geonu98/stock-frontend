// src/components/market/OrderPanel.tsx
import { useEffect, useMemo, useState } from "react";
import type { OrderDraft, OrderKind, OrderSide } from "../../types/order";

type Props = {
  symbol: string;

  // 차트/시세에서 내려오는 현재가(USD)
  currentPrice: number | null;

  // 지정가 선택(차트 클릭) 같은 값이 있으면 넘겨줌(USD)
  selectedPrice?: number | null;

  // 환율(USD->KRW). 로딩 전/실패 시 null 가능
  usdKrw?: number | null;

  // 주문 버튼 클릭 시 confirm 오버레이를 열기 위해 draft를 올림
  onSubmitDraft: (draft: OrderDraft) => void;
};

function clampMinInt(n: number, min: number) {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.floor(n));
}

function clampMinNum(n: number, min: number) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, n);
}

function fmtKrw(n: number) {
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
}

export default function OrderPanel({
  symbol,
  currentPrice,
  selectedPrice,
  usdKrw,
  onSubmitDraft,
}: Props) {
  // 환율 로딩 전/실패 대비 fallback (v1 임시)
  const usdKrwSafe = usdKrw ?? 1350;

  const [side, setSide] = useState<OrderSide>("BUY");
  const [kind, setKind] = useState<OrderKind>("MARKET");

  const [quantity, setQuantity] = useState<number>(0);

  // 지정가 입력값(USD)
  const [limitPrice, setLimitPrice] = useState<number>(0);

  // 차트 클릭(selectedPrice)하면:
  // - 지정가(LIMIT)로 자동 전환
  // - limitPrice를 selectedPrice로 자동 입력
  useEffect(() => {
    if (!selectedPrice || selectedPrice <= 0) return;

    setKind("LIMIT");
    setLimitPrice(selectedPrice);
  }, [selectedPrice]);

  // 예상 체결가(USD)
  const expectedFillPriceUsd = useMemo(() => {
    if (kind === "MARKET") return currentPrice ?? 0;
    return limitPrice || 0;
  }, [currentPrice, kind, limitPrice]);

  // 금액 계산(USD)
  const amountUsd = useMemo(() => {
    if (!expectedFillPriceUsd || !quantity) return 0;
    return expectedFillPriceUsd * quantity;
  }, [expectedFillPriceUsd, quantity]);

  // 금액 계산(KRW)
  const amountKrw = useMemo(() => {
    if (!amountUsd) return 0;
    return amountUsd * usdKrwSafe;
  }, [amountUsd, usdKrwSafe]);

  // v1 추정 수수료(“있어 보이기” 용)
  const feeRate = 0.00015; // 0.015%
  const feeKrw = useMemo(() => {
    if (!amountKrw) return 0;
    return amountKrw * feeRate;
  }, [amountKrw]);

  const totalKrw = useMemo(() => {
    if (!amountKrw) return 0;
    return amountKrw + feeKrw;
  }, [amountKrw, feeKrw]);

  const canSubmit = useMemo(() => {
    if (!symbol) return false;
    if (!quantity || quantity <= 0) return false;

    if (kind === "MARKET") {
      return !!currentPrice && currentPrice > 0;
    }

    // LIMIT
    return limitPrice > 0;
  }, [symbol, quantity, kind, currentPrice, limitPrice]);

  const onClickSubmit = () => {
    if (!canSubmit) return;

    const draft: OrderDraft = {
      symbol,
      side,
      kind,
      quantity: clampMinInt(quantity, 0),

      // 화면 표시용(USD)
      currentPrice: currentPrice ?? undefined,
      expectedFillPrice: expectedFillPriceUsd || undefined,

      // 화면 표시용(원화 기준 총액)
      estimatedAmount: totalKrw || undefined,
        // Confirm 동일 표시용(같은 계산 결과를 그대로 전달)
    usdKrw: usdKrwSafe,
    amountUsd: amountUsd || undefined,
    feeKrw: feeKrw || undefined,
    };

    if (kind === "LIMIT") {
      draft.price = clampMinNum(limitPrice, 0);
    }

    onSubmitDraft(draft);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div className="text-lg font-bold">주문하기</div>
        <div className="text-sm text-gray-500">{symbol}</div>
      </div>

      <div className="mt-4">
        <div className="text-sm text-gray-500">구분</div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className={`h-10 flex-1 rounded-2xl border font-semibold ${
              side === "BUY"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white border-gray-300"
            }`}
            onClick={() => setSide("BUY")}
          >
            매수
          </button>
          <button
            type="button"
            className={`h-10 flex-1 rounded-2xl border font-semibold ${
              side === "SELL"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white border-gray-300"
            }`}
            onClick={() => setSide("SELL")}
          >
            매도
          </button>
        </div>
      </div>

      <div className="mt-5">
        <div className="text-sm text-gray-500">주문 방식</div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className={`h-10 flex-1 rounded-2xl border font-semibold ${
              kind === "MARKET"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white border-gray-300"
            }`}
            onClick={() => setKind("MARKET")}
          >
            시장가
          </button>
          <button
            type="button"
            className={`h-10 flex-1 rounded-2xl border font-semibold ${
              kind === "LIMIT"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white border-gray-300"
            }`}
            onClick={() => setKind("LIMIT")}
          >
            지정가
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-gray-200 p-4">
        <div className="text-sm text-gray-500">현재가</div>
        <div className="mt-1 text-3xl font-bold">
          {currentPrice ? currentPrice.toFixed(2) : "-"}
        </div>
        <div className="mt-1 text-xs text-gray-500">
          USD 기준 (원화 표시는 환율 적용)
        </div>
      </div>

      {kind === "LIMIT" && (
        <div className="mt-4">
          <div className="text-sm text-gray-500">지정가</div>
          <input
            className="mt-2 h-12 w-full rounded-2xl border border-gray-300 px-4 outline-none"
            value={limitPrice || ""}
            onChange={(e) => setLimitPrice(Number(e.target.value))}
            placeholder="가격을 입력하세요"
            inputMode="decimal"
          />
          <div className="mt-2 text-xs text-gray-500">
            차트에서 포인트를 클릭하면 지정가가 자동 선택됩니다.
          </div>
        </div>
      )}

      <div className="mt-5">
        <div className="text-sm text-gray-500">수량</div>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            className="h-12 w-12 rounded-2xl border border-gray-300 text-lg font-bold"
            onClick={() => setQuantity((q) => Math.max(0, q - 1))}
          >
            -
          </button>

          <input
            className="h-12 flex-1 rounded-2xl border border-gray-300 px-4 text-center outline-none"
            value={quantity}
            onChange={(e) => setQuantity(clampMinInt(Number(e.target.value), 0))}
            inputMode="numeric"
          />

          <button
            type="button"
            className="h-12 w-12 rounded-2xl border border-gray-300 text-lg font-bold"
            onClick={() => setQuantity((q) => q + 1)}
          >
            +
          </button>
        </div>

        <div className="mt-3 rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">예상 주문 금액</div>
            <div className="text-lg font-bold">
              {totalKrw ? fmtKrw(totalKrw) : "0원"}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>달러 기준</span>
            <span>
              {amountUsd ? `≈ $${amountUsd.toFixed(2)}` : "≈ $0.00"} (환율{" "}
              {usdKrwSafe.toLocaleString("ko-KR")}원/USD)
            </span>
          </div>

          <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
            <span>추정 수수료</span>
            <span>{feeKrw ? fmtKrw(feeKrw) : "0원"}</span>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            v1에서는 실제 체결/수수료가 아닌 “추정치”로 표시합니다.
          </div>
        </div>
      </div>

      <button
        type="button"
        className="mt-5 h-12 w-full rounded-2xl bg-blue-400 text-white font-semibold disabled:opacity-60"
        onClick={onClickSubmit}
        disabled={!canSubmit}
      >
        가상 {side === "BUY" ? "매수" : "매도"} 주문하기
      </button>

      <div className="mt-2 text-center text-xs text-gray-500">
        주문 확인 오버레이에서 최종 확인하도록 할게요.
      </div>
    </div>
  );
}
