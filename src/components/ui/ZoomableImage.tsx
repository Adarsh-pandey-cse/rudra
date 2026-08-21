"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, RotateCw, RotateCcw, RefreshCcw } from "lucide-react";

interface ZoomableImageProps {
  src: string;
  alt?: string;
  className?: string;
  imageClassName?: string;
}

export default function ZoomableImage({ src, alt = "Image", className = "", imageClassName = "object-cover" }: ZoomableImageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = (e: React.MouseEvent) => { e.stopPropagation(); setScale(s => Math.min(s + 0.5, 5)); };
  const handleZoomOut = (e: React.MouseEvent) => { e.stopPropagation(); setScale(s => Math.max(s - 0.5, 0.5)); };
  const handleRotateRight = (e: React.MouseEvent) => { e.stopPropagation(); setRotation(r => r + 90); };
  const handleRotateLeft = (e: React.MouseEvent) => { e.stopPropagation(); setRotation(r => r - 90); };
  const handleReset = (e: React.MouseEvent) => { e.stopPropagation(); setScale(1); setRotation(0); };

  return (
    <>
      <div 
        className={\elative group cursor-zoom-in overflow-hidden \\}
        onClick={() => { setIsOpen(true); setScale(1); setRotation(0); }}
      >
        <img 
          src={src} 
          alt={alt} 
          className={\w-full h-full transition-transform duration-300 group-hover:scale-105 \\} 
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="p-2 bg-black/50 backdrop-blur-sm rounded-full text-white">
            <ZoomIn className="w-5 h-5" />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl p-4 sm:p-8"
            onClick={() => setIsOpen(false)}
          >
            {/* Top Bar Actions */}
            <div className="absolute top-6 right-6 flex items-center gap-3 z-50" onClick={e => e.stopPropagation()}>
              <div className="flex bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/10 text-white">
                <button onClick={handleZoomOut} className="p-2 hover:bg-white/20 rounded-full transition-colors"><ZoomOut className="w-5 h-5" /></button>
                <button onClick={handleReset} className="p-2 hover:bg-white/20 rounded-full transition-colors"><RefreshCcw className="w-5 h-5" /></button>
                <button onClick={handleZoomIn} className="p-2 hover:bg-white/20 rounded-full transition-colors"><ZoomIn className="w-5 h-5" /></button>
                <div className="w-[1px] bg-white/20 mx-1 my-2" />
                <button onClick={handleRotateLeft} className="p-2 hover:bg-white/20 rounded-full transition-colors"><RotateCcw className="w-5 h-5" /></button>
                <button onClick={handleRotateRight} className="p-2 hover:bg-white/20 rounded-full transition-colors"><RotateCw className="w-5 h-5" /></button>
              </div>
              <button 
                className="p-3 bg-red-500/20 hover:bg-red-500/40 rounded-full text-red-100 backdrop-blur-md transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
              <motion.img
                initial={{ scale: 0.9, opacity: 0, rotate: 0 }}
                animate={{ scale: scale, opacity: 1, rotate: rotation }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                src={src}
                alt={alt}
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl cursor-grab active:cursor-grabbing"
                drag
                dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
                onClick={(e) => e.stopPropagation()} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
