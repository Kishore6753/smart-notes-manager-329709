"use client";

import React from "react";

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const { variant = "primary", className = "", ...rest } = props;

  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary:
      "bg-[color:var(--color-accent)] text-white hover:brightness-95 focus:ring-[color:var(--color-accent)] focus:ring-offset-white",
    ghost:
      "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-300 focus:ring-offset-white",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-400 focus:ring-offset-white",
  };

  return <button className={`${base} ${variants[variant]} ${className}`} {...rest} />;
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "accent" }) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
  const toneCls =
    tone === "accent"
      ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200"
      : "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  return <span className={`${base} ${toneCls}`}>{children}</span>;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/20 ${className}`}
      {...rest}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/20 ${className}`}
      {...rest}
    />
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}
