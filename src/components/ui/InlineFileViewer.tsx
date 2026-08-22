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
  const isPdf = type === 'pdf' || url.endsWith('.pdf');
  const isDoc = type === 'docx' || url.endsWith('.docx');

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#0B1527] rounded-xl overflow-hidden border border-white/10 group touch-none">
      {/* Top Bar for Download */}
      <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <a 
          href={url} 
          download={name}
          target="_blank"
          rel="noreferrer"
          className="p-2 bg-black/50 hover:bg-black/80 rounded-lg text-white transition-colors flex items-center gap-2 backdrop-blur-sm shadow-md"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>

      {isImage ? (
        <>
          <div className="w-full h-full flex items-center justify-center overflow-hidden relative">
            <motion.div
              drag
              dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
              dragElastic={0.2}
              animate={{ scale, rotate: rotation }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="cursor-grab active:cursor-grabbing inline-block select-none"
            >
              <img 
                src={url} 
                alt={name} 
                className="max-w-full max-h-[85vh] object-contain drop-shadow-lg pointer-events-none" 
              />
            </motion.div>
          </div>
          
          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 sm:gap-2 bg-black/70 backdrop-blur-md border border-white/10 p-1.5 rounded-xl shadow-2xl opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={handleZoomOut} className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors"><ZoomOut className="w-4 h-4" /></button>
            <button onClick={handleReset} className="px-2 font-medium text-white/90 hover:text-white transition-colors text-xs min-w-[2.5rem] text-center">{Math.round(scale * 100)}%</button>
            <button onClick={handleZoomIn} className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors"><ZoomIn className="w-4 h-4" /></button>
            <div className="w-px h-5 bg-white/20 mx-0.5"></div>
            <button onClick={handleRotateLeft} className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors"><RotateCcw className="w-4 h-4" /></button>
            <button onClick={handleRotateRight} className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors"><RotateCw className="w-4 h-4" /></button>
          </div>
        </>
            ) : isPdf ? (
        <iframe 
          src={url} 
          className="w-full h-full border-0 bg-white rounded-xl"
          title={name}
        />
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

