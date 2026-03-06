"use client";

import React, { useMemo } from "react";

type DiffOp = "equal" | "insert" | "delete";

type DiffLine = {
  op: DiffOp;
  text: string;
};

/**
 * Compute a simple line-based diff using LCS dynamic programming.
 * This is intentionally lightweight (no external deps) and works well for typical note sizes.
 */
function computeLineDiff(oldText: string, newText: string): DiffLine[] {
  const a = oldText.replace(/\r\n/g, "\n").split("\n");
  const b = newText.replace(/\r\n/g, "\n").split("\n");

  const n = a.length;
  const m = b.length;

  // dp[i][j] = length of LCS of a[i:] and b[j:]
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;

  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ op: "equal", text: a[i] });
      i++;
      j++;
      continue;
    }

    // Prefer the move that preserves a longer LCS.
    if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ op: "delete", text: a[i] });
      i++;
    } else {
      out.push({ op: "insert", text: b[j] });
      j++;
    }
  }

  while (i < n) {
    out.push({ op: "delete", text: a[i] });
    i++;
  }
  while (j < m) {
    out.push({ op: "insert", text: b[j] });
    j++;
  }

  // If both were empty, keep a single empty equal line so the UI isn't blank.
  if (out.length === 0) return [{ op: "equal", text: "" }];

  return out;
}

// PUBLIC_INTERFACE
export function TextDiff(props: {
  oldText: string;
  newText: string;
  oldLabel?: string;
  newLabel?: string;
}) {
  /**
   * Displays a simple line-based diff.
   *
   * Contract:
   * - oldText: baseline (e.g. version snapshot)
   * - newText: compare target (e.g. current draft)
   * - Labels are shown as a small legend.
   */
  const { oldText, newText, oldLabel = "Old", newLabel = "New" } = props;

  const lines = useMemo(() => computeLineDiff(oldText ?? "", newText ?? ""), [oldText, newText]);

  const stats = useMemo(() => {
    let ins = 0;
    let del = 0;
    let eq = 0;
    for (const l of lines) {
      if (l.op === "insert") ins++;
      else if (l.op === "delete") del++;
      else eq++;
    }
    return { ins, del, eq };
  }, [lines]);

  return (
    <div aria-label="Diff view">
      <div
        className="small"
        style={{
          display: "flex",
          gap: 10,
          alignItems: "baseline",
          flexWrap: "wrap",
          marginBottom: 8
        }}
      >
        <span className="pill" style={{ padding: "6px 10px" }}>
          <strong style={{ color: "var(--text)" }}>Diff</strong>
          <span className="small" style={{ marginLeft: 8 }}>
            {oldLabel} → {newLabel}
          </span>
        </span>

        <span className="small" style={{ color: "var(--muted)" }}>
          +{stats.ins} / −{stats.del} (unchanged {stats.eq})
        </span>

        <span className="small" style={{ color: "var(--muted)" }}>
          Tip: this compares Markdown source (plain text), not rendered HTML.
        </span>
      </div>

      <div
        role="region"
        aria-label="Diff lines"
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            maxHeight: 280,
            overflow: "auto",
            fontFamily: "var(--mono)",
            fontSize: 13,
            lineHeight: 1.5,
            background: "rgba(249, 250, 251, 0.6)"
          }}
        >
          {lines.map((l, idx) => {
            const bg =
              l.op === "insert"
                ? "rgba(34, 197, 94, 0.10)"
                : l.op === "delete"
                  ? "rgba(239, 68, 68, 0.10)"
                  : "transparent";
            const border =
              l.op === "insert"
                ? "rgba(34, 197, 94, 0.35)"
                : l.op === "delete"
                  ? "rgba(239, 68, 68, 0.35)"
                  : "transparent";
            const sign = l.op === "insert" ? "+" : l.op === "delete" ? "−" : " ";

            return (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "26px 1fr",
                  gap: 10,
                  padding: "2px 10px",
                  background: bg,
                  borderLeft: `3px solid ${border}`,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word"
                }}
              >
                <span aria-hidden="true" style={{ color: "var(--muted)" }}>
                  {sign}
                </span>
                <span>{l.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
