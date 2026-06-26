"use client";

import { type ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="animate-rise mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold uppercase tracking-wide text-white">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#2a2040] bg-[#1a1230] p-4 shadow-lg ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="animate-rise rounded-2xl border border-dashed border-[#3a2e55] bg-[#1a1230]/50 p-8 text-center">
      <p className="font-semibold text-white">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "ghost" | "danger";
  className?: string;
  disabled?: boolean;
};

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  className = "",
  disabled,
}: ButtonProps) {
  const styles = {
    primary:
      "bg-[#f5188c] text-white hover:bg-[#ff3a9f] shadow-[0_0_18px_rgba(245,24,140,0.45)] disabled:opacity-50 disabled:shadow-none",
    ghost:
      "bg-white/5 text-slate-200 border border-[#2e2444] hover:bg-white/10 disabled:opacity-50",
    danger:
      "bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 disabled:opacity-50",
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="animate-fade-in fixed inset-0 z-30 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="animate-slide-up w-full max-w-md rounded-t-3xl border border-[#2e2444] bg-[#1a1230] p-5 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold uppercase tracking-wide text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Fermer"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-300">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-[#2e2444] bg-[#241a3a] px-3 py-2 text-sm text-white placeholder:text-slate-500 transition-colors focus:border-[#f5188c] focus:ring-2 focus:ring-[#f5188c]/25 focus:outline-none";
