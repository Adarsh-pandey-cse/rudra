import re

with open("src/app/dashboard/teacher/homework/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    '<button className="text-xs font-bold bg-gradient-to-r from-[#5B5CFF]/10 to-[#5B5CFF]/5 hover:from-[#5B5CFF]/20 hover:to-[#5B5CFF]/10 text-[#5B5CFF] px-3 py-2 rounded-lg border border-[#5B5CFF]/20 hover:border-[#5B5CFF]/50 transition-all shadow-[0_0_15px_rgba(91,92,255,0.1)]">\n                            View Submissions\n                          </button>',
    '<button onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/teacher/homework/analytics/${assignment.id}`); }} className="text-xs font-bold bg-gradient-to-r from-[#5B5CFF]/10 to-[#5B5CFF]/5 hover:from-[#5B5CFF]/20 hover:to-[#5B5CFF]/10 text-[#5B5CFF] px-3 py-2 rounded-lg border border-[#5B5CFF]/20 hover:border-[#5B5CFF]/50 transition-all shadow-[0_0_15px_rgba(91,92,255,0.1)]">\n                            View Submissions\n                          </button>'
)

with open("src/app/dashboard/teacher/homework/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
