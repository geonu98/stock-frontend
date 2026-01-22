// src/pages/OrderResult.tsx
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useOrderStore } from "../store/orderStore";

function formatNumber(n: number) {
  return new Intl.NumberFormat("ko-KR").format(n);
}

export default function OrderResult() {
  const lastOrder = useOrderStore((s) => s.lastOrder);

  const text = useMemo(() => {
    if (!lastOrder) return null;

    const sideLabel = lastOrder.side === "BUY" ? "매수" : "매도";
    const kindLabel = lastOrder.kind === "MARKET" ? "시장가" : "지정가";

    const price =
      lastOrder.expectedFillPrice ??
      lastOrder.currentPrice ??
      lastOrder.price ??
      0;

    const amount =
      lastOrder.estimatedAmount ??
      (price && lastOrder.quantity ? price * lastOrder.quantity : 0);

    return {
      title: `${lastOrder.symbol} ${sideLabel} 주문이 접수되었습니다`,
      lines: [
        `주문 방식: ${kindLabel}`,
        `수량: ${lastOrder.quantity}주`,
        `예상 체결가: ${formatNumber(Math.round(price))}원`,
        `예상 주문 금액: ${formatNumber(Math.round(amount))}원`,
      ],
      note: "v1에서는 실제 주문이 아니라 UI 플로우 검증용 가상 주문입니다.",
    };
  }, [lastOrder]);

  if (!text) {
    return (
      <div className="mx-auto max-w-[720px] p-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="text-lg font-bold">주문 결과</div>
          <div className="mt-3 text-sm text-gray-500">
            표시할 주문 정보가 없습니다. 마켓에서 주문을 진행해주세요.
          </div>
          <div className="mt-5">
            <Link
              to="/market"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-gray-900 px-5 text-white font-semibold"
            >
              마켓으로 이동
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[720px] p-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="text-lg font-bold">주문 결과</div>

        <div className="mt-4 rounded-2xl border border-gray-200 p-6">
          <div className="text-2xl font-bold">{text.title}</div>

          <ul className="mt-4 space-y-2 text-sm">
            {text.lines.map((line) => (
              <li key={line} className="text-gray-800">
                {line}
              </li>
            ))}
          </ul>

          <div className="mt-4 text-xs text-gray-500">{text.note}</div>
        </div>

        <div className="mt-5 flex gap-3">
          <Link
            to="/market"
            className="flex-1 h-12 rounded-2xl border border-gray-300 bg-white font-semibold inline-flex items-center justify-center"
          >
            마켓으로
          </Link>
          <Link
            to="/portfolio"
            className="flex-1 h-12 rounded-2xl bg-gray-900 text-white font-semibold inline-flex items-center justify-center"
          >
            포트폴리오로
          </Link>
        </div>
      </div>
    </div>
  );
}
