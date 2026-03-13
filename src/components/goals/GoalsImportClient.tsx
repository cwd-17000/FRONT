"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RowError {
  row: number;
  title?: string;
  field: string;
  message: string;
}

interface PreviewRow {
  _row: number;
  _valid: boolean;
  _errors: string[];
  [key: string]: unknown;
}

interface ImportResult {
  dryRun: boolean;
  successCount: number;
  errors: RowError[];
  newIds: string[];
  preview?: PreviewRow[];
  errorCsv?: string;
}

type Stage = "idle" | "previewing" | "preview_ready" | "importing" | "done" | "error";

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = {
  "text/csv": [".csv"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
};

const PREVIEW_COLUMNS = [
  "title", "type", "category", "status", "timeframe",
  "startDate", "dueDate", "targetValue", "currentValue",
  "unit", "confidenceScore", "teamName", "ownerEmail",
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function GoalsImportClient({ orgId }: { orgId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [previewErrors, setPreviewErrors] = useState<RowError[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // ── Dropzone ───────────────────────────────────────────────────────────────

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      setStage("idle");
      setPreview([]);
      setPreviewErrors([]);
      setResult(null);
      setApiError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  // ── API helpers ────────────────────────────────────────────────────────────

  async function callImport(dryRun: boolean): Promise<ImportResult> {
    if (!file) throw new Error("No file selected");
    const fd = new FormData();
    fd.append("file", file);
    const qs = dryRun ? "?dryRun=true" : "";
    const res = await fetch(
      `/api/organizations/${orgId}/goals/import${qs}`,
      { method: "POST", body: fd, credentials: "include" },
    );
    if (!res.ok) {
      const body = await res.text();
      let msg = `Server error (${res.status})`;
      try { msg = JSON.parse(body)?.message ?? msg; } catch { /* noop */ }
      throw new Error(msg);
    }
    return res.json();
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handlePreview() {
    if (!file) return;
    setStage("previewing");
    setApiError(null);
    try {
      const data = await callImport(true);
      setPreview(data.preview ?? []);
      setValidCount(data.successCount);
      setPreviewErrors(data.errors);
      setStage("preview_ready");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Preview failed");
      setStage("error");
    }
  }

  async function handleImport() {
    setStage("importing");
    setApiError(null);
    try {
      const data = await callImport(false);
      setResult(data);
      setStage("done");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Import failed");
      setStage("error");
    }
  }

  function handleDownloadErrors(csv: string) {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-errors-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function reset() {
    setFile(null);
    setStage("idle");
    setPreview([]);
    setPreviewErrors([]);
    setResult(null);
    setApiError(null);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", color: "#fafafa", padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <Link
          href="/dashboard/goals"
          style={{ color: "#52525b", fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
        >
          ← Goals
        </Link>
        <div style={{ width: 1, height: 16, background: "#27272a" }} />
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Bulk Import Goals</h1>
      </div>

      {/* Instructions */}
      <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "16px 20px", marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: "#a1a1aa", margin: "0 0 8px" }}>
          Upload a <strong style={{ color: "#e4e4e7" }}>.csv</strong>,{" "}
          <strong style={{ color: "#e4e4e7" }}>.xlsx</strong>, or{" "}
          <strong style={{ color: "#e4e4e7" }}>.xls</strong> file (max 10 MB, up to 1 000 rows).
          The first row must be a header. Column names are flexible — see supported names below.
        </p>
        <details style={{ marginTop: 8 }}>
          <summary style={{ fontSize: 12, color: "#6366f1", cursor: "pointer", userSelect: "none" }}>
            Supported column names
          </summary>
          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 6 }}>
            {COLUMN_GUIDE.map(({ field, aliases }) => (
              <div key={field} style={{ fontSize: 11, color: "#71717a" }}>
                <span style={{ color: "#a1a1aa", fontWeight: 600 }}>{field}</span>:{" "}
                {aliases.join(", ")}
              </div>
            ))}
          </div>
        </details>
      </div>

      {/* Dropzone */}
      {stage !== "done" && (
        <div
          {...getRootProps()}
          style={{
            border: `2px dashed ${isDragActive ? "#6366f1" : file ? "#22c55e" : "#3f3f46"}`,
            borderRadius: 10,
            padding: "36px 24px",
            textAlign: "center",
            cursor: "pointer",
            background: isDragActive ? "#1e1b4b20" : "transparent",
            transition: "all 0.15s",
            marginBottom: 20,
          }}
        >
          <input {...getInputProps()} />
          <div style={{ fontSize: 28, marginBottom: 8 }}>
            {file ? "📄" : "📂"}
          </div>
          {file ? (
            <>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#22c55e", margin: "0 0 4px" }}>
                {file.name}
              </p>
              <p style={{ fontSize: 12, color: "#52525b", margin: 0 }}>
                {(file.size / 1024).toFixed(1)} KB — click or drop to replace
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 14, color: "#71717a", margin: "0 0 4px" }}>
                {isDragActive ? "Drop the file here" : "Drag & drop a CSV or Excel file, or click to browse"}
              </p>
              <p style={{ fontSize: 12, color: "#3f3f46", margin: 0 }}>
                .csv · .xlsx · .xls — max 10 MB
              </p>
            </>
          )}
        </div>
      )}

      {/* Action buttons */}
      {file && stage === "idle" && (
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <ActionButton onClick={handlePreview} variant="secondary">
            Preview & Validate
          </ActionButton>
          <button onClick={reset} style={ghostBtnStyle}>
            Clear
          </button>
        </div>
      )}

      {/* Spinning / loading states */}
      {(stage === "previewing" || stage === "importing") && (
        <StatusBanner
          color="#6366f1"
          message={stage === "previewing" ? "Parsing and validating file…" : "Importing goals…"}
          spinner
        />
      )}

      {/* Error */}
      {stage === "error" && apiError && (
        <StatusBanner color="#ef4444" message={apiError} />
      )}

      {/* Preview ready */}
      {stage === "preview_ready" && (
        <>
          <SummaryBar valid={validCount} invalid={previewErrors.length} total={preview.length} />

          {previewErrors.length > 0 && (
            <ValidationErrorTable errors={previewErrors} style={{ marginBottom: 16 }} />
          )}

          <PreviewTable rows={preview} />

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            {validCount > 0 && (
              <ActionButton onClick={handleImport} variant="primary">
                Import {validCount} valid row{validCount !== 1 ? "s" : ""}
              </ActionButton>
            )}
            <button onClick={reset} style={ghostBtnStyle}>
              Start over
            </button>
          </div>
        </>
      )}

      {/* Done */}
      {stage === "done" && result && (
        <div>
          <div
            style={{
              background: result.successCount > 0 ? "#14532d" : "#450a0a",
              border: `1px solid ${result.successCount > 0 ? "#166534" : "#7f1d1d"}`,
              borderRadius: 10,
              padding: "18px 22px",
              marginBottom: 20,
            }}
          >
            <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 6px", color: result.successCount > 0 ? "#22c55e" : "#ef4444" }}>
              {result.successCount > 0
                ? `✓ ${result.successCount} goal${result.successCount !== 1 ? "s" : ""} imported successfully`
                : "No goals were imported"}
            </p>
            <p style={{ fontSize: 12, color: "#71717a", margin: 0 }}>
              {result.newIds.length} created · {result.successCount - result.newIds.length} updated
              {result.errors.length > 0 && ` · ${result.errors.length} error${result.errors.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {result.errors.length > 0 && (
            <>
              <ValidationErrorTable errors={result.errors} style={{ marginBottom: 16 }} />
              {result.errorCsv && (
                <button
                  onClick={() => handleDownloadErrors(result.errorCsv!)}
                  style={{ ...ghostBtnStyle, marginBottom: 20 }}
                >
                  Download error log (.csv)
                </button>
              )}
            </>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <Link
              href="/dashboard/goals"
              style={{
                padding: "8px 18px",
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 7,
                background: "#6366f1",
                color: "#fff",
                textDecoration: "none",
              }}
            >
              View goals
            </Link>
            <button onClick={reset} style={ghostBtnStyle}>
              Import another file
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryBar({ valid, invalid, total }: { valid: number; invalid: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
      <Chip label="Total rows" value={total} />
      <Chip label="Valid" value={valid} color="#22c55e" />
      {invalid > 0 && <Chip label="Errors" value={invalid} color="#ef4444" />}
    </div>
  );
}

function Chip({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 7, padding: "8px 14px", display: "flex", gap: 8, alignItems: "center" }}>
      <span style={{ fontSize: 11, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 700, color: color ?? "#fafafa" }}>{value}</span>
    </div>
  );
}

function ValidationErrorTable({ errors, style }: { errors: RowError[]; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#18181b", border: "1px solid #3f1515", borderRadius: 10, overflow: "hidden", ...style }}>
      <div style={{ padding: "10px 16px", borderBottom: "1px solid #27272a", fontSize: 12, fontWeight: 600, color: "#ef4444" }}>
        {errors.length} validation error{errors.length !== 1 ? "s" : ""}
      </div>
      <div style={{ maxHeight: 220, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #27272a" }}>
              <Th2>Row</Th2>
              <Th2>Title</Th2>
              <Th2>Field</Th2>
              <Th2>Error</Th2>
            </tr>
          </thead>
          <tbody>
            {errors.map((e, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #1c1c1e" }}>
                <td style={tdStyle}>{e.row}</td>
                <td style={{ ...tdStyle, color: "#a1a1aa", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title ?? "—"}</td>
                <td style={{ ...tdStyle, color: "#f59e0b", fontFamily: "monospace" }}>{e.field}</td>
                <td style={{ ...tdStyle, color: "#fca5a5" }}>{e.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PreviewTable({ rows }: { rows: PreviewRow[] }) {
  if (rows.length === 0) return null;

  // Only show columns that have at least one value
  const activeCols = PREVIEW_COLUMNS.filter((col) => rows.some((r) => r[col] !== undefined && r[col] !== ""));

  return (
    <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "10px 16px", borderBottom: "1px solid #27272a", fontSize: 12, fontWeight: 600, color: "#a1a1aa" }}>
        Preview (first {Math.min(rows.length, 50)} rows)
      </div>
      <div style={{ overflowX: "auto", maxHeight: 380, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, whiteSpace: "nowrap" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #27272a" }}>
              <Th2>#</Th2>
              <Th2>✓</Th2>
              {activeCols.map((col) => (
                <Th2 key={col}>{col}</Th2>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 50).map((row) => (
              <tr
                key={row._row}
                style={{
                  borderBottom: "1px solid #1c1c1e",
                  background: row._valid ? "transparent" : "#1c0a0a",
                }}
              >
                <td style={{ ...tdStyle, color: "#52525b" }}>{row._row}</td>
                <td style={tdStyle}>
                  {row._valid ? (
                    <span style={{ color: "#22c55e" }}>✓</span>
                  ) : (
                    <span style={{ color: "#ef4444" }} title={row._errors.join("; ")}>✗</span>
                  )}
                </td>
                {activeCols.map((col) => (
                  <td key={col} style={{ ...tdStyle, color: "#a1a1aa", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {row[col] !== undefined && row[col] !== "" ? String(row[col]) : <span style={{ color: "#3f3f46" }}>—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBanner({ color, message, spinner }: { color: string; message: string; spinner?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#18181b", border: `1px solid ${color}30`, borderRadius: 8, marginBottom: 20 }}>
      {spinner && <SpinnerIcon color={color} />}
      <span style={{ fontSize: 13, color }}>{message}</span>
    </div>
  );
}

function ActionButton({ onClick, children, variant }: { onClick: () => void; children: React.ReactNode; variant: "primary" | "secondary" }) {
  const isPrimary = variant === "primary";
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 18px",
        fontSize: 13,
        fontWeight: 500,
        borderRadius: 7,
        border: isPrimary ? "none" : "1px solid #27272a",
        background: isPrimary ? "#6366f1" : "transparent",
        color: isPrimary ? "#fff" : "#a1a1aa",
        cursor: "pointer",
        transition: "opacity 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function Th2({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ padding: "7px 10px", textAlign: "left", fontSize: 10, color: "#52525b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", background: "#18181b", position: "sticky", top: 0 }}>
      {children}
    </th>
  );
}

function SpinnerIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite", flexShrink: 0 }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// ── Style constants ───────────────────────────────────────────────────────────

const ghostBtnStyle: React.CSSProperties = {
  padding: "8px 18px",
  fontSize: 13,
  fontWeight: 500,
  borderRadius: 7,
  border: "1px solid #27272a",
  background: "transparent",
  color: "#71717a",
  cursor: "pointer",
};

const tdStyle: React.CSSProperties = {
  padding: "8px 10px",
  color: "#e4e4e7",
};

// ── Column guide data ─────────────────────────────────────────────────────────

const COLUMN_GUIDE = [
  { field: "Title (required)", aliases: ["title", "goal name", "name", "objective"] },
  { field: "Type", aliases: ["type", "goal type"] },
  { field: "Category", aliases: ["category"] },
  { field: "Status", aliases: ["status"] },
  { field: "Timeframe", aliases: ["timeframe", "period"] },
  { field: "Start Date", aliases: ["start date", "start", "startdate"] },
  { field: "Due Date", aliases: ["due date", "deadline", "end date"] },
  { field: "Target Value", aliases: ["target value", "target"] },
  { field: "Current Value", aliases: ["current value", "progress", "kr progress"] },
  { field: "Unit", aliases: ["unit"] },
  { field: "Confidence", aliases: ["confidence score", "confidence"] },
  { field: "Description", aliases: ["description", "notes"] },
  { field: "Parent", aliases: ["parent", "parent goal", "parent id"] },
  { field: "Team", aliases: ["team", "team name"] },
  { field: "Owner Email", aliases: ["owner email", "owner", "email"] },
  { field: "Visibility", aliases: ["visibility"] },
  { field: "External ID", aliases: ["external id", "id", "external key"] },
];
