import re

with open("src/store/authStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Add missing imports
old_import = 'import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, query, where } from "firebase/firestore";'
new_import = 'import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, query, where, getDocs } from "firebase/firestore";'

if old_import in content:
    content = content.replace(old_import, new_import)
else:
    # Just replace "import { doc, getDoc" if the string isn't exactly matching
    content = re.sub(r'import \{ ([^}]+) \} from "firebase/firestore";', 
                     lambda m: f'import {{ {m.group(1)}, getDocs, query, where }} from "firebase/firestore";' if 'getDocs' not in m.group(1) else m.group(0), 
                     content)

with open("src/store/authStore.ts", "w", encoding="utf-8") as f:
    f.write(content)
