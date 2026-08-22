import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw, RotateCw, Download, FileText } from 'lucide-react';

interface FileViewerProps {
  url: string;
  name: string;
  type: string; // 'image', 'pdf', 'docx', 'other'
  onClose: () => void;
}

export default function FileViewer({ url, name, type, onClose }: FileViewerProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5));
  const handleRotateLeft = () => setRotation(prev => prev - 90);
  const handleRotateRight = () => setRotation(prev => prev + 90);
  const handleReset = () => { setScale(1); setRotation(0); };

  const isImage = type === 'image' || url.startsWith('data:image/');
  const isDoc = type === 'pdf' || type === 'docx' || url.endsWith('.pdf') || url.endsWith('.docx');

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-8 backdrop-blur-sm"
      >
        <div className="absolute top-4 right-4 z-[110] flex items-center gap-2">
          <a 
            href={url} 
            download={name}
            target="_blank"
            rel="noreferrer"
            className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </a>
          <button 
            onClick={onClose} 
            className="p-3 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isImage && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-2 bg-[#0F172A] border border-white/10 p-2 rounded-2xl shadow-2xl">
            <button onClick={handleZoomOut} className="p-3 hover:bg-white/10 rounded-xl text-white transition-colors"><ZoomOut className="w-5 h-5" /></button>
            <button onClick={handleReset} className="px-3 font-medium text-white/80 hover:text-white transition-colors text-sm">{Math.round(scale * 100)}%</button>
            <button onClick={handleZoomIn} className="p-3 hover:bg-white/10 rounded-xl text-white transition-colors"><ZoomIn className="w-5 h-5" /></button>
            <div className="w-px h-6 bg-white/10 mx-1"></div>
            <button onClick={handleRotateLeft} className="p-3 hover:bg-white/10 rounded-xl text-white transition-colors"><RotateCcw className="w-5 h-5" /></button>
            <button onClick={handleRotateRight} className="p-3 hover:bg-white/10 rounded-xl text-white transition-colors"><RotateCw className="w-5 h-5" /></button>
          </div>
        )}

        <div className="w-full h-full flex items-center justify-center relative overflow-hidden rounded-2xl">
          {isImage ? (
            <motion.div
              drag
              dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
              dragElastic={0.1}
              className="cursor-grab active:cursor-grabbing w-full h-full flex items-center justify-center"
            >
              <img 
                src={url} 
                alt={name} 
                style={{ 
                  transform: 'scale(' + scale + ') rotate(' + rotation + 'deg)',
                  transition: 'transform 0.2s ease-out'
                }}
                className="max-w-full max-h-full object-contain drop-shadow-2xl pointer-events-none" 
              />
            </motion.div>
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
    </AnimatePresence>
  );
}
