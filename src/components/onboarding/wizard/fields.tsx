"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

export function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">
        {label} {required && <span className="text-red-400">*</span>}
      </span>
      {children}
      {hint && !error && (
        <span className="text-[12px] text-[var(--text-muted)] mt-1 block">
          {hint}
        </span>
      )}
      {error && (
        <span className="text-[12px] text-red-300 mt-1 block">{error}</span>
      )}
    </label>
  );
}

export function TextInput({
  className = "",
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...rest}
      className={`w-full bg-[var(--overlay-soft)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--overlay-strong)] min-h-[44px] ${className}`}
    />
  );
}

export function MultiSelectPills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T[];
  onChange: (next: T[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value.includes(opt.value);
        return (
          <button
            type="button"
            key={opt.value}
            onClick={() => {
              if (selected) {
                onChange(value.filter((v) => v !== opt.value));
              } else {
                onChange([...value, opt.value]);
              }
            }}
            className={`text-[13px] rounded-full px-3 py-2 border transition-colors min-h-[36px] ${
              selected
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200"
                : "bg-[var(--overlay-soft)] border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--overlay-weak)]"
            }`}
            aria-pressed={selected}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function SingleSelectPills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | "";
  onChange: (next: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            type="button"
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`text-[13px] rounded-full px-3 py-2 border transition-colors min-h-[36px] ${
              selected
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200"
                : "bg-[var(--overlay-soft)] border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--overlay-weak)]"
            }`}
            aria-pressed={selected}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="border border-[var(--border)] bg-[var(--overlay-soft)] rounded-lg px-2 py-2 flex flex-wrap gap-1.5">
      {value.map((tag, idx) => (
        <span
          key={`${tag}-${idx}`}
          className="inline-flex items-center gap-1 text-[12px] bg-[var(--overlay-weak)] border border-[var(--border)] rounded-full px-2 py-1 text-[var(--text-primary)]"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((_, i) => i !== idx))}
            className="text-[var(--text-muted)] hover:text-red-300"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        placeholder={placeholder}
        className="flex-1 min-w-[120px] bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] px-1 py-1 focus:outline-none"
        onKeyDown={(e) => {
          const target = e.currentTarget;
          if ((e.key === "Enter" || e.key === ",") && target.value.trim()) {
            e.preventDefault();
            const v = target.value.trim().replace(/,$/, "");
            if (v && !value.includes(v)) onChange([...value, v]);
            target.value = "";
          } else if (e.key === "Backspace" && !target.value && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
      />
    </div>
  );
}
