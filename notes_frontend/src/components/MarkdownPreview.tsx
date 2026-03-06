"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// PUBLIC_INTERFACE
export function MarkdownPreview({ markdown }: { markdown: string }) {
  /**
   * Render Markdown into HTML safely (ReactMarkdown escapes by default).
   *
   * Contract:
   * - Input: markdown string (may be empty)
   * - Output: rendered markdown content
   * - Security: does NOT enable raw HTML parsing
   */
  return (
    <div className="preview markdown" aria-label="Markdown preview">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown || ""}</ReactMarkdown>
    </div>
  );
}
