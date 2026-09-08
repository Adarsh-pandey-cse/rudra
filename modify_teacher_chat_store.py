import re

with open("src/app/dashboard/teacher/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_replace = """import { useHomeworkStore } from "@/store/homeworkStore";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";"""
content = content.replace("""import { useHomeworkStore } from "@/store/homeworkStore";
import { useAuthStore } from "@/store/authStore";""", import_replace)

function_replace = """export default function TeacherDashboard() {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const chatUnread = useChatStore(state => state.unreadTotal);"""
content = content.replace("""export default function TeacherDashboard() {
  const router = useRouter();
  const { currentUser } = useAuthStore();""", function_replace)

with open("src/app/dashboard/teacher/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
