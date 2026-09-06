import re

with open("src/store/feeStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Replace newPayment creation in recordPayment
old_payment_creation = """      const newPayment: Payment = {
        id: newPaymentId,
        invoiceId,
        studentId: invoice.studentId,
        amount,
        paymentDate: new Date().toISOString(),
        mode,
        referenceNumber,
        recordedBy,
        status: "verified",
      };"""

new_payment_creation = """      const newPayment: Payment = {
        id: newPaymentId,
        invoiceId,
        studentId: invoice.studentId,
        amount,
        paymentDate: new Date().toISOString(),
        mode,
        recordedBy,
        status: "verified",
      };
      if (referenceNumber) {
        newPayment.referenceNumber = referenceNumber;
      }"""

content = content.replace(old_payment_creation, new_payment_creation)

with open("src/store/feeStore.ts", "w", encoding="utf-8") as f:
    f.write(content)
