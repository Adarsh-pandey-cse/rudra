import re

with open("src/store/authStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Replace all the duplicate nonsense with a clean single import
content = re.sub(
    r'import \{[^}]+\} from "firebase/firestore";',
    'import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, query, where, getDocs } from "firebase/firestore";',
    content,
    count=1
)

with open("src/store/authStore.ts", "w", encoding="utf-8") as f:
    f.write(content)
