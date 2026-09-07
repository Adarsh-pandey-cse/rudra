import re

with open("src/store/homeworkStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

# For teacherReview
pattern_teacher = re.compile(r'type:\s*\'HOMEWORK_GRADED\',\s*payload:\s*\{([^}]+)\}', re.DOTALL)

def replacer_teacher(match):
    inner = match.group(1)
    if "previousGrade" not in inner:
        # Check if it's the teacher review one
        if "teacherId: currentTeacherId" in inner:
            inner += ",\n                   previousGrade: sub.teacherGrade !== undefined && sub.teacherGrade !== null ? sub.teacherGrade : (sub.status === 'ai_evaluated' && sub.aiEvaluation ? sub.aiEvaluation.score : null)"
        elif "teacherId: 'system'" in inner:
            if "existing" in inner:
                inner += ",\n                  previousGrade: existing.teacherGrade !== undefined && existing.teacherGrade !== null ? existing.teacherGrade : (existing.status === 'ai_evaluated' && existing.aiEvaluation ? existing.aiEvaluation.score : null)"
            else:
                inner += ",\n                  previousGrade: null"
    return f"type: 'HOMEWORK_GRADED',\n                 payload: {{{inner}}}"

content = pattern_teacher.sub(replacer_teacher, content)

with open("src/store/homeworkStore.ts", "w", encoding="utf-8") as f:
    f.write(content)
