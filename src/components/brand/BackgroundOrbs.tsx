'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const BackgroundOrbs: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div
        animate={{
          x: [0, 150, -50, 0],
          y: [0, -100, 100, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] rounded-full bg-[#5B5CFF]/15 blur-[120px]"
      />
      <motion.div
        animate={{
          x: [0, -150, 50, 0],
          y: [0, 150, -50, 0],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] sm:w-[600px] sm:h-[600px] rounded-full bg-[#4F9DFF]/12 blur-[140px]"
      />
      <motion.div
        animate={{
          x: [0, 100, -100, 0],
          y: [0, 50, -150, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-[-20%] left-[20%] w-[450px] h-[450px] sm:w-[550px] sm:h-[550px] rounded-full bg-[#8B5CF6]/10 blur-[130px]"
      />
      <motion.div
        animate={{
          x: [0, -100, 100, 0],
          y: [0, -100, 50, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-[10%] right-[10%] w-[350px] h-[350px] sm:w-[450px] sm:h-[450px] rounded-full bg-[#2DD4BF]/8 blur-[100px]"
      />
    </div>
  );
};

export default BackgroundOrbs;
