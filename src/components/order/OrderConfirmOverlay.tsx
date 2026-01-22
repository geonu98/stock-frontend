// src/components/order/OrderConfirmOverlay.tsx
import { useEffect } from "react";
import type { OrderDraft } from "../../types/order";

type Props = {
  open: boolean;
  order: OrderDraft | null;

  onClose: () => void;
  onConfirm: () => void;

  // confirm 중복 클릭 방지
  confirmLoading?: boolean;
};

function formatNumber(n: number) {
  return new Intl.NumberFormat("ko-KR").format(n);
}

function formatMoneyKRW(n: number) {
  return `${formatNumber(Math.round(n))}원`;
}

export default function OrderConfirmOverlay({
  open,
  order,
  onClose,
  onConfirm,
  confirmLoading = false,
}: Props) {
  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !order) return null;

  const sideLabel = order.side === "BUY" ? "매수" : "매도";
  const kindLabel = order.kind === "MARKET" ? "시장가" : "지정가";

  /**
   * ⚠️ 중요 원칙
   * Confirm에서는 절대 재계산하지 않는다.
   * OrderPanel에서 계산된 값을 그대로 사용한다.
   */

  const expectedFillUsd =
    order.expectedFillPrice ?? order.currentPrice ?? order.price ?? 0;

  const amountUsd = order.amountUsd ?? 0;
  const usdKrw = order.usdKrw ?? 1350; // 혹시 누락 대비 fallback
  const feeKrw = order.feeKrw ?? 0;

  // ✅ 최종 금액은 OrderPanel에서 계산된 값 그대로
  const totalKrw = order.estimatedAmount ?? 0;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="주문 확인"
    >
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 컨텐츠 */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-[720px] rounded-2xl bg-white shadow-xl">
          <div className="p-6">
            <div className="text-center text-sm text-gray-500">주문 확인</div>

            <div className="mt-5 rounded-2xl border border-gray-200 p-6">
              <div className="text-2xl font-bold">
                {order.symbol} {sideLabel} {kindLabel} 주문
              </div>

              <div className="mt-6 grid grid-cols-2 gap-y-3 text-sm">
                <div className="text-gray-500">종목</div>
                <div className="text-right font-semibold">{order.symbol}</div>

                <div className="text-gray-500">구분</div>
                <div className="text-right font-semibold">{sideLabel}</div>

                <div className="text-gray-500">주문 방식</div>
                <div className="text-right font-semibold">{kindLabel}</div>

                <div className="text-gray-500">예상 체결가 (USD)</div>
                <div className="text-right font-semibold">
                  ${expectedFillUsd.toFixed(2)}
                </div>

                <div className="text-gray-500">수량</div>
                <div className="text-right font-semibold">
                  {order.quantity}주
                </div>
              </div>

              <div className="my-6 h-px bg-gray-200" />

              {/* 최종 금액 */}
              <div className="flex items-end justify-between">
                <div className="text-sm text-gray-500">예상 주문 금액</div>
                <div className="text-2xl font-bold">
                  {formatMoneyKRW(totalKrw)}
                </div>
              </div>

              {/* 보조 정보: 달러 / 환율 / 수수료 */}
              <div className="mt-3 space-y-1 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>달러 기준</span>
                  <span>
                    ≈ ${amountUsd.toFixed(2)} (환율{" "}
                    {formatNumber(usdKrw)}원/USD)
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>추정 수수료</span>
                  <span>{formatMoneyKRW(feeKrw)}</span>
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                v1에서는 실제 체결이 아닌 UI 플로우 검증용 가상 주문입니다.
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                className="h-12 flex-1 rounded-2xl border border-gray-300 bg-white font-semibold"
                onClick={onClose}
                disabled={confirmLoading}
              >
                수정하기
              </button>

              <button
                type="button"
                className="h-12 flex-1 rounded-2xl bg-gray-900 text-white font-semibold disabled:opacity-60"
                onClick={onConfirm}
                disabled={confirmLoading}
              >
                주문 확정
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
