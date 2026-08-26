import re

with open("src/lib/firebase/firebase.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'await navigator.serviceWorker.register(swUrl);',
    'await navigator.serviceWorker.register(swUrl, { updateViaCache: "none" }).then(reg => { reg.update(); return reg; });'
)

with open("src/lib/firebase/firebase.ts", "w", encoding="utf-8") as f:
    f.write(content)
