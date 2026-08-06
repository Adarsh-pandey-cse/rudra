"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  variant?: "card" | "text" | "avatar" | "chart" | "table-row" | "circle";
  className?: string;
  count?: number;
}

export default function SkeletonLoader({ variant = "text", className, count = 1 }: SkeletonLoaderProps) {
  const variants = {
    text: "h-4 w-full rounded-lg",
    card: "h-32 w-full rounded-[20px]",
    avatar: "h-10 w-10 rounded-full",
    circle: "h-24 w-24 rounded-full",
    chart: "h-48 w-full rounded-[20px]",
    "table-row": "h-14 w-full rounded-xl",
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "skeleton",
            variants[variant],
            className
          )}
        />
      ))}
    </>
  );
}
