import re

def update_pdf_viewer(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the iframe for PDF and replace its src
    content = re.sub(
        r'(isPdf \?\s*\(\s*<iframe\s*src=\{)url(\}\s*className="w-full h-full)',
        r'\1{"https://mozilla.github.io/pdf.js/web/viewer.html?file=" + encodeURIComponent(url)}\2',
        content
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_pdf_viewer('src/components/ui/FileViewer.tsx')
update_pdf_viewer('src/components/ui/InlineFileViewer.tsx')

print("Replaced successfully")
