"use client";
import { create } from "zustand";
import type { Lang } from "@/lib/i18n";

interface UIState {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  toast: { type: "success" | "error"; message: string } | null;
  notify: (type: "success" | "error", message: string) => void;
  clearToast: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  lang: "ar",
  setLang: (l) => set({ lang: l }),
  toggleLang: () => set({ lang: get().lang === "ar" ? "en" : "ar" }),
  toast: null,
  notify: (type, message) => {
    set({ toast: { type, message } });
    setTimeout(() => set({ toast: null }), 3000);
  },
  clearToast: () => set({ toast: null }),
}));
