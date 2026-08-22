import re

with open('src/app/dashboard/teacher/fees/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add isProcessing state
content = content.replace(
    'const [isLoadingReceipt, setIsLoadingReceipt] = useState<string | null>(null);',
    'const [isLoadingReceipt, setIsLoadingReceipt] = useState<string | null>(null);\n  const [isProcessing, setIsProcessing] = useState(false);'
)

# Update handleRecordPayment to set isProcessing and fix studentId
old_func = '''  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !paymentAmount) return;
    
    const amountNum = parseFloat(paymentAmount);
    if (amountNum <= 0 || amountNum > (selectedInvoice.totalAmount - selectedInvoice.amountPaid)) return;

    const currentInvoice = selectedInvoice;
    const paymentId = await recordPayment(currentInvoice.id, amountNum, paymentMode, currentUser.id);
    
    if (paymentId) {
      const student = students.find(s => s.id === currentInvoice.studentId);
      if (student) {
        setIsLoadingReceipt(paymentId);
        try {
          const record = await receiptService.createReceiptRecord(paymentId, currentInvoice.id, currentUser!.id, currentUser!.name);'''

new_func = '''  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !paymentAmount) return;
    
    const amountNum = parseFloat(paymentAmount);
    if (amountNum <= 0 || amountNum > (selectedInvoice.totalAmount - selectedInvoice.amountPaid)) return;

    setIsProcessing(true);
    const currentInvoice = selectedInvoice;
    
    try {
      const paymentId = await recordPayment(currentInvoice.id, amountNum, paymentMode, currentUser.id);
      
      if (paymentId) {
        const student = students.find(s => s.id === currentInvoice.studentId);
        if (student) {
          setIsLoadingReceipt(paymentId);
          try {
            const record = await receiptService.createReceiptRecord(paymentId, currentInvoice.id, student.id, currentUser!.id);'''

content = content.replace(old_func, new_func)

# Fix finally block for handleRecordPayment
content = content.replace(
    '''        } catch (error) {
          console.error("Failed to generate receipt immediately", error);
        } finally {
          setIsLoadingReceipt(null);
        }
      }
    }
    
    setSelectedInvoice(null);
    setPaymentAmount("");
  };''',
    '''        } catch (error) {
          console.error("Failed to generate receipt immediately", error);
        } finally {
          setIsLoadingReceipt(null);
        }
      }
    }
    } catch (error) {
      console.error("Failed to record payment", error);
    } finally {
      setIsProcessing(false);
      setSelectedInvoice(null);
      setPaymentAmount("");
    }
  };'''
)

# Apply isProcessing to the button
content = content.replace(
    '<GradientButton type="submit" className="flex-1 py-2.5">Confirm Payment</GradientButton>',
    '<GradientButton type="submit" className="flex-1 py-2.5" loading={isProcessing}>Confirm Payment</GradientButton>'
)

with open('src/app/dashboard/teacher/fees/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
