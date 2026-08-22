import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, RotateCw, Download, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

interface InlineFileViewerProps {
  url: string;
  name: string;
  type: string;
}

export default function InlineFileViewer({ url, name, type }: InlineFileViewerProps) {
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
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#0B1527] rounded-xl overflow-hidden border border-white/10 group">
      {/* Top Bar for Download */}
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <a 
          href={url} 
          download={name}
          target="_blank"
          rel="noreferrer"
          className="p-2 bg-black/50 hover:bg-black/80 rounded-lg text-white transition-colors flex items-center gap-2 backdrop-blur-sm"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>

      {isImage ? (
        <>
          <div className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing relative">
            <motion.div
              drag
              dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
              dragElastic={0.1}
              className="w-full h-full flex items-center justify-center absolute inset-0"
            >
              <img 
                src={url} 
                alt={name} 
                style={{ 
                  transform: 'scale(' + scale + ') rotate(' + rotation + 'deg)',
                  transition: 'transform 0.2s ease-out'
                }}
                className="max-w-full max-h-full object-contain pointer-events-none" 
              />
            </motion.div>
          </div>
          
          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 sm:gap-2 bg-black/60 backdrop-blur-md border border-white/10 p-1 sm:p-2 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity scale-90 sm:scale-100">
            <button onClick={handleZoomOut} className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors"><ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" /></button>
            <button onClick={handleReset} className="px-2 font-medium text-white/80 hover:text-white transition-colors text-xs sm:text-sm">{Math.round(scale * 100)}%</button>
            <button onClick={handleZoomIn} className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors"><ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" /></button>
            <div className="w-px h-4 sm:h-6 bg-white/20 mx-0 sm:mx-1"></div>
            <button onClick={handleRotateLeft} className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors"><RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" /></button>
            <button onClick={handleRotateRight} className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors"><RotateCw className="w-4 h-4 sm:w-5 sm:h-5" /></button>
          </div>
        </>
      ) : isDoc ? (
        <iframe 
          src={'https://docs.google.com/gview?url=' + encodeURIComponent(url) + '&embedded=true'} 
          className="w-full h-full border-0 bg-white"
          title={name}
        />
      ) : (
        <div className="text-center p-8">
          <FileText className="w-12 h-12 text-white/30 mx-auto mb-3" />
          <p className="text-white/80 text-sm font-medium">{name}</p>
          <a href={url} download={name} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg text-sm hover:bg-white/20 transition-colors">
            <Download className="w-4 h-4" /> Download
          </a>
        </div>
      )}
    </div>
  );
}
