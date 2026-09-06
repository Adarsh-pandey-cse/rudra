import re

with open("src/store/feeStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Replace newPayment creation in submitPayment
old_submit_payment = """      const newPayment: Payment = {
        id: newPaymentId,
        invoiceId,
        studentId: invoice.studentId,
        amount,
        paymentDate: new Date().toISOString(),
        mode,
        referenceNumber,
        recordedBy: "student",
        status: "pending_verification",
      };"""

new_submit_payment = """      const newPayment: Payment = {
        id: newPaymentId,
        invoiceId,
        studentId: invoice.studentId,
        amount,
        paymentDate: new Date().toISOString(),
        mode,
        recordedBy: "student",
        status: "pending_verification",
      };
      if (referenceNumber) {
        newPayment.referenceNumber = referenceNumber;
      }"""

content = content.replace(old_submit_payment, new_submit_payment)

with open("src/store/feeStore.ts", "w", encoding="utf-8") as f:
    f.write(content)
