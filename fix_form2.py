import re

with open("src/app/dashboard/teacher/students/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

new_grid = """<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm text-[#B6C2D9] mb-1">Full Name</label>
                        <input type="text" required value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-sm text-[#B6C2D9] mb-1">Username (Email)</label>
                        <input type="email" required value={editUsername} onChange={e => setEditUsername(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-sm text-[#B6C2D9] mb-1">Password</label>
                        <input type="text" value={editPassword} onChange={e => setEditPassword(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors" placeholder="Leave unchanged or type new password" />
                      </div>
                      <div>
                        <label className="block text-sm text-[#B6C2D9] mb-1">Class / Grade</label>
                        <input type="text" required value={editClassId} onChange={e => setEditClassId(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-sm text-[#B6C2D9] mb-1">Gender</label>
                        <select value={editGender} onChange={e => setEditGender(e.target.value as any)} className="w-full bg-[#131D2E] border border-white/[0.08] rounded-xl px-4 py-2 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors appearance-none">
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-[#B6C2D9] mb-1">Father's Name</label>
                        <input type="text" value={editFatherName} onChange={e => setEditFatherName(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors" placeholder="e.g. Ramesh Kumar" />
                      </div>
                      <div>
                        <label className="block text-sm text-[#B6C2D9] mb-1">Monthly Fee (₹)</label>
                        <input type="number" required value={editMonthlyFee} onChange={e => setEditMonthlyFee(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors" />
                      </div>
                    </div>"""

content = re.sub(r'<div className="grid grid-cols-1 md:grid-cols-3 gap-4">.*?</div>\s*<div className="flex justify-end gap-3 pt-2">', new_grid + '\n                    <div className="flex justify-end gap-3 pt-2">', content, flags=re.DOTALL)

with open("src/app/dashboard/teacher/students/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
