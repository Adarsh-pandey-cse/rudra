import re

with open("src/app/dashboard/student/homework/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Pattern to replace bottom row
old_bottom_row_pattern = r'<div className="mt-auto pt-4 flex items-center justify-between text-\[13px\]">.*?(?=<div className="flex items-center gap-2 mt-3">|\{getComputedStatus\(hw\.id\) === "missed" &&)'

new_bottom_row = """{/* Bottom Row: Dates, Timers */}
                        <div className="mt-auto pt-4 border-t border-white/[0.06] flex flex-col gap-3">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[#7B8798] font-medium text-[10px] uppercase tracking-wider">Published</span>
                              <span className="text-[#B6C2D9] font-semibold flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-[#5B5CFF]" />
                                {new Date(hw.createdAt || new Date()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>

                            <div className="flex flex-col items-end gap-0.5">
                              <span className="text-[#7B8798] font-medium text-[10px] uppercase tracking-wider">Status</span>
                              {(() => {
                                 const status = getComputedStatus(hw.id);
                                 if (status === "missed") {
                                    return <span className="text-[#EF4444] font-bold bg-[#EF4444]/10 px-2 py-0.5 rounded-full border border-[#EF4444]/20 shadow-[0_0_8px_rgba(239,68,68,0.15)]">Missed</span>;
                                 }
                                 if (status !== "pending" && status !== "draft" && status !== "resubmission_requested") {
                                    return <span className="text-[#22C55E] font-bold bg-[#22C55E]/10 px-2 py-0.5 rounded-full border border-[#22C55E]/20 shadow-[0_0_8px_rgba(34,197,94,0.15)]">Submitted</span>;
                                 }
                                 const now = new Date();
                                 const due = new Date(hw.dueDate);
                                 const diff = due.getTime() - now.getTime();
                                 if (diff < 0) {
                                    return <span className="text-[#EF4444] font-bold bg-[#EF4444]/10 px-2 py-0.5 rounded-full border border-[#EF4444]/20 shadow-[0_0_8px_rgba(239,68,68,0.15)]">Overdue</span>;
                                 }
                                 const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                 const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                                 const minutes = Math.floor((diff / 1000 / 60) % 60);
                                 const timeString = days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`;
                                 return <span className="text-[#EAB308] font-bold bg-gradient-to-r from-[#EAB308]/20 to-[#F59E0B]/10 px-2 py-0.5 rounded-full border border-[#EAB308]/30 shadow-[0_0_8px_rgba(234,179,8,0.15)]">⏳ {timeString}</span>;
                              })()}
                            </div>
                          </div>
                        </div>
                        """

# Find the start index of the old block
start_idx = content.find('<div className="mt-auto pt-4 flex items-center justify-between text-[13px]">')

# Find the end by looking for '{(() => {' which starts the next block
end_idx = content.find('{(() => {', start_idx)

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_bottom_row + content[end_idx:]

with open("src/app/dashboard/student/homework/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
