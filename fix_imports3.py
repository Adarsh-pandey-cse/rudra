import re

with open("src/store/authStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, query, where, getDocs } from "firebase/firestore";',
    'import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, onSnapshot, query, where, getDocs } from "firebase/firestore";'
)

with open("src/store/authStore.ts", "w", encoding="utf-8") as f:
    f.write(content)
