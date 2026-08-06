"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, Download, Share2 } from "lucide-react";
import { useEffect } from "react";

interface FullScreenViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  date?: string;
  author?: string;
}

export default function FullScreenViewer({ isOpen, onClose, imageUrl, title, date, author }: FullScreenViewerProps) {
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <div className="absolute top-6 flex justify-between w-full px-6 z-[101]">
            <div className="text-white">
              <h3 className="font-bold text-lg">{title || "Image Viewer"}</h3>
              <p className="text-sm opacity-70">{author} • {date}</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                <Download className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors ml-4">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            src={imageUrl}
            alt="Full screen view"
            className="max-w-full max-h-[85vh] object-contain rounded-[12px] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
