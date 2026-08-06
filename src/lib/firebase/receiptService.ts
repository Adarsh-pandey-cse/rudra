export interface ReceiptRecord {
  id: string;
  paymentId: string;
  invoiceId: string;
  studentId: string;
  createdAt: string;
  hash: string;
  generatedBy: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  userId: string;
  details?: any;
}

// Simulated Firebase Firestore & Storage Service
class ReceiptService {
  private getDb<T>(collection: string): T[] {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(`rudra_mock_firebase_${collection}`);
    return data ? JSON.parse(data) : [];
  }

  private setDb<T>(collection: string, data: T[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(`rudra_mock_firebase_${collection}`, JSON.stringify(data));
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; 
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  public generateReceiptId(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    // Generate a random 6 digit sequence for the ID
    const randomSeq = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `RUD/${year}/${month}/${randomSeq}`;
  }

  // Simulates creating a Firestore document
  public async createReceiptRecord(paymentId: string, invoiceId: string, studentId: string, teacherId: string): Promise<ReceiptRecord> {
    await this.delay(300); // simulate network
    
    const receipts = this.getDb<ReceiptRecord>("receipts");
    
    // Check if already exists
    const existing = receipts.find(r => r.paymentId === paymentId);
    if (existing) return existing;

    const newRecord: ReceiptRecord = {
      id: this.generateReceiptId(new Date()),
      paymentId,
      invoiceId,
      studentId,
      createdAt: new Date().toISOString(),
      hash: this.generateHash(`${paymentId}-${studentId}-${new Date().toISOString()}`),
      generatedBy: teacherId
    };

    receipts.push(newRecord);
    this.setDb("receipts", receipts);
    
    await this.logAudit("Receipt Generated", teacherId, { receiptId: newRecord.id, paymentId });
    return newRecord;
  }

  public async getReceiptByPaymentId(paymentId: string): Promise<ReceiptRecord | null> {
    const receipts = this.getDb<ReceiptRecord>("receipts");
    return receipts.find(r => r.paymentId === paymentId) || null;
  }

  public async getReceiptById(receiptId: string): Promise<ReceiptRecord | null> {
    const receipts = this.getDb<ReceiptRecord>("receipts");
    return receipts.find(r => r.id === receiptId) || null;
  }

  // Simulates logging an audit trail in Firestore
  public async logAudit(action: string, userId: string, details?: any): Promise<void> {
    const logs = this.getDb<AuditLog>("audit_logs");
    logs.push({
      id: `log_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      timestamp: new Date().toISOString(),
      action,
      userId,
      details
    });
    this.setDb("audit_logs", logs);
  }

  // Simulates uploading to Firebase Storage and returning a download URL
  public async uploadAsset(blob: Blob, path: string): Promise<string> {
    await this.delay(800); // Simulate upload time
    
    // In a real scenario, this returns a firebase storage download URL.
    // We will just create a local object URL for preview purposes in the mock.
    return URL.createObjectURL(blob);
  }
}

export const receiptService = new ReceiptService();
