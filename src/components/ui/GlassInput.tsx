"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  success?: boolean;
  wrapperClassName?: string;
}

const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, icon, error, success, className, wrapperClassName, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("relative", wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-medium text-[#B6C2D9] mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7B8798] pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-[14px] px-4 py-3 text-sm text-white",
              "bg-white/[0.04] backdrop-blur-[12px]",
              "border transition-all duration-200 ease-out",
              "placeholder:text-[#4B5563]",
              "focus:outline-none",
              icon && "pl-11",
              error
                ? "border-red-500/40 focus:border-red-500/60 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]"
                : success
                ? "border-green-500/40 focus:border-green-500/60 focus:shadow-[0_0_0_3px_rgba(34,197,94,0.12)]"
                : "border-white/[0.08] focus:border-[#5B5CFF]/60 focus:shadow-[0_0_0_3px_rgba(91,92,255,0.12)] focus:bg-white/[0.06]",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-[12px] text-red-400 animate-fade-up">{error}</p>
        )}
      </div>
    );
  }
);

GlassInput.displayName = "GlassInput";

export default GlassInput;
