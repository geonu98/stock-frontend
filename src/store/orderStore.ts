// 결과 페이지 state 유실 방지용
import { create } from "zustand";
import type { OrderDraft } from "../types/order";

type OrderStore = {
  lastOrder: OrderDraft | null;
  setLastOrder: (order: OrderDraft) => void;
  clearLastOrder: () => void;
};

export const useOrderStore = create<OrderStore>((set) => ({
  lastOrder: null,
  setLastOrder: (order) => set({ lastOrder: order }),
  clearLastOrder: () => set({ lastOrder: null }),
}));
