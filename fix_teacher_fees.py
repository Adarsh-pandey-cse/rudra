with open("src/app/dashboard/teacher/fees/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("record = await receiptService.createReceiptRecord(payment.id, invoice.id, currentUser!.id, currentUser!.name);", "record = await receiptService.createReceiptRecord(payment.id, invoice.id, student.id, currentUser!.id);")

content = content.replace("        }\n      }\n      } catch (error) {", "        }\n      }\n    } catch (error) {")

with open("src/app/dashboard/teacher/fees/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
