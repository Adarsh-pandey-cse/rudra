import re

with open("src/store/feeStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

# For updateFeeProfile
old_update = """  updateFeeProfile: async (profile) => {
    const batch = writeBatch(db);
    batch.set(doc(db, "feeProfiles", profile.studentId), profile);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentMonthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    
    const { invoices } = get();
    const hasCurrentInvoice = invoices.some(i => i.studentId === profile.studentId && i.month === currentMonthStr);"""

new_update = """  updateFeeProfile: async (profile) => {
    const batch = writeBatch(db);
    batch.set(doc(db, "feeProfiles", profile.studentId), profile);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const targetMonthStr = `${prevMonthYear}-${prevMonth.toString().padStart(2, '0')}`;
    
    const { invoices } = get();
    const hasCurrentInvoice = invoices.some(i => i.studentId === profile.studentId && i.month === targetMonthStr);"""

# The above string replace might fail due to indentation, so I'll just use regex
content = re.sub(
    r'const currentYear = new Date\(\)\.getFullYear\(\);\s*const currentMonth = new Date\(\)\.getMonth\(\) \+ 1;\s*const currentMonthStr = `\$\{currentYear\}-\$\{currentMonth\.toString\(\)\.padStart\(2, \'0\'\)\}`;',
    r'''const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const targetMonthStr = `${prevMonthYear}-${prevMonth.toString().padStart(2, '0')}`;''',
    content
)

content = content.replace("i.month === currentMonthStr", "i.month === targetMonthStr")
content = content.replace("month: currentMonthStr", "month: targetMonthStr")

with open("src/store/feeStore.ts", "w", encoding="utf-8") as f:
    f.write(content)
