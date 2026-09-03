import re

with open("src/app/dashboard/student/homework/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

new_get_computed_status = """    const getComputedStatus = (hwId: string) => {
      const sub = getSubmission(hwId, currentUser.id);
      if (sub) {
        if (["teacher_reviewed", "ai_evaluated", "accepted"].includes(sub.status)) return "graded";
        if (["submitted", "resubmitted", "ai_evaluating", "under_review", "late"].includes(sub.status)) return "submitted";
        if (sub.status === "rejected") return "rejected";
        if (sub.status === "resubmission_requested") return "resubmit";
      }
      
      const hw = allHomework.find(h => h.id === hwId);
      if (hw && new Date(hw.dueDate).getTime() < new Date().getTime()) return "missed";
      
      return sub ? sub.status : "pending";
    };"""

content = re.sub(
    r'const getComputedStatus = \(hwId: string\) => \{.*?return sub \? sub\.status : "pending";\n    \};',
    new_get_computed_status,
    content,
    flags=re.DOTALL
)

# Fix displayHomework filter
new_display_homework = """    const displayHomework = allHomework.filter(hw => {
      const status = getComputedStatus(hw.id);
      if (activeTab === "All") return true;
      if (activeTab === "Pending") return status === "pending" || status === "draft";
      if (activeTab === "Missed") return status === "missed";
      if (activeTab === "Submitted") return status === "submitted";
      if (activeTab === "Graded") return status === "graded" || status === "rejected" || status === "resubmit";
      return status.toLowerCase() === activeTab.toLowerCase();
    }).sort((a, b) => {"""

content = re.sub(
    r'const displayHomework = allHomework\.filter\(hw => \{.*?\n    \}\)\.sort\(\(a, b\) => \{',
    new_display_homework,
    content,
    flags=re.DOTALL
)

# Fix border color logic
old_border = """(getComputedStatus(hw.id) === "teacher_reviewed" || getComputedStatus(hw.id) === "ai_evaluated" || getComputedStatus(hw.id) === "accepted") ? "border-l-[#22C55E]" :
                            (getComputedStatus(hw.id) === "rejected" || getComputedStatus(hw.id) === "missed" || isOverdue) ? "border-l-[#EF4444]" :
                            getComputedStatus(hw.id) === "resubmission_requested" ? "border-l-[#EAB308]" :
                            getComputedStatus(hw.id) === "submitted" ? "border-l-[#4F9DFF]" :
                            "border-l-[#5B5CFF]\""""

new_border = """getComputedStatus(hw.id) === "graded" ? "border-l-[#22C55E]" :
                            (getComputedStatus(hw.id) === "rejected" || getComputedStatus(hw.id) === "missed" || isOverdue) ? "border-l-[#EF4444]" :
                            getComputedStatus(hw.id) === "resubmit" ? "border-l-[#EAB308]" :
                            getComputedStatus(hw.id) === "submitted" ? "border-l-[#4F9DFF]" :
                            "border-l-[#5B5CFF]\""""

content = content.replace(old_border, new_border)

# Fix badge logic
old_badge = """(getComputedStatus(hw.id) === "teacher_reviewed" || getComputedStatus(hw.id) === "ai_evaluated" || getComputedStatus(hw.id) === "accepted") ? "success" :
                                getComputedStatus(hw.id) === "submitted" ? "info" :
                                (getComputedStatus(hw.id) === "rejected" || getComputedStatus(hw.id) === "missed" || isOverdue) ? "error" :
                                "warning\""""

new_badge = """getComputedStatus(hw.id) === "graded" ? "success" :
                                getComputedStatus(hw.id) === "submitted" ? "info" :
                                (getComputedStatus(hw.id) === "rejected" || getComputedStatus(hw.id) === "missed" || isOverdue) ? "error" :
                                "warning\""""

content = content.replace(old_badge, new_badge)


with open("src/app/dashboard/student/homework/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
