import re

with open("src/store/feeStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Fix initializeMockData
content = re.sub(
    r'const prevMonthYear = currentMonth === 1 \? currentYear - 1 : currentYear;.*?// 1\. Create Profile',
    r'''const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    
    // Always bill for the previous month as per user request
    const targetMonthStr = `${prevMonthYear}-${prevMonth.toString().padStart(2, '0')}`;

    students.forEach((student, index) => {
      // 1. Create Profile''',
    content,
    flags=re.DOTALL
)

# Replace targetMonthStr usage in initializeMockData
content = content.replace(
    'month: currentMonthStr,',
    'month: targetMonthStr,'
)

# Fix runDailyFeeEngine
content = re.sub(
    r'const isAfter15th = now.getDate\(\) > 15;\s*const targetYear = isAfter15th \? currentYear : prevMonthYear;\s*const targetMonth = isAfter15th \? currentMonth : prevMonth;\s*const targetMonthStr = `\$\{targetYear\}-\$\{targetMonth.toString\(\).padStart\(2, \'0\'\)\}`;',
    r'''const targetYear = prevMonthYear;
        const targetMonth = prevMonth;
        const targetMonthStr = `${targetYear}-${targetMonth.toString().padStart(2, '0')}`;''',
    content
)

# Fix updateFeeProfile
old_update = '''    updateFeeProfile: async (profile) => {
      const batch = writeBatch(db);
      batch.set(doc(db, "feeProfiles", profile.studentId), profile);

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const currentMonthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
      
      const { invoices } = get();
      const hasCurrentInvoice = invoices.some(i => i.studentId === profile.studentId && i.month === currentMonthStr);'''

new_update = '''    updateFeeProfile: async (profile) => {
      const batch = writeBatch(db);
      batch.set(doc(db, "feeProfiles", profile.studentId), profile);

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const targetMonthStr = `${prevMonthYear}-${prevMonth.toString().padStart(2, '0')}`;
      
      const { invoices } = get();
      const hasCurrentInvoice = invoices.some(i => i.studentId === profile.studentId && i.month === targetMonthStr);'''

content = content.replace(old_update, new_update)

with open("src/store/feeStore.ts", "w", encoding="utf-8") as f:
    f.write(content)
