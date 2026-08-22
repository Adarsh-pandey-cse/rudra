import re

with open('src/store/testStore.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '"Scored ${data.marks}/ in Offline Test"',
    '`Scored ${data.marks}/20 in Offline Test`'
)

with open('src/store/testStore.ts', 'w', encoding='utf-8') as f:
    f.write(content)
