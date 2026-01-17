import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

type Side = "BUY" | "SELL";

/**
 * OrderPanel
 *
 * 역할
 * - 마켓 화면에서 "가상 매수/매도" 주문 UI를 제공한다.
 * - v1에서는 실제 주문 API 호출 없이 UI/UX만 만든다.
 *
 * 입력
 * - symbol: 현재 화면의 종목 심볼
 * - price: 현재가(quote.price)
 * - loading: 시세 로딩 중인지 여부(입력/버튼 disable 용도)
 *
 * 출력
 * - (현재는 없음) 추후 onSubmit으로 주문 이벤트를 상위로 올려도 된다.
 */
export default function OrderPanel({
  symbol,
  price,
  loading,
}: {
  symbol: string;
  price: number | null;
  loading: boolean;
}) {
  const navigate = useNavigate();

  const accessToken = useAuthStore((s) => s.accessToken);
  const isLoggedIn = !!accessToken;

  // 매수/매도 탭
  const [side, setSide] = useState<Side>("BUY");

  // 주문 방식 (v1: 시장가만 사용, 지정가는 UI만)
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");

  // 수량
  const [qty, setQty] = useState<number>(0);

  // v1 가상 현금(예수금) 더미
  // 포트폴리오 API 붙이면 이 값은 서버에서 내려받아야 함
  const cash = 1_000_000;

  // v1 보유 수량 더미 (매도 탭에서 최대 계산 용도)
  // 실제로는 holdings에서 symbol 보유 수량을 가져와야 함
  const ownedQty = 12;

  const safePrice = useMemo(() => {
    const p = Number(price);
    return Number.isFinite(p) && p > 0 ? p : 0;
  }, [price]);

  const estimatedAmount = useMemo(() => {
    // 주문금액 = 현재가 * 수량 (v1)
    // 지정가 주문을 붙이면 LIMIT 가격 입력값을 곱하는 구조로 변경
    return safePrice * qty;
  }, [safePrice, qty]);

  const maxQty = useMemo(() => {
    if (side === "BUY") {
      if (!safePrice) return 0;
      return Math.floor(cash / safePrice);
    }
    return ownedQty;
  }, [side, cash, safePrice, ownedQty]);

  const pctButtons = [10, 25, 50] as const;

  const setByPercent = (percent: number) => {
    const next = Math.floor((maxQty * percent) / 100);
    setQty(next);
  };

  const setToMax = () => {
    setQty(maxQty);
  };

  const decQty = () => {
    setQty((v) => Math.max(0, v - 1));
  };

  const incQty = () => {
    setQty((v) => Math.min(maxQty, v + 1));
  };

  const disabled = loading || !safePrice;

  const submit = () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (qty <= 0) {
      alert("수량을 입력해 주세요.");
      return;
    }

    // v1: 주문 동작은 아직 더미
    // 이후 포트폴리오 API가 붙으면 여기서 POST /api/portfolio/trades 같은 걸 호출하면 된다.
    alert(
      `${side === "BUY" ? "가상 매수" : "가상 매도"} (준비 중)\n` +
        `종목: ${symbol}\n` +
        `수량: ${qty}\n` +
        `예상 금액: ${Math.round(estimatedAmount).toLocaleString()}원`
    );
  };

  return (
    <aside className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          주문하기
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {symbol}
        </div>
      </div>

      {/* 매수/매도 탭 */}
      <div className="mt-4 grid grid-cols-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-1">
        <button
          type="button"
          onClick={() => setSide("BUY")}
          className={[
            "h-9 rounded-2xl text-sm font-semibold transition",
            side === "BUY"
              ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
              : "text-gray-500 dark:text-gray-400",
          ].join(" ")}
        >
          매수
        </button>
        <button
          type="button"
          onClick={() => setSide("SELL")}
          className={[
            "h-9 rounded-2xl text-sm font-semibold transition",
            side === "SELL"
              ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
              : "text-gray-500 dark:text-gray-400",
          ].join(" ")}
        >
          매도
        </button>
      </div>

      {/* 주문 방식 */}
      <div className="mt-4">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
          주문 방식
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setOrderType("MARKET")}
            className={[
              "h-10 rounded-2xl border text-sm font-semibold",
              orderType === "MARKET"
                ? "border-gray-900 dark:border-white text-gray-900 dark:text-gray-100"
                : "border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400",
            ].join(" ")}
          >
            시장가
          </button>

          <button
            type="button"
            // v1에서는 지정가를 UI만 두고 비활성 처리
            onClick={() => setOrderType("LIMIT")}
            className={[
              "h-10 rounded-2xl border text-sm font-semibold",
              orderType === "LIMIT"
                ? "border-gray-900 dark:border-white text-gray-900 dark:text-gray-100"
                : "border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400",
            ].join(" ")}
            title="v1에서는 시장가만 사용합니다."
          >
            지정가(준비 중)
          </button>
        </div>

        {orderType === "LIMIT" && (
          <div className="mt-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-3 text-xs text-gray-500 dark:text-gray-400">
            v1에서는 시장가만 지원합니다. 지정가는 다음 버전에서 추가할 예정입니다.
          </div>
        )}
      </div>

      {/* 현재가 */}
      <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-4">
        <div className="text-xs text-gray-500 dark:text-gray-400">현재가</div>
        <div className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">
          {safePrice ? safePrice.toLocaleString() : "—"}
        </div>
      </div>

      {/* 수량 입력 */}
      <div className="mt-4">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
          수량
        </div>

        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={decQty}
            disabled={disabled || qty <= 0}
            className="h-10 w-10 rounded-2xl border border-gray-200 dark:border-gray-800 disabled:opacity-50"
            aria-label="수량 감소"
          >
            −
          </button>

          <div className="flex-1 h-10 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 flex items-center">
            <input
              value={qty}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (!Number.isFinite(v)) return;
                const n = Math.max(0, Math.min(maxQty, Math.floor(v)));
                setQty(n);
              }}
              disabled={disabled}
              className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100"
              inputMode="numeric"
              placeholder="수량 입력"
            />
          </div>

          <button
            type="button"
            onClick={incQty}
            disabled={disabled || qty >= maxQty}
            className="h-10 w-10 rounded-2xl border border-gray-200 dark:border-gray-800 disabled:opacity-50"
            aria-label="수량 증가"
          >
            +
          </button>
        </div>

        {/* 퍼센트 버튼 */}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {pctButtons.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setByPercent(p)}
              disabled={disabled || maxQty <= 0}
              className="h-9 px-3 rounded-full border border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              {p}%
            </button>
          ))}

          <button
            type="button"
            onClick={setToMax}
            disabled={disabled || maxQty <= 0}
            className="h-9 px-3 rounded-full border border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            최대
          </button>
        </div>

        {/* 보조 정보 */}
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {side === "BUY"
            ? `가상 예수금 ${cash.toLocaleString()}원 · 최대 ${maxQty.toLocaleString()}주`
            : `보유 ${ownedQty.toLocaleString()}주 · 최대 ${maxQty.toLocaleString()}주`}
        </div>
      </div>

      {/* 금액 요약 */}
      <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-500 dark:text-gray-400">예상 주문 금액</div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">
            {safePrice ? Math.round(estimatedAmount).toLocaleString() : "—"}원
          </div>
        </div>
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          v1에서는 수수료/세금 계산을 생략합니다.
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={submit}
        disabled={disabled || (isLoggedIn && qty <= 0)}
        className={[
          "mt-4 w-full h-12 rounded-2xl text-sm font-semibold disabled:opacity-60",
          !isLoggedIn
            ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
            : side === "BUY"
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-rose-600 hover:bg-rose-700 text-white",
        ].join(" ")}
      >
        {!isLoggedIn
          ? "로그인하고 가상 주문하기"
          : side === "BUY"
          ? "가상 매수하기"
          : "가상 매도하기"}
      </button>
    </aside>
  );
}
