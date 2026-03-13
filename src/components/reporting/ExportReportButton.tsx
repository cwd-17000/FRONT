"use client";

import { useState, useRef, useEffect } from "react";

interface ExportReportButtonProps {
  orgId: string;
  from: string;
  to: string;
  teamId?: string | null;
}

type ExportState = "idle" | "loading" | "error";

export default function ExportReportButton({ orgId, from, to, teamId }: ExportReportButtonProps) {
  const [state, setState] = useState<ExportState>("idle");
  const [open, setOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleExport(format: "pdf") {
    setOpen(false);
    setState("loading");
    setErrorMsg(null);

    try {
      const params = new URLSearchParams({ format, from, to });
      if (teamId) params.set("teamId", teamId);

      const res = await fetch(
        `/api/organizations/${orgId}/reporting/export?${params.toString()}`,
        { credentials: "include" },
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "Unknown error");
        throw new Error(`Export failed (${res.status}): ${text}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const date = new Date().toISOString().split("T")[0];
      anchor.href = url;
      anchor.download = `report-${orgId.slice(0, 8)}-${format}-${date}.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      setState("idle");
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Export failed");
      setTimeout(() => setState("idle"), 4000);
    }
  }

  const isLoading = state === "loading";
  const isError = state === "error";

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => !isLoading && setOpen((o) => !o)}
        disabled={isLoading}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 12px",
          fontSize: 12,
          fontWeight: 500,
          borderRadius: 6,
          border: "1px solid",
          borderColor: isError ? "#7f1d1d" : "#27272a",
          background: isError ? "#450a0a" : isLoading ? "#18181b" : "transparent",
          color: isError ? "#ef4444" : isLoading ? "#52525b" : "#a1a1aa",
          cursor: isLoading ? "not-allowed" : "pointer",
          transition: "all 0.15s",
        }}
      >
        {isLoading ? (
          <>
            <SpinnerIcon />
            Exporting…
          </>
        ) : isError ? (
          <>
            <ErrorIcon />
            {errorMsg ? errorMsg.slice(0, 30) : "Export failed"}
          </>
        ) : (
          <>
            <DownloadIcon />
            Export
            <ChevronIcon open={open} />
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 50,
            background: "#18181b",
            border: "1px solid #27272a",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            minWidth: 160,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "8px 12px 6px",
              fontSize: 10,
              color: "#52525b",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 600,
            }}
          >
            Format
          </div>
          <DropdownItem
            icon={<PdfIcon />}
            label="PDF Report"
            description="A4, multi-page with charts"
            onClick={() => handleExport("pdf")}
          />
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DropdownItem({
  icon,
  label,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "10px 12px",
        background: hover ? "#27272a" : "transparent",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.1s",
      }}
    >
      <span style={{ marginTop: 1, color: "#6366f1" }}>{icon}</span>
      <span>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#e4e4e7" }}>{label}</div>
        <div style={{ fontSize: 10, color: "#71717a", marginTop: 1 }}>{description}</div>
      </span>
    </button>
  );
}

// ── Icons (inline SVG) ────────────────────────────────────────────────────────

function DownloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
