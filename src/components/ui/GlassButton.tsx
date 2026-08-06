"use client";

import { cn } from "@/lib/utils";
import { HTMLMotionProps, motion } from "framer-motion";
import React from "react";

export interface GlassButtonProps extends HTMLMotionProps<"button"> {
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, size = "md", children, disabled, ...props }, ref) => {
    const sizeClasses = {
      sm: "px-3.5 py-1.5 text-[13px]",
      md: "px-5 py-2.5 text-sm",
      lg: "px-7 py-3.5 text-base",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={!disabled ? { scale: 1.02 } : undefined}
        whileTap={!disabled ? { scale: 0.97 } : undefined}
        transition={{ type: "spring" as const, stiffness: 400, damping: 20 }}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center gap-2",
          "rounded-[14px] font-medium",
          "bg-white/[0.06] backdrop-blur-[20px]",
          "border border-white/[0.10]",
          "text-white/90",
          "transition-all duration-200 ease-out",
          "hover:bg-white/[0.12] hover:border-white/[0.18]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B5CFF]/40",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

GlassButton.displayName = "GlassButton";

export default GlassButton;
