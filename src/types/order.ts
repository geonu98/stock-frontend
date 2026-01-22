

export type OrderSide = "BUY" | "SELL";
export type OrderKind = "MARKET" | "LIMIT";

export interface OrderDraft {
  symbol: string;
  side: OrderSide;
  kind: OrderKind;

  // 시장가일 때는 price가 없어도 됨
  // 지정가일 때는 price가 필수
  price?: number;

  quantity: number;

  // 화면 표시에 쓰는 값 (현재가, 예상 체결가 등)
  currentPrice?: number;
  expectedFillPrice?: number;

  // 금액 표시용(수수료/세금 v1에서는 생략)
  estimatedAmount?: number;

    usdKrw?: number;        // 적용된 환율(usdKrwSafe)
  amountUsd?: number;     // 체결가*수량
  feeKrw?: number;        // 추정 수수료
}
