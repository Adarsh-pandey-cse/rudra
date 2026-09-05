import re

with open("src/app/dashboard/teacher/homework/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update default state
content = content.replace(
    'const [statusFilter, setStatusFilter] = useState("all");',
    'const [statusFilter, setStatusFilter] = useState("active");'
)

# 2. Update class badge
old_class_badge = """                    {assignment.classId && (
                      <span className="px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-white/[0.04] text-[#7B8798] border border-white/[0.05]">
                        {assignment.classId.replace("class-", "Class ")}
                      </span>
                    )}"""

new_class_badge = """                    {assignment.classId && (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase bg-gradient-to-r from-[#EAB308]/20 to-[#EAB308]/10 text-[#EAB308] border border-[#EAB308]/30 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                        {assignment.classId.replace("class-", "Class ")}
                      </span>
                    )}"""

content = content.replace(old_class_badge, new_class_badge)

# 3. Rewrite bottom row
old_bottom_row_pattern = r'\{/\* Bottom Row: Date and Submissions \*/\}.*?(?=</motion\.div>)'
new_bottom_row = """{/* Bottom Row: Dates, Timers, and View Submissions */}
                    <div className="pt-3 border-t border-white/[0.06] flex flex-col gap-3">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[#7B8798] font-medium text-[10px] uppercase tracking-wider">Published</span>
                          <span className="text-[#B6C2D9] font-semibold flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#5B5CFF]" />
                            {new Date(assignment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>

                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-[#7B8798] font-medium text-[10px] uppercase tracking-wider">Time Left</span>
                          {(() => {
                             const now = new Date();
                             const due = new Date(assignment.dueDate);
                             const diff = due.getTime() - now.getTime();
                             if (diff < 0) {
                                return <span className="text-[#EF4444] font-bold bg-[#EF4444]/10 px-2 py-0.5 rounded-full border border-[#EF4444]/20 shadow-[0_0_8px_rgba(239,68,68,0.15)]">Expired</span>;
                             }
                             const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                             const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                             const minutes = Math.floor((diff / 1000 / 60) % 60);
                             const timeString = days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`;
                             return <span className="text-[#EAB308] font-bold bg-gradient-to-r from-[#EAB308]/20 to-[#F59E0B]/10 px-2 py-0.5 rounded-full border border-[#EAB308]/30 shadow-[0_0_8px_rgba(234,179,8,0.15)]">⏳ {timeString}</span>;
                          })()}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1 pt-3 border-t border-white/[0.03]">
                         {(() => {
                            const total = ((assignment as any).assignedTo || (assignment as any).recipientStudentIds || []).length;
                            const subs = getAssignmentSubmissions(assignment.id).length;
                            const pending = Math.max(0, total - subs);
                            return (
                              <div className="flex items-center gap-3">
                                 <div className="flex flex-col">
                                   <span className="text-[10px] text-[#7B8798] uppercase tracking-wider font-semibold">Submitted</span>
                                   <span className="text-xs font-bold text-[#22C55E] flex items-center gap-1"><Users className="w-3 h-3" /> {subs}</span>
                                 </div>
                                 <div className="w-[1px] h-6 bg-white/10"></div>
                                 <div className="flex flex-col">
                                   <span className="text-[10px] text-[#7B8798] uppercase tracking-wider font-semibold">Pending</span>
                                   <span className="text-xs font-bold text-[#F59E0B] flex items-center gap-1">{pending}</span>
                                 </div>
                              </div>
                            );
                         })()}
                         <button className="text-xs font-bold bg-gradient-to-r from-[#5B5CFF]/10 to-[#5B5CFF]/5 hover:from-[#5B5CFF]/20 hover:to-[#5B5CFF]/10 text-[#5B5CFF] px-3 py-2 rounded-lg border border-[#5B5CFF]/20 hover:border-[#5B5CFF]/50 transition-all shadow-[0_0_15px_rgba(91,92,255,0.1)]">
                            View Submissions
                         </button>
                      </div>
                    </div>
                  """
content = re.sub(old_bottom_row_pattern, new_bottom_row, content, flags=re.DOTALL)

with open("src/app/dashboard/teacher/homework/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
