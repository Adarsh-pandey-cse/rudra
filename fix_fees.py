import re

with open("src/store/feeStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Make it ALWAYS generate invoices on the 1st of the CURRENT month instead of looking at preferredDueDate.
old_logic = """      // 2. Generate Invoices for target month if missing
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      
      const targetYear = prevMonthYear;
        const targetMonth = prevMonth;
        const targetMonthStr = `${targetYear}-${targetMonth.toString().padStart(2, '0')}`;
      
      feeProfiles.filter(p => p.isActive).forEach(profile => {
        const billingDateThisMonth = new Date(targetYear, targetMonth - 1, profile.preferredDueDate);
        const hasAnyInvoice = invoices.some(i => i.studentId === profile.studentId);
        
        if (now >= billingDateThisMonth || !hasAnyInvoice) {"""

new_logic = """      // 2. Generate Invoices for the PREVIOUS month (billed on the 1st of the CURRENT month)
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      
      const targetYear = prevMonthYear;
      const targetMonth = prevMonth;
      const targetMonthStr = `${targetYear}-${targetMonth.toString().padStart(2, '0')}`;
      
      feeProfiles.filter(p => p.isActive).forEach(profile => {
        // ALWAYS trigger generation on the 1st of the current month
        const billingDateThisMonth = new Date(currentYear, currentMonth - 1, 1);
        const hasAnyInvoice = invoices.some(i => i.studentId === profile.studentId);
        
        if (now >= billingDateThisMonth || !hasAnyInvoice) {"""

content = content.replace(old_logic, new_logic)

with open("src/store/feeStore.ts", "w", encoding="utf-8") as f:
    f.write(content)
