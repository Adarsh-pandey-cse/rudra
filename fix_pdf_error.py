import re

with open('src/components/ui/ReactPDFViewer.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Make the URL explicitly HTTPS
content = content.replace(
    '`//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`',
    '`https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`'
)

# Add error state to show the actual error message
old_error = '''          error={
            <div className="flex flex-col items-center justify-center h-64 text-red-400">
              <p>Failed to load PDF document.</p>
            </div>
          }'''

new_error = '''          error={(error: Error) => (
            <div className="flex flex-col items-center justify-center h-64 text-red-400 px-6 text-center">
              <p className="font-bold mb-2">Failed to load PDF document.</p>
              <p className="text-xs text-red-300 break-all bg-red-900/20 p-2 rounded">{error.message}</p>
              <p className="text-[10px] text-white/40 mt-4 break-all">URL: {url.substring(0, 50)}...</p>
            </div>
          )}'''
content = content.replace(old_error, new_error)

with open('src/components/ui/ReactPDFViewer.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
