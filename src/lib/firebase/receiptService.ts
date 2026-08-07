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

import { db } from "./firebase";
import { collection, doc, setDoc, getDoc, getDocs, query, where } from "firebase/firestore";
import { uploadFile } from "./uploadService";

class ReceiptService {

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
    return `RUD-${year}-${month}-${randomSeq}`;
  }

  public async createReceiptRecord(paymentId: string, invoiceId: string, studentId: string, teacherId: string): Promise<ReceiptRecord> {
    const q = query(collection(db, "receipts"), where("paymentId", "==", paymentId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ReceiptRecord;
    }

    const newRecord: ReceiptRecord = {
      id: this.generateReceiptId(new Date()),
      paymentId,
      invoiceId,
      studentId,
      createdAt: new Date().toISOString(),
      hash: this.generateHash(`${paymentId}-${studentId}-${new Date().toISOString()}`),
      generatedBy: teacherId
    };

    // Use the custom ID for the document
    await setDoc(doc(db, "receipts", newRecord.id), newRecord);
    
    await this.logAudit("Receipt Generated", teacherId, { receiptId: newRecord.id, paymentId });
    return newRecord;
  }

  public async getReceiptByPaymentId(paymentId: string): Promise<ReceiptRecord | null> {
    const q = query(collection(db, "receipts"), where("paymentId", "==", paymentId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ReceiptRecord;
    }
    return null;
  }

  public async getReceiptById(receiptId: string): Promise<ReceiptRecord | null> {
    const docRef = doc(db, "receipts", receiptId);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as ReceiptRecord;
    }
    return null;
  }

  public async logAudit(action: string, userId: string, details?: any): Promise<void> {
    const logId = `log_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    const logData: AuditLog = {
      id: logId,
      timestamp: new Date().toISOString(),
      action,
      userId,
      details
    };
    await setDoc(doc(db, "audit_logs", logId), logData);
  }

  public async uploadAsset(blob: Blob, path: string): Promise<string> {
    const filename = path.split('/').pop() || 'receipt.png';
    const file = new File([blob], filename, { type: blob.type });
    return await uploadFile(file, path);
  }
}

export const receiptService = new ReceiptService();
