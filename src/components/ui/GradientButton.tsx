"use client";

import { cn } from "@/lib/utils";
import { HTMLMotionProps, motion } from "framer-motion";
import React, { useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";

export interface GradientButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "success" | "danger" | "purple" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant = "primary", size = "md", loading = false, children, onClick, disabled, type, ...props }, ref) => {
    const rippleRef = useRef<HTMLSpanElement>(null);

    const sizeClasses = {
      sm: "px-4 py-2 text-[13px] font-medium gap-1.5",
      md: "px-5 py-2.5 text-sm font-semibold gap-2",
      lg: "px-7 py-3.5 text-base font-semibold gap-2",
    };

    const gradients = {
      primary: "bg-gradient-to-r from-[#5B5CFF] to-[#4F9DFF]",
      success: "bg-gradient-to-r from-[#22C55E] to-[#2DD4BF]",
      danger: "bg-gradient-to-r from-[#EF4444] to-[#F43F5E]",
      purple: "bg-gradient-to-r from-[#8B5CF6] to-[#6C63FF]",
      ghost: "bg-transparent border border-white/10 text-white/80 hover:bg-white/5",
    };

    const glows = {
      primary: "hover:shadow-[0_0_24px_rgba(91,92,255,0.35)]",
      success: "hover:shadow-[0_0_24px_rgba(34,197,94,0.3)]",
      danger: "hover:shadow-[0_0_24px_rgba(239,68,68,0.3)]",
      purple: "hover:shadow-[0_0_24px_rgba(139,92,246,0.3)]",
      ghost: "hover:shadow-none",
    };

    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      // Ripple effect
      if (rippleRef.current) {
        const btn = e.currentTarget;
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const ripple = rippleRef.current;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.classList.remove("animate-[ripple_0.5s_ease-out]");
        void ripple.offsetWidth;
        ripple.classList.add("animate-[ripple_0.5s_ease-out]");
      }
      onClick?.(e as never);
    }, [onClick]);

    return (
      <motion.button
        ref={ref}
        type={type}
        whileHover={!disabled && !loading ? { scale: 1.02 } : undefined}
        whileTap={!disabled && !loading ? { scale: 0.97 } : undefined}
        transition={{ type: "spring" as const, stiffness: 400, damping: 20 }}
        disabled={disabled || loading}
        onClick={handleClick}
        className={cn(
          "relative inline-flex items-center justify-center overflow-hidden",
          "rounded-[14px] text-white font-medium",
          "transition-all duration-200 ease-out",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B5CFF]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111F]",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          gradients[variant],
          glows[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <span ref={rippleRef} className="absolute w-2 h-2 rounded-full bg-white/30 pointer-events-none opacity-0 animate-[ripple_0.5s_ease-out]" />
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </motion.button>
    );
  }
);

GradientButton.displayName = "GradientButton";

export default GradientButton;
