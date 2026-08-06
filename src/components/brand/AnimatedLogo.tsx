'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';

export const AnimatedLogo: React.FC = () => {
  const letterContainer: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        delayChildren: 1.2,
        staggerChildren: 0.1,
      },
    },
  };

  const letterVariant: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    },
  };

  const word = "RUDRA";

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-transparent">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mb-6"
      >
        <svg
          width="80"
          height="80"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="animated-rudra-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#5B5CFF" />
              <stop offset="1" stopColor="#4F9DFF" />
            </linearGradient>
          </defs>
          <motion.path
            d="M10 32V8H24C28.4183 8 32 11.5817 32 16C32 19.8273 29.3093 23.0253 25.7533 23.822L31 32H25.5L20.8 24H16V32H10ZM16 19H23.5C25.1569 19 26.5 17.6569 26.5 16C26.5 14.3431 25.1569 13 23.5 13H16V19Z"
            stroke="url(#animated-rudra-grad)"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="url(#animated-rudra-grad)"
            initial={{ pathLength: 0, fillOpacity: 0 }}
            animate={{ pathLength: 1, fillOpacity: 1 }}
            transition={{
              pathLength: { duration: 1.5, ease: "easeInOut" },
              fillOpacity: { delay: 1, duration: 0.8, ease: "easeIn" }
            }}
          />
        </svg>
      </motion.div>

      <motion.div
        variants={letterContainer}
        initial="hidden"
        animate="show"
        className="flex space-x-[2px]"
      >
        {word.split("").map((char, i) => (
          <motion.span
            key={i}
            variants={letterVariant}
            className="text-3xl sm:text-4xl font-bold text-white tracking-[0.05em] font-['Inter']"
          >
            {char}
          </motion.span>
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.6, ease: "easeOut" }}
        className="mt-4 text-[#B6C2D9] text-sm tracking-wide font-medium"
      >
        Master Learning. Every Day.
      </motion.p>
    </div>
  );
};

export default AnimatedLogo;
