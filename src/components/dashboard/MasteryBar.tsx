"use client";

import React from "react";
import { motion } from "framer-motion";

interface MasteryBarProps {
  label: string;
  value: number;
  className?: string;
}

export default function MasteryBar({ label, value, className = "" }: MasteryBarProps) {
  const getGradient = (val: number) => {
    if (val < 30) return "bg-gradient-to-r from-red-500/80 to-red-400";
    if (val < 55) return "bg-gradient-to-r from-orange-500/80 to-amber-400";
    if (val < 80) return "bg-gradient-to-r from-blue-500/80 to-indigo-400";
    return "bg-gradient-to-r from-emerald-500/80 to-teal-400";
  };

  const gradientClass = getGradient(value);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-semibold text-white">{label}</span>
        <span className="text-[13px] font-medium text-[#7B8798]">{value}%</span>
      </div>
      <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${gradientClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" as const }}
        />
      </div>
    </div>
  );
}
