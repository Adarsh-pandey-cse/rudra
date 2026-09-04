import re

with open("src/store/homeworkStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Fix duplicate grading points bug
old_emit = """        if (status === "accepted") {
          setTimeout(() => {
            eventBus.emit({
              type: 'HOMEWORK_GRADED',"""

new_emit = """        if (status === "accepted" && sub.status !== "accepted") {
          setTimeout(() => {
            eventBus.emit({
              type: 'HOMEWORK_GRADED',"""

content = content.replace(old_emit, new_emit)

with open("src/store/homeworkStore.ts", "w", encoding="utf-8") as f:
    f.write(content)
