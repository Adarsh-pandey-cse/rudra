import re

# FIX DOUBT LIST MOBILE WRAP
with open("src/app/dashboard/teacher/doubts/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    '<div className="flex gap-2">',
    '<div className="flex flex-wrap gap-2 items-center justify-start sm:justify-end">'
)

with open("src/app/dashboard/teacher/doubts/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)


# FIX DOUBT CHAT HEADER RATING
with open("src/app/dashboard/teacher/doubts/[id]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_header_badges = '''            <div className="flex items-center gap-2 shrink-0">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${status.color} ${status.bg}`}>
                {status.label}
              </span>'''

new_header_badges = '''            <div className="flex items-center gap-2 shrink-0">
              {doubt.status === "resolved" && doubt.studentRating && (
                <div className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-[#FBBF24]/20 to-[#B45309]/30 border border-[#FBBF24]/40 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                  <Star className="w-3.5 h-3.5 fill-[#FBBF24] text-[#FBBF24] drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
                  <span className="text-[#FBBF24] text-[10px] font-extrabold tracking-[0.15em] uppercase font-serif drop-shadow-sm">
                    {doubt.studentRating / 2} Rated
                  </span>
                </div>
              )}
              {doubt.status === "resolved" && doubt.studentRating && (
                <div className="sm:hidden flex items-center gap-1 bg-gradient-to-r from-[#FBBF24]/20 to-[#B45309]/30 border border-[#FBBF24]/40 px-2 py-0.5 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                  <Star className="w-3 h-3 fill-[#FBBF24] text-[#FBBF24]" />
                  <span className="text-[#FBBF24] text-[9px] font-extrabold uppercase font-serif drop-shadow-sm">
                    {doubt.studentRating / 2}
                  </span>
                </div>
              )}
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${status.color} ${status.bg}`}>
                {status.label}
              </span>'''

content = content.replace(old_header_badges, new_header_badges)

with open("src/app/dashboard/teacher/doubts/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
