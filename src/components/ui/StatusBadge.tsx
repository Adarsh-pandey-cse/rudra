"use client";

import React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "pending" | "active" | "success" | "error" | "warning" | "info" | "default";

interface StatusBadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
  pulse?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  pending: "bg-amber-500/12 text-amber-400 border-amber-500/20",
  active: "bg-blue-500/12 text-blue-400 border-blue-500/20",
  success: "bg-emerald-500/12 text-emerald-400 border-emerald-500/20",
  error: "bg-red-500/12 text-red-400 border-red-500/20",
  warning: "bg-orange-500/12 text-orange-400 border-orange-500/20",
  info: "bg-cyan-500/12 text-cyan-400 border-cyan-500/20",
  default: "bg-white/8 text-white/60 border-white/10",
};

const dotColors: Record<BadgeVariant, string> = {
  pending: "bg-amber-400",
  active: "bg-blue-400",
  success: "bg-emerald-400",
  error: "bg-red-400",
  warning: "bg-orange-400",
  info: "bg-cyan-400",
  default: "bg-white/40",
};

export default function StatusBadge({ variant = "default", children, dot = false, pulse = false, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        "px-2.5 py-1 rounded-full",
        "text-[11px] font-semibold uppercase tracking-wider",
        "border",
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && (
            <span className={cn("absolute inset-0 rounded-full animate-ping opacity-75", dotColors[variant])} />
          )}
          <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", dotColors[variant])} />
        </span>
      )}
      {children}
    </span>
  );
}
