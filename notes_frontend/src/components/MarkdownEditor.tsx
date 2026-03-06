"use client";

import React from "react";
import { MarkdownPreview } from "@/components/MarkdownPreview";

export type MarkdownViewMode = "edit" | "preview" | "split";

// PUBLIC_INTERFACE
export function MarkdownEditor(props: {
  value: string;
  onChange: (next: string) => void;
  mode: MarkdownViewMode;
  onModeChange: (next: MarkdownViewMode) => void;
  textareaLabel?: string;
}) {
  /**
   * A reusable Markdown editing surface with preview modes.
   *
   * Contract:
   * - value: markdown text
   * - onChange: called with new markdown text
   * - mode: "edit" | "preview" | "split"
   * - onModeChange: updates view mode
   */
  const { value, onChange, mode, onModeChange, textareaLabel } = props;

  return (
    <div className="editor-grid">
      <div className="editor-row" role="group" aria-label="Editor mode">
        <span className="pill">
          <strong style={{ color: "var(--text)" }}>Markdown</strong>
          <span className="small">mode:</span>
          <button
            type="button"
            className="btn"
            onClick={() => onModeChange("edit")}
            aria-pressed={mode === "edit"}
            title="Edit markdown"
          >
            Edit
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => onModeChange("preview")}
            aria-pressed={mode === "preview"}
            title="Preview markdown"
          >
            Preview
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => onModeChange("split")}
            aria-pressed={mode === "split"}
            title="Split view"
          >
            Split
          </button>
        </span>
      </div>

      {mode === "edit" && (
        <textarea
          className="textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={"Write Markdown here...\n\nExamples:\n# Title\n- [ ] Task\n```js\nconsole.log('hello')\n```"}
          aria-label={textareaLabel ?? "Markdown editor"}
        />
      )}

      {mode === "preview" && <MarkdownPreview markdown={value} />}

      {mode === "split" && (
        <div className="split" aria-label="Split view">
          <textarea
            className="textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write Markdown here..."
            aria-label={textareaLabel ?? "Markdown editor"}
          />
          <MarkdownPreview markdown={value} />
        </div>
      )}
    </div>
  );
}
