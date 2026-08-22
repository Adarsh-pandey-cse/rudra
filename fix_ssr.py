import re

with open('src/components/ui/FileViewer.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'import ReactPDFViewer from \'./ReactPDFViewer\';',
    'import dynamic from "next/dynamic";\nconst ReactPDFViewer = dynamic(() => import("./ReactPDFViewer"), { ssr: false });'
)

with open('src/components/ui/FileViewer.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open('src/components/ui/InlineFileViewer.tsx', 'r', encoding='utf-8') as f:
    content2 = f.read()

content2 = content2.replace(
    'import ReactPDFViewer from \'./ReactPDFViewer\';',
    'import dynamic from "next/dynamic";\nconst ReactPDFViewer = dynamic(() => import("./ReactPDFViewer"), { ssr: false });'
)

with open('src/components/ui/InlineFileViewer.tsx', 'w', encoding='utf-8') as f:
    f.write(content2)
