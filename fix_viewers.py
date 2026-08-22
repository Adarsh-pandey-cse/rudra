import re

with open('src/components/ui/FileViewer.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import at the top
content = content.replace(
    'import { createPortal } from \'react-dom\';',
    'import { createPortal } from \'react-dom\';\nimport ReactPDFViewer from \'./ReactPDFViewer\';'
)

# Replace the iframe for isPdf
content = re.sub(
    r'isPdf \? \(\s*<iframe\s*src=\{\"https://mozilla\.github\.io/pdf\.js/web/viewer\.html\?file=\" \+ encodeURIComponent\(url\)\}\s*className=\"w-full h-full border-0 bg-white rounded-xl\"\s*title=\{name\}\s*/>\s*\)',
    r'isPdf ? (\n            <ReactPDFViewer url={url} />\n          )',
    content
)

with open('src/components/ui/FileViewer.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open('src/components/ui/InlineFileViewer.tsx', 'r', encoding='utf-8') as f:
    content2 = f.read()

# Add import at the top
content2 = content2.replace(
    'import { motion } from \'framer-motion\';',
    'import { motion } from \'framer-motion\';\nimport ReactPDFViewer from \'./ReactPDFViewer\';'
)

# Replace the iframe for isPdf
content2 = re.sub(
    r'isPdf \? \(\s*<iframe\s*src=\{\"https://mozilla\.github\.io/pdf\.js/web/viewer\.html\?file=\" \+ encodeURIComponent\(url\)\}\s*className=\"w-full h-full border-0 bg-white rounded-xl\"\s*title=\{name\}\s*/>\s*\)',
    r'isPdf ? (\n            <ReactPDFViewer url={url} />\n          )',
    content2
)

with open('src/components/ui/InlineFileViewer.tsx', 'w', encoding='utf-8') as f:
    f.write(content2)
