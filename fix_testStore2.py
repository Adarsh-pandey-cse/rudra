import re

with open('src/store/testStore.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'import { collection, doc, setDoc, deleteDoc, onSnapshot, query, where, getDocs } from "firebase/firestore";',
    'import { collection, doc, setDoc, deleteDoc, onSnapshot, query, where, getDocs, updateDoc } from "firebase/firestore";'
)

content = content.replace(
    '      import("firebase/firestore").then(({ updateDoc, doc }) => {\n        updateDoc(doc(db, "test_marks", id), { marks });\n      });',
    '      await updateDoc(doc(db, "test_marks", id), { marks });'
)

with open('src/store/testStore.ts', 'w', encoding='utf-8') as f:
    f.write(content)
