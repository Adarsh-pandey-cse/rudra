import React, { useEffect, useState } from 'react';

export default function UploadProgressRing({ progress: actualProgress }: { progress?: number }) {
  const [simulatedProgress, setSimulatedProgress] = useState(0);

  useEffect(() => {
    if (actualProgress !== undefined) return;
    const interval = setInterval(() => {
      setSimulatedProgress(p => {
        if (p >= 95) return p;
        return p + Math.random() * 15;
      });
    }, 300);
    return () => clearInterval(interval);
  }, [actualProgress]);

  const progress = actualProgress !== undefined ? actualProgress : simulatedProgress;

  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = Math.max(0, circumference - (Math.min(progress, 100) / 100) * circumference);

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="relative flex items-center justify-center w-16 h-16">
        <svg className="w-16 h-16 transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-white/10"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="text-[#5B5CFF] transition-all duration-300 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[13px] font-bold text-white">{Math.round(Math.min(progress, 100))}%</span>
        </div>
      </div>
      <span className="text-xs font-medium text-white/70 uppercase tracking-wider">Uploading</span>
    </div>
  );
}
