import re

with open("src/app/dashboard/student/homework/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('useState("All");', 'useState("Pending");')
content = content.replace('["All", "Pending", "Missed", "Submitted", "Graded"]', '["Pending", "All", "Missed", "Submitted", "Graded"]')

# Let's fix the date UI on the card.
old_date = """                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/[0.06]">
                            {dueStatus ? (
                              <div className={cn("flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md bg-white/[0.04]", dueStatus.color)}>
                                <Clock className="w-3.5 h-3.5" />
                                <span>{dueStatus.label}</span>
                              </div>
                            ) : (
                              <div className="text-[#7B8798] text-xs capitalize">{getComputedStatus(hw.id).replace("_", " ")}</div>
                            )}
                            <span className="text-[#7B8798] text-xs">{hw.difficulty}</span>
                          </div>"""

new_date = """                          <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-white/[0.06]">
                            <div className="flex items-center justify-between text-[11px] text-[#7B8798] uppercase tracking-wider font-semibold">
                              <span>Assigned: {hw.createdAt ? new Date(hw.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-'}</span>
                              <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04]", dueStatus ? dueStatus.color : 'text-[#7B8798]')}>
                                <Clock className="w-3 h-3" />
                                <span>{dueStatus ? dueStatus.label : 'Due: ' + new Date(hw.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[#B6C2D9] text-xs capitalize font-medium">Status: {getComputedStatus(hw.id).replace("_", " ")}</span>
                              <span className="text-[#7B8798] text-xs bg-white/[0.04] px-2 py-1 rounded-md">{hw.difficulty}</span>
                            </div>
                          </div>"""
content = content.replace(old_date, new_date)

with open("src/app/dashboard/student/homework/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
