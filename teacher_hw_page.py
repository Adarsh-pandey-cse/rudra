import re

with open("src/app/dashboard/teacher/homework/analytics/[id]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Make sure toggleAssignmentStatus is imported
if "toggleAssignmentStatus" not in content:
    content = content.replace(
        'const { getAssignment, getAssignmentSubmissions, teacherReview } = useHomeworkStore();',
        'const { getAssignment, getAssignmentSubmissions, teacherReview, toggleAssignmentStatus } = useHomeworkStore();'
    )

# Insert handleToggleStatus
handle_toggle_func = """  const handleToggleStatus = async () => {
    if (!homework) return;
    try {
      await toggleAssignmentStatus(homework.id, !homework.isClosed);
      // Wait a moment for store to update, or mutate locally if needed, but Zustand updates reactively
    } catch (e) {
      console.error(e);
    }
  };"""

if "handleToggleStatus" not in content:
    # Insert it before handleRemind
    content = content.replace('  const handleRemind = async (studentId: string, studentName: string) => {', handle_toggle_func + '\n\n  const handleRemind = async (studentId: string, studentName: string) => {')

# Add the button
old_buttons = """          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-white/[0.08]">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2.5 py-1 bg-[#5B5CFF]/10 text-[#5B5CFF] rounded-lg text-xs font-semibold uppercase tracking-wider">
                  {homework.subjectId}
                </span>
                <span className="px-2.5 py-1 bg-[#EAB308]/10 text-[#EAB308] rounded-lg text-xs font-semibold uppercase tracking-wider">
                  Class {homework.classId}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">{homework.title}</h1>
              <div className="flex items-center gap-4 text-sm text-[#7B8798]">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Due {new Date(homework.dueDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {homework.recipientStudentIds.length} Students
                </div>
              </div>
            </div>
  
            <div className="flex items-center gap-3">
              <GlassButton onClick={() => router.push(`/dashboard/teacher/homework/edit/${homework.id}`)}>
                Edit Assignment
              </GlassButton>
            </div>"""

new_buttons = """          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-white/[0.08]">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2.5 py-1 bg-[#5B5CFF]/10 text-[#5B5CFF] rounded-lg text-xs font-semibold uppercase tracking-wider">
                  {homework.subjectId}
                </span>
                <span className="px-2.5 py-1 bg-[#EAB308]/10 text-[#EAB308] rounded-lg text-xs font-semibold uppercase tracking-wider">
                  Class {homework.classId}
                </span>
                {homework.isClosed && (
                  <span className="px-2.5 py-1 bg-red-500/10 text-red-500 rounded-lg text-xs font-semibold uppercase tracking-wider">
                    Closed
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">{homework.title}</h1>
              <div className="flex items-center gap-4 text-sm text-[#7B8798]">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Due {new Date(homework.dueDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {homework.recipientStudentIds.length} Students
                </div>
              </div>
            </div>
  
            <div className="flex items-center gap-3">
              <GlassButton onClick={handleToggleStatus} className={homework.isClosed ? "text-green-400" : "text-red-400"}>
                {homework.isClosed ? "Reopen Submission" : "Close Submission"}
              </GlassButton>
              <GlassButton onClick={() => router.push(`/dashboard/teacher/homework/edit/${homework.id}`)}>
                Edit Assignment
              </GlassButton>
            </div>"""

content = content.replace(old_buttons, new_buttons)

with open("src/app/dashboard/teacher/homework/analytics/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
