"use client";

import { ToastState } from "./useToast";

type ToastMessageProps = {
  toast: ToastState;
};

export function ToastMessage({ toast }: ToastMessageProps) {
  if (!toast) return null;

  const toneClass =
    toast.type === "success"
      ? "border-[#22c55e]/40 text-[#dcfce7]"
      : toast.type === "error"
        ? "border-[#ef4444]/40 text-[#fee2e2]"
        : "border-[#3f3f46] text-[#fafafa]";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed right-4 top-4 z-50 rounded-lg border bg-[#111827] px-3 py-2 text-xs shadow-lg ${toneClass}`}
    >
      {toast.message}
    </div>
  );
}
