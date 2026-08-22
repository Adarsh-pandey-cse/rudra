"use client";

import React, { useState } from 'react';
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
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  return (
    <div className="flex flex-col items-center w-full h-full bg-[#131D2E] rounded-xl overflow-hidden relative text-white">
      {/* Toolbar */}
      <div className="w-full bg-[#0B1527] border-b border-white/10 p-3 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => setPageNumber(p => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium">
            Page {pageNumber} of {numPages || '--'}
          </span>
          <button 
            onClick={() => setPageNumber(p => Math.min(numPages || 1, p + 1))}
            disabled={pageNumber >= (numPages || 1)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
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
      <div className="flex-1 w-full overflow-auto flex justify-center bg-[#1A2333] p-4 md:p-8">
        <Document
          file={url.replace("http://", "https://")}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(err) => setLoadError(err.message)}
          loading={
            <div className="flex flex-col items-center justify-center h-64 text-[#7B8798]">
              <div className="w-8 h-8 border-4 border-[#5B5CFF] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p>Loading Document...</p>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center h-64 text-red-400 px-6 text-center">
              <p className="font-bold mb-2">Failed to load PDF document.</p>
              {loadError && <p className="text-xs text-red-300 break-all bg-red-900/20 p-2 rounded">{loadError}</p>}
              <p className="text-[10px] text-white/40 mt-4 break-all">URL: {url.substring(0, 50)}...</p>
            </div>
          }
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale} 
            rotate={rotation}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-2xl bg-white"
          />
        </Document>
      </div>
    </div>
  );
}
