"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ToastType = "success" | "error" | "info";

export type ToastState = {
  message: string;
  type: ToastType;
} | null;

export function useToast(timeoutMs = 2800) {
  const [toast, setToast] = useState<ToastState>(null);
  const timerRef = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      setToast({ message, type });
      timerRef.current = window.setTimeout(() => {
        setToast(null);
        timerRef.current = null;
      }, timeoutMs);
    },
    [timeoutMs],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { toast, showToast, clearToast: clear };
}
