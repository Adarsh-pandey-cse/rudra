import re

with open("src/store/feeStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_func = """  updateFeeProfile: async (profile) => {
    const batch = writeBatch(db);
    batch.set(doc(db, "feeProfiles", profile.studentId), profile);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const targetMonthStr = `${prevMonthYear}-${prevMonth.toString().padStart(2, '0')}`;
    
    const { invoices } = get();
    const hasCurrentInvoice = invoices.some(i => i.studentId === profile.studentId && i.month === targetMonthStr);
    
    if (!hasCurrentInvoice) {
      const baseAmount = profile.monthlyFee;
      let discountAmount = 0;
      profile.discounts?.forEach(d => {
        if (d.isPercentage) discountAmount += (baseAmount * d.amount) / 100;
        else discountAmount += d.amount;
      });
      
      const newInvId = `inv_${profile.studentId}_${currentYear}_${currentMonth}_${Date.now()}`;
      const newInvoice: Invoice = {
        id: newInvId,
        studentId: profile.studentId,
        month: targetMonthStr,
        issueDate: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        baseAmount,
        discountAmount,
        lateFeeAmount: 0,
        previousBalance: 0,
        totalAmount: baseAmount - discountAmount,
        amountPaid: 0,
        status: "pending",
        items: [{ description: "Monthly Tuition Fee", amount: baseAmount }]
      };
      batch.set(doc(db, "invoices", newInvId), newInvoice);
    }

    await batch.commit();
  },"""

# Note that whitespace differences might be failing the replace.
# Let's use a regex instead for the whole function.

new_func = """  updateFeeProfile: async (profile) => {
    const batch = writeBatch(db);
    batch.set(doc(db, "feeProfiles", profile.studentId), profile);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const targetMonthStr = `${prevMonthYear}-${prevMonth.toString().padStart(2, '0')}`;
    
    const { invoices } = get();
    const existingInvoice = invoices.find(i => i.studentId === profile.studentId && i.month === targetMonthStr);
    
    if (!existingInvoice) {
      const baseAmount = profile.monthlyFee;
      let discountAmount = 0;
      profile.discounts?.forEach(d => {
        if (d.isPercentage) discountAmount += (baseAmount * d.amount) / 100;
        else discountAmount += d.amount;
      });
      
      const newInvId = `inv_${profile.studentId}_${currentYear}_${currentMonth}_${Date.now()}`;
      const newInvoice: Invoice = {
        id: newInvId,
        studentId: profile.studentId,
        month: targetMonthStr,
        issueDate: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        baseAmount,
        discountAmount,
        lateFeeAmount: 0,
        previousBalance: 0,
        totalAmount: baseAmount - discountAmount,
        amountPaid: 0,
        status: "pending",
        items: [{ description: "Monthly Tuition Fee", amount: baseAmount }]
      };
      batch.set(doc(db, "invoices", newInvId), newInvoice);
    } else if (existingInvoice.status === "pending" || existingInvoice.status === "overdue") {
      const baseAmount = profile.monthlyFee;
      let discountAmount = 0;
      profile.discounts?.forEach(d => {
        if (d.isPercentage) discountAmount += (baseAmount * d.amount) / 100;
        else discountAmount += d.amount;
      });
      const totalAmount = baseAmount - discountAmount + (existingInvoice.lateFeeAmount || 0) + (existingInvoice.previousBalance || 0);
      batch.update(doc(db, "invoices", existingInvoice.id), {
        baseAmount,
        discountAmount,
        totalAmount,
        items: [{ description: "Monthly Tuition Fee", amount: baseAmount }]
      });
    }

    await batch.commit();
  },"""

content = re.sub(r'updateFeeProfile:\s*async\s*\(profile\)\s*=>\s*\{.*?\await batch\.commit\(\);\s*\},', new_func, content, flags=re.DOTALL)

with open("src/store/feeStore.ts", "w", encoding="utf-8") as f:
    f.write(content)
