"use client";

import { cn } from "@/lib/utils";
import { HTMLMotionProps, motion } from "framer-motion";
import React from "react";

export interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  variant?: "default" | "glow" | "bordered" | "accent";
  noPadding?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, hoverEffect = false, variant = "default", noPadding = false, ...props }, ref) => {
    const variantStyles = {
      default: "",
      glow: "shadow-[0_0_24px_rgba(91,92,255,0.12)]",
      bordered: "border-white/[0.12]",
      accent: "border-[rgba(91,92,255,0.25)] bg-[rgba(91,92,255,0.04)]",
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-[20px] border border-white/[0.08] overflow-hidden",
          "bg-white/[0.06] backdrop-blur-[28px]",
          "shadow-[0_8px_32px_rgba(0,0,0,0.24)]",
          "transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)]",
          !noPadding && "p-5",
          hoverEffect && [
            "hover:border-white/[0.16]",
            "hover:bg-white/[0.10]",
            "hover:shadow-[0_16px_48px_rgba(0,0,0,0.32)]",
            "active:scale-[0.98]",
          ],
          variantStyles[variant],
          className
        )}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export default GlassCard;
