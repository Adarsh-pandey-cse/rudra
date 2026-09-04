import re

with open("src/app/dashboard/teacher/homework/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update initial state and tabs list
content = content.replace('useState("all");', 'useState("active");')
content = content.replace('["all", "active", "closed", "draft", "scheduled"]', '["active", "all", "closed", "draft", "scheduled"]')

# 2. Fix the sorting logic to be numeric for classId
old_sort = """    }).sort((a, b) => {
      if (a.classId !== b.classId) return a.classId.localeCompare(b.classId);
      return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    });"""

new_sort = """    }).sort((a, b) => {
      const parseClass = (c) => {
        if (!c) return 0;
        const num = parseInt(c.replace(/[^0-9]/g, ''));
        return isNaN(num) ? c : num;
      };
      const cA = parseClass(a.classId);
      const cB = parseClass(b.classId);
      if (cA !== cB) {
        if (typeof cA === 'number' && typeof cB === 'number') return cA - cB;
        if (typeof cA === 'number') return 1;
        if (typeof cB === 'number') return -1;
        return String(cA).localeCompare(String(cB));
      }
      return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    });"""
content = content.replace(old_sort, new_sort)

# 3. Update the UI for Class badge to be more visible
old_class_badge = """                      {assignment.classId && (
                        <span className="px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-white/[0.04] text-[#7B8798] border border-white/[0.05]">
                          {assignment.classId.replace("class-", "Class ")}
                        </span>
                      )}"""

new_class_badge = """                      {assignment.classId && (
                        <span className="px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#EAB308]/15 text-[#EAB308] border border-[#EAB308]/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                          {assignment.classId.replace("class-", "Class ")}
                        </span>
                      )}"""
content = content.replace(old_class_badge, new_class_badge)

# 4. Update the date section to show Assigned date
old_date = """                    {/* Bottom Row: Date and Submissions */}
                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-[#7B8798]">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className={cn("font-medium", new Date(assignment.dueDate) < new Date() ? 'text-[#EF4444]' : '', (assignment as any).isExtended ? 'text-[#F59E0B]' : '')}>
                          {new Date(assignment.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>"""

new_date = """                    {/* Bottom Row: Date and Submissions */}
                    <div className="pt-3 border-t border-white/[0.06] flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[11px] text-[#7B8798] uppercase tracking-wider font-semibold">
                        <span>Assigned: {assignment.createdAt ? new Date(assignment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-'}</span>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className={cn("font-bold uppercase", new Date(assignment.dueDate) < new Date() ? 'text-[#EF4444]' : 'text-[#22C55E]', (assignment as any).isExtended ? 'text-[#F59E0B]' : '')}>
                            Due: {new Date(assignment.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1.5 text-xs text-[#B6C2D9]">
                          <span className="font-semibold text-white">Status:</span>
                          <span className="capitalize">{assignment.status}</span>
                        </div>"""
                        
# Also need to adjust the closing div because of the flex layout change
old_subs = """                      <div className="flex items-center gap-1.5 text-xs text-[#7B8798]">
                        <Users className="w-3.5 h-3.5 text-[#B6C2D9]" />
                        <span className="font-bold text-[#B6C2D9]">{getAssignmentSubmissions(assignment.id).length}</span>
                        <span className="text-white/[0.3]">/</span>
                        <span>{((assignment as any).assignedTo || (assignment as any).recipientStudentIds || []).length}</span>
                      </div>
                    </div>"""

new_subs = """                      <div className="flex items-center gap-1.5 text-xs text-[#7B8798] bg-white/[0.04] px-2 py-1 rounded-md">
                        <Users className="w-3.5 h-3.5 text-[#B6C2D9]" />
                        <span className="font-bold text-[#B6C2D9]">{getAssignmentSubmissions(assignment.id).length}</span>
                        <span className="text-white/[0.3]">/</span>
                        <span>{((assignment as any).assignedTo || (assignment as any).recipientStudentIds || []).length}</span>
                      </div>
                      </div>
                    </div>"""

content = content.replace(old_date, new_date).replace(old_subs, new_subs)


with open("src/app/dashboard/teacher/homework/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
