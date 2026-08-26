import re

with open("src/app/dashboard/teacher/students/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# For desktop view
content = re.sub(
    r'(<div className="text-sm font-semibold text-white group-hover:text-\[#5B5CFF\] transition-colors">\{s\.name\}</div>)',
    r'\1\n                                      {(s as any).fatherName && <div className="text-[11px] text-[#7B8798] mt-0.5">S/O {(s as any).fatherName}</div>}',
    content
)

# For mobile view
content = re.sub(
    r'(<div className="text-sm font-bold text-white mb-0\.5">\{s\.name\}</div>)',
    r'\1\n                                      {(s as any).fatherName && <div className="text-[11px] text-[#7B8798] mb-0.5">S/O {(s as any).fatherName}</div>}',
    content
)

with open("src/app/dashboard/teacher/students/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
