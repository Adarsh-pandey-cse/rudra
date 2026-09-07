sub = { "maxMarks": 0, "teacherGrade": None, "status": "submitted" }
assignment = None

def validateGrade(grade, maxMarks):
    if grade < 0:
        return {"valid": False, "error": "Grade cannot be negative"}
    if grade > maxMarks:
        return {"valid": False, "error": f"Grade cannot exceed max marks ({maxMarks})"}
    return {"valid": True}

grade = 19
maxMarks = sub.get("maxMarks") or (assignment.get("maxMarks") if assignment else None) or 20
print(f"Max Marks resolved to: {maxMarks}")
print(validateGrade(grade, maxMarks))
