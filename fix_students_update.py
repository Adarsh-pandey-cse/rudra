import re

with open("src/app/dashboard/teacher/students/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace handleUpdate
old_update = """  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentId) return;
    
    // First update the name and email
    const res = await updateStudent(editingStudentId, editName, editUsername);
    if (!res.success) {
      setEditError(res.error || "Failed to update profile");
      return;
    }

    // Then update the password if it was changed
    if (editPassword && editPassword !== "????????") {
      const { updateStudentPassword } = useAuthStore.getState();
      const pwRes = await updateStudentPassword(editingStudentId, editPassword);
      if (!pwRes.success) {
        setEditError(pwRes.error || "Failed to update password");
        return;
      }
    }

    setEditingStudentId(null);
  };"""

new_update = """  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentId) return;
    
    // First update the name and email
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
    if (editPassword && !editPassword.includes("") && editPassword !== "????????") {
      const { updateStudentPassword } = useAuthStore.getState();
      const pwRes = await updateStudentPassword(editingStudentId, editPassword);
      if (!pwRes.success) {
        setEditError(pwRes.error || "Failed to update password");
        return;
      }
    }

    setEditingStudentId(null);
  };"""

# Using regex since the exact encoding of the ???????? might differ
content = re.sub(r'const handleUpdate = async \(e: React\.FormEvent\) => \{.*?\n\s*setEditingStudentId\(null\);\n\s*\};', new_update, content, flags=re.DOTALL)

with open("src/app/dashboard/teacher/students/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
