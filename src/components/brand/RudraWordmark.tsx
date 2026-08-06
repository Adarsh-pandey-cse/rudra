import React from 'react';
import { cn } from '@/lib/utils';

interface RudraWordmarkProps {
  size?: number;
  className?: string;
}

export function RudraWordmark({ size = 40, className }: RudraWordmarkProps) {
  return (
    <div className={cn("relative inline-block", className)}>
      <svg
        height={size}
        viewBox="0 0 300 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block"
        style={{ width: 'auto' }}
      >
        <defs>
          <linearGradient id="rudra-wordmark-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <filter id="shadow3d" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="2" dy="4" stdDeviation="2" floodColor="#000000" floodOpacity="0.15" />
            <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="#4F46E5" floodOpacity="0.3" />
          </filter>
        </defs>
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          fill="url(#rudra-wordmark-gradient)"
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '72px',
            fontWeight: 800,
            letterSpacing: '0.15em',
            filter: 'url(#shadow3d)',
          }}
        >
          RUDRA
        </text>
      </svg>
    </div>
  );
}

export default RudraWordmark;
