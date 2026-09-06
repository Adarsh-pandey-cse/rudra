import re

with open("src/store/feeStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_code = """      if (typeof window !== "undefined") {
        const notificationPayload = {
          id: `fee_verified_${newPayment.id}`,
          title: "Fee Payment Verified \\u2705",
          body: "Your fee payment has been verified. Your receipt is ready to download."
        };
        localStorage.setItem(`manual_fee_reminder_${invoice.studentId}`, JSON.stringify(notificationPayload));
      }
    },"""

# wait, the emoji might be different in utf-8, let's just use regex

pattern = re.compile(r'(localStorage\.setItem\(`manual_fee_reminder_\$\{invoice\.studentId\}`,\s*JSON\.stringify\(notificationPayload\)\);\s*\})', re.MULTILINE)

new_content = pattern.sub(r'\1\n      return newPaymentId;', content)

with open("src/store/feeStore.ts", "w", encoding="utf-8") as f:
    f.write(new_content)
