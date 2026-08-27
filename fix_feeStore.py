import re

with open("src/store/feeStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_logic = """      if (!hasCurrentInvoice) {
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
      }"""

new_logic = """      if (!hasCurrentInvoice) {
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
      } else {
        // If there's already an invoice for this month and it's unpaid, update it live!
        const existingInvoice = invoices.find(i => i.studentId === profile.studentId && i.month === targetMonthStr);
        if (existingInvoice && (existingInvoice.status === "pending" || existingInvoice.status === "overdue")) {
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
      }"""

content = content.replace(old_logic, new_logic)
with open("src/store/feeStore.ts", "w", encoding="utf-8") as f:
    f.write(content)
