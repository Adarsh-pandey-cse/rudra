import re

with open("src/app/dashboard/teacher/chat/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add getAllUsers to destructuring
content = content.replace(
    'const { currentUser, users } = useAuthStore();',
    'const { currentUser, users, getAllUsers } = useAuthStore();'
)

# Add useEffect to fetch users
injection = """
  useEffect(() => {
    getAllUsers();
  }, [getAllUsers]);

"""

if "getAllUsers()" not in content:
    content = content.replace('const [search, setSearch] = useState("");', 'const [search, setSearch] = useState("");\n' + injection)

with open("src/app/dashboard/teacher/chat/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
