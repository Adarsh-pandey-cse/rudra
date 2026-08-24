"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PDFViewerProps {
  url: string;
}

export default function ReactPDFViewer({ url }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>();
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>();

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <div className="flex flex-col items-center w-full h-full bg-[#131D2E] rounded-xl overflow-hidden relative text-white">
      {/* Toolbar */}
      <div className="w-full bg-[#0B1527] border-b border-white/10 p-3 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          <span className="text-sm font-medium text-[#B6C2D9]">
            {numPages ? `${numPages} Pages` : 'Loading...'}
          </span>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className="p-2 hover:bg-white/10 rounded-lg"><ZoomOut className="w-4 h-4 md:w-5 md:h-5" /></button>
          <span className="text-xs md:text-sm font-medium w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(3, s + 0.25))} className="p-2 hover:bg-white/10 rounded-lg"><ZoomIn className="w-4 h-4 md:w-5 md:h-5" /></button>
          <div className="w-px h-5 bg-white/10 mx-1"></div>
          <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-2 hover:bg-white/10 rounded-lg"><RotateCw className="w-4 h-4 md:w-5 md:h-5" /></button>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 w-full overflow-auto bg-[#1A2333] p-2 md:p-8" ref={containerRef}>
        <div className="flex flex-col items-center w-full min-h-full">
          <Document
            file={url.replace("http://", "https://")}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(err) => setLoadError(err.message)}
            className="flex flex-col items-center gap-4 md:gap-8 pb-12 w-full"
            loading={
              <div className="flex flex-col items-center justify-center h-64 text-[#7B8798] w-full">
                <div className="w-8 h-8 border-4 border-[#5B5CFF] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p>Loading Document...</p>
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center h-64 text-red-400 px-6 text-center w-full">
                <p className="font-bold mb-2">Failed to load PDF document.</p>
                {loadError && <p className="text-xs text-red-300 break-all bg-red-900/20 p-2 rounded max-w-full">{loadError}</p>}
                <p className="text-[10px] text-white/40 mt-4 break-all max-w-full">URL: {url.substring(0, 50)}...</p>
              </div>
            }
          >
            {numPages && Array.from(new Array(numPages), (el, index) => (
              <Page 
                key={`page_${index + 1}`}
                pageNumber={index + 1} 
                scale={scale}
                width={containerWidth ? Math.min(containerWidth - 32, 1000) : undefined}
                rotate={rotation}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-2xl bg-white max-w-full overflow-hidden"
              />
            ))}
          </Document>
        </div>
      </div>
    </div>
  );
}
