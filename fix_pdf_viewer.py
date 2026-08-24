import re

with open('src/components/ui/ReactPDFViewer.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add useRef and useEffect imports if missing
if 'useRef' not in content:
    content = content.replace('import React, { useState } from', 'import React, { useState, useRef, useEffect } from')

old_component = '''export default function ReactPDFViewer({ url }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }'''

new_component = '''export default function ReactPDFViewer({ url }: PDFViewerProps) {
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
  }'''

content = content.replace(old_component, new_component)

old_toolbar = '''        <div className="flex items-center gap-2 md:gap-4">
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
        </div>'''

new_toolbar = '''        <div className="flex items-center gap-2 md:gap-4">
          <span className="text-sm font-medium text-[#B6C2D9]">
            {numPages ? `${numPages} Pages` : 'Loading...'}
          </span>
        </div>'''

content = content.replace(old_toolbar, new_toolbar)

old_viewer = '''      {/* Viewer */}
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
      </div>'''

new_viewer = '''      {/* Viewer */}
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
      </div>'''

content = content.replace(old_viewer, new_viewer)

with open('src/components/ui/ReactPDFViewer.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
