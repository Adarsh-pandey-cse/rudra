'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface RudraLogoProps {
  size?: number | 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const RudraLogo: React.FC<RudraLogoProps> = ({
  size = 'md',
  showText = false,
  className,
}) => {
  const sizeMap = {
    sm: 28,
    md: 40,
    lg: 56,
  };
  const numSize = typeof size === 'string' ? sizeMap[size] : size;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <svg
        width={numSize}
        height={numSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="rudra-logo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#5B5CFF" />
            <stop offset="1" stopColor="#4F9DFF" />
          </linearGradient>
        </defs>
        {/* Premium minimal geometric R shape */}
        <path
          d="M10 32V8H24C28.4183 8 32 11.5817 32 16C32 19.8273 29.3093 23.0253 25.7533 23.822L31 32H25.5L20.8 24H16V32H10ZM16 19H23.5C25.1569 19 26.5 17.6569 26.5 16C26.5 14.3431 25.1569 13 23.5 13H16V19Z"
          fill="url(#rudra-logo-grad)"
        />
      </svg>
      {showText && (
        <span 
          className="font-bold text-white tracking-[0.05em]" 
          style={{ 
            fontSize: numSize * 0.45, 
            lineHeight: 1,
            fontFamily: 'Inter, sans-serif' 
          }}
        >
          RUDRA
        </span>
      )}
    </div>
  );
};

export default RudraLogo;
