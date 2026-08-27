import re

with open("src/app/dashboard/teacher/students/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Make sure success popup state exists
if "const [successMessage, setSuccessMessage] = useState" not in content:
    content = content.replace(
        'const [editError, setEditError] = useState("");',
        'const [editError, setEditError] = useState("");\n  const [successMessage, setSuccessMessage] = useState("");'
    )

# Fix the handleUpdate logic to show success message and correctly handle fee updates!
if "setSuccessMessage" not in content.split("handleUpdate =")[1]:
    content = re.sub(
        r'setEditingStudentId\(null\);\s*};',
        'setEditingStudentId(null);\n    setSuccessMessage(`${editName} details updated successfully!`);\n    setTimeout(() => setSuccessMessage(""), 3000);\n  };',
        content
    )

# Now completely replace the Edit Modal AnimatePresence block
old_modal_pattern = r'\{\/\* Edit Modal \*\/\}.*?<AnimatePresence>\s*\{editingStudentId && \(\s*<motion\.div[^>]*>.*?<\/form>\s*<\/GlassCard>\s*<\/motion\.div>\s*\)\}\s*<\/AnimatePresence>'

new_modal = """{/* Edit Modal */}
        <AnimatePresence>
          {editingStudentId && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl relative"
              >
                <GlassCard className="p-6 md:p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Edit Student Details</h2>
                    <button onClick={() => setEditingStudentId(null)} className="text-[#7B8798] hover:text-white transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  {editError && (
                    <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl flex items-center gap-2 text-[#EF4444] text-sm">
                      <AlertCircle className="w-4 h-4" /> {editError}
                    </div>
                  )}
                  <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm text-[#B6C2D9] mb-1">Full Name</label>
                          <input type="text" required value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors" />
                        </div>
                        <div>
                          <label className="block text-sm text-[#B6C2D9] mb-1">Username (Email)</label>
                          <input type="text" required value={editUsername} onChange={e => setEditUsername(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors" />
                        </div>
                        <div>
                          <label className="block text-sm text-[#B6C2D9] mb-1">Password</label>
                          <input type="text" value={editPassword} onChange={e => setEditPassword(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors" placeholder="Leave unchanged or type new password" />
                        </div>
                        <div>
                          <label className="block text-sm text-[#B6C2D9] mb-1">Class / Grade</label>
                          <select value={editClassId.replace('class-', '')} onChange={e => setEditClassId(e.target.value)} className="w-full bg-[#131D2E] border border-white/[0.08] rounded-xl px-4 py-2 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors appearance-none">
                              {["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"].map((g) => (
                                <option key={g} value={g}>Class {g}</option>
                              ))}
                            </select>
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
                      </div>
                      <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
                      <GlassButton type="button" onClick={() => setEditingStudentId(null)}>Cancel</GlassButton>
                      <GradientButton type="submit">Save Changes</GradientButton>
                    </div>
                  </form>
                </GlassCard>
              </motion.div>
            </div>
          )}
        </AnimatePresence>"""

content = re.sub(old_modal_pattern, new_modal, content, flags=re.DOTALL)

# Add Success Popup
if "Success Popup" not in content:
    success_toast = """        {/* Success Popup */}
        <AnimatePresence>
          {successMessage && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200]">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] px-6 py-3 rounded-full flex items-center gap-3 backdrop-blur-md shadow-[0_0_20px_rgba(34,197,94,0.2)]"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium text-sm">{successMessage}</span>
              </motion.div>
            </div>
          )}
        </AnimatePresence>"""
    
    content = content.replace("        {/* Search & Tabs */}", success_toast + "\n\n        {/* Search & Tabs */}")
    # Also check if it's named something else
    content = content.replace('        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">', success_toast + '\n\n        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">')

with open("src/app/dashboard/teacher/students/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
