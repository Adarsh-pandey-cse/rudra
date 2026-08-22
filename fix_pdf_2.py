import re

def fix_pdf_viewer(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix the double braces
    content = content.replace(
        'src={{"https://mozilla.github.io/pdf.js/web/viewer.html?file=" + encodeURIComponent(url)}}',
        'src={"https://mozilla.github.io/pdf.js/web/viewer.html?file=" + encodeURIComponent(url)}'
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_pdf_viewer('src/components/ui/FileViewer.tsx')
fix_pdf_viewer('src/components/ui/InlineFileViewer.tsx')
