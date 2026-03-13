"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function NavigationLoadingIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setIsLoading(false);
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const rawHref = anchor.getAttribute("href");
      if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) {
        return;
      }

      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const nextUrl = new URL(anchor.href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;

      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const next = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
      if (current === next) return;

      setIsLoading(true);

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setIsLoading(false);
        timeoutRef.current = null;
      }, 10000);
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed right-4 top-4 z-[80] rounded-full border border-[#3f3f46] bg-[#111827] p-2 shadow-lg" aria-live="polite" aria-label="Page is loading">
      <Loader2 size={16} className="animate-spin text-[#818cf8]" />
    </div>
  );
}
