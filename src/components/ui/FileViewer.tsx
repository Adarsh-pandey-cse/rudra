import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw, RotateCw, Download, FileText } from 'lucide-react';
import { createPortal } from 'react-dom';
import dynamic from "next/dynamic";
const ReactPDFViewer = dynamic(() => import("./ReactPDFViewer"), { ssr: false });

interface FileViewerProps {
  url: string;
  name: string;
  type: string; // 'image', 'pdf', 'docx', 'other'
  onClose: () => void;
}

export default function FileViewer({ url, name, type, onClose }: FileViewerProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5));
  const handleRotateLeft = () => setRotation(prev => prev - 90);
  const handleRotateRight = () => setRotation(prev => prev + 90);
  const handleReset = () => { setScale(1); setRotation(0); };

  const isImage = type === 'image' || url.startsWith('data:image/');
  const isPdf = type === 'pdf' || url.endsWith('.pdf');
  const isDoc = type === 'docx' || url.endsWith('.docx');

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4 md:p-8 backdrop-blur-md"
      >
        <div className="absolute top-4 right-4 z-[99999] flex items-center gap-3">
          <a 
            href={url} 
            download={name}
            target="_blank"
            rel="noreferrer"
            className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all shadow-lg hover:scale-105"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </a>
          <button 
            onClick={onClose} 
            className="p-3 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-all shadow-lg hover:scale-105"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isImage && (
          <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-[99999] flex items-center gap-1.5 md:gap-2 bg-[#0B1527]/90 backdrop-blur-xl border border-white/10 p-2 md:p-3 rounded-2xl shadow-2xl">
            <button onClick={handleZoomOut} className="p-2 md:p-3 hover:bg-white/10 rounded-xl text-white transition-colors"><ZoomOut className="w-4 h-4 md:w-5 md:h-5" /></button>
            <button onClick={handleReset} className="px-2 md:px-3 font-medium text-white/80 hover:text-white transition-colors text-xs md:text-sm min-w-[3rem] text-center">{Math.round(scale * 100)}%</button>
            <button onClick={handleZoomIn} className="p-2 md:p-3 hover:bg-white/10 rounded-xl text-white transition-colors"><ZoomIn className="w-4 h-4 md:w-5 md:h-5" /></button>
            <div className="w-px h-5 md:h-6 bg-white/10 mx-1 md:mx-2"></div>
            <button onClick={handleRotateLeft} className="p-2 md:p-3 hover:bg-white/10 rounded-xl text-white transition-colors"><RotateCcw className="w-4 h-4 md:w-5 md:h-5" /></button>
            <button onClick={handleRotateRight} className="p-2 md:p-3 hover:bg-white/10 rounded-xl text-white transition-colors"><RotateCw className="w-4 h-4 md:w-5 md:h-5" /></button>
          </div>
        )}

        <div className="w-full h-full flex items-center justify-center relative overflow-hidden rounded-2xl">
          {isImage ? (
            <motion.div
              drag
              dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
              dragElastic={0.2}
              animate={{ scale, rotate: rotation }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="cursor-grab active:cursor-grabbing touch-none select-none"
            >
              <img 
                src={url} 
                alt={name} 
                className="max-w-[95vw] max-h-[85vh] object-contain drop-shadow-2xl pointer-events-none" 
              />
            </motion.div>
                    ) : isPdf ? (
            <ReactPDFViewer url={url} />
          ) : isDoc ? (
            <iframe 
              src={'https://docs.google.com/gview?url=' + encodeURIComponent(url) + '&embedded=true'} 
              className="w-full h-full border-0 bg-white rounded-xl"
              title={name}
            />
          ) : (
            <div className="text-center p-8 bg-white/5 rounded-2xl border border-white/10">
              <FileText className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <p className="text-white text-lg font-medium">{name}</p>
              <p className="text-white/50 text-sm mt-2 mb-6">Preview not available for this file type.</p>
              <a href={url} download={name} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-[#5B5CFF] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#5B5CFF]/80 transition-colors">
                <Download className="w-4 h-4" /> Download File
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

