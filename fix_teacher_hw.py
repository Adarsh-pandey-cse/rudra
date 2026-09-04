import re

with open("src/app/dashboard/teacher/homework/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace teacher filter
old_filter = """      const isPastDue = new Date(assignment.dueDate) < new Date();
      if (statusFilter === "all") matchesStatus = true;
      else if (statusFilter === "active") matchesStatus = assignment.status === "published" && !isPastDue;
      else if (statusFilter === "closed") matchesStatus = assignment.status === "published" && isPastDue;"""

new_filter = """      const isPastDue = new Date(assignment.dueDate) < new Date();
      if (statusFilter === "all") matchesStatus = true;
      else if (statusFilter === "active") matchesStatus = assignment.status === "published" && !assignment.isClosed;
      else if (statusFilter === "closed") matchesStatus = assignment.isClosed === true;"""

content = content.replace(old_filter, new_filter)

# Change default tab to 'all' instead of 'active'? Let's keep it 'all' to be safe since they said "are no visible"
content = content.replace('useState("active");', 'useState("all");')

with open("src/app/dashboard/teacher/homework/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
