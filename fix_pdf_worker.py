import re

with open('src/components/ui/ReactPDFViewer.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;',
    '''pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();'''
)

with open('src/components/ui/ReactPDFViewer.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
