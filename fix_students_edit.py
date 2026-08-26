import re

with open("src/app/dashboard/teacher/students/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add state variables for edit
state_old = '''  // Edit form state
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editError, setEditError] = useState("");'''

state_new = '''  // Edit form state
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editClassId, setEditClassId] = useState("");
  const [editFatherName, setEditFatherName] = useState("");
  const [editMonthlyFee, setEditMonthlyFee] = useState("");
  const [editError, setEditError] = useState("");'''

if 'const [editClassId, setEditClassId] = useState("");' not in content:
    content = content.replace(state_old, state_new)

# 2. Update startEditing
start_old = '''  const startEditing = (student: typeof students[0]) => {
    setEditingStudentId(student.id);
    setEditName(student.name);
    setEditUsername(student.username || "");
    setEditPassword("••••••••"); 
    setEditError("");
  };'''

start_new = '''  const startEditing = (student: typeof students[0]) => {
    const { feeProfiles } = useFeeStore.getState();
    const profile = feeProfiles.find(p => p.studentId === student.id);

    setEditingStudentId(student.id);
    setEditName(student.name);
    setEditUsername(student.username || "");
    setEditPassword("••••••••"); 
    setEditClassId((student as any).classId || (student as any).grade || "6th");
    setEditFatherName((student as any).fatherName || "");
    setEditMonthlyFee(profile?.monthlyFee?.toString() || "5000");
    setEditError("");
  };'''

if 'const { feeProfiles } = useFeeStore.getState();' not in content:
    content = content.replace(start_old, start_new)

# 3. Update handleUpdate
update_old = '''    // First update the name and email
    const res = await updateStudent(editingStudentId, editName, editUsername);
    if (!res.success) {
      setEditError(res.error || "Failed to update profile");
      return;
    }

    // Then update the password if it was changed
    if (editPassword && editPassword !== "••••••••") {
      const { updateStudentPassword } = useAuthStore.getState();
      const pwRes = await updateStudentPassword(editingStudentId, editPassword);
      if (!pwRes.success) {
        setEditError(pwRes.error || "Failed to update password");
        return;
      }
    }'''

update_new = '''    // First update the name and email
    const res = await updateStudent(editingStudentId, editName, editUsername);
    if (!res.success) {
      setEditError(res.error || "Failed to update profile");
      return;
    }

    // Update classId, grade, and fatherName
    const { updateStudentProfile } = useAuthStore.getState();
    await updateStudentProfile(editingStudentId, { 
      classId: editClassId, 
      grade: editClassId, 
      fatherName: editFatherName 
    });

    // Update monthly fee
    if (editMonthlyFee) {
      const { feeProfiles, updateFeeProfile } = useFeeStore.getState();
      const existingProfile = feeProfiles.find(p => p.studentId === editingStudentId);
      if (existingProfile) {
        await updateFeeProfile({ ...existingProfile, monthlyFee: parseFloat(editMonthlyFee) });
      } else {
        await updateFeeProfile({
          studentId: editingStudentId,
          monthlyFee: parseFloat(editMonthlyFee),
          paymentFrequency: "monthly",
          feeStartDate: new Date().toISOString(),
          isActive: true,
          discounts: [],
          lateFeeRule: { type: "per_day", amount: 50, gracePeriodDays: 5 }
        } as any);
      }
    }

    // Then update the password if it was changed
    if (editPassword && editPassword !== "••••••••") {
      const { updateStudentPassword } = useAuthStore.getState();
      const pwRes = await updateStudentPassword(editingStudentId, editPassword);
      if (!pwRes.success) {
        setEditError(pwRes.error || "Failed to update password");
        return;
      }
    }'''

if 'const { updateStudentProfile } = useAuthStore.getState();' not in content:
    content = content.replace(update_old, update_new)

# 4. Add UI fields in Edit Form
form_old = '''                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    </div>'''

form_new = '''                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <label className="block text-sm text-[#B6C2D9] mb-1">Class</label>
                        <select value={editClassId} onChange={e => setEditClassId(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors">
                          <option value="6th" className="bg-[#131D2E]">6th</option>
                          <option value="7th" className="bg-[#131D2E]">7th</option>
                          <option value="8th" className="bg-[#131D2E]">8th</option>
                          <option value="9th" className="bg-[#131D2E]">9th</option>
                          <option value="10th" className="bg-[#131D2E]">10th</option>
                          <option value="11th" className="bg-[#131D2E]">11th</option>
                          <option value="12th" className="bg-[#131D2E]">12th</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-[#B6C2D9] mb-1">Father's Name</label>
                        <input type="text" value={editFatherName} onChange={e => setEditFatherName(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors" placeholder="Father's Name" />
                      </div>
                      <div>
                        <label className="block text-sm text-[#B6C2D9] mb-1">Monthly Fee (₹)</label>
                        <input type="number" value={editMonthlyFee} onChange={e => setEditMonthlyFee(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors" placeholder="e.g. 5000" />
                      </div>
                    </div>'''

if 'editFatherName} onChange=' not in content:
    content = content.replace(form_old, form_new)

# 5. Display Father's name in UI
ui_old = '''                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate text-base md:text-lg">{student.name}</h3>
                            <div className="flex items-center gap-2 mt-1">'''

ui_new = '''                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate text-base md:text-lg">{student.name}</h3>
                            {(student as any).fatherName && <p className="text-[12px] text-[#7B8798] truncate">S/O {(student as any).fatherName}</p>}
                            <div className="flex items-center gap-2 mt-1">'''

if 'S/O {(student as any).fatherName}' not in content:
    content = content.replace(ui_old, ui_new)

with open("src/app/dashboard/teacher/students/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
