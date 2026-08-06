import { collection, doc, query, getDocs, getDoc, DocumentData, QueryConstraint } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { FirestoreService } from "../firebase/firestore.service";

export class BaseRepository<T extends { id: string }> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  protected getCollectionRef() {
    return collection(db, this.collectionName);
  }

  protected getDocRef(id: string) {
    return doc(db, this.collectionName, id);
  }

  /**
   * Cleans an object of undefined values to prevent Firestore crashes (deep).
   */
  protected sanitizeData(data: Partial<T>): Partial<T> {
    // Deep clone and remove undefined values.
    // JSON.stringify automatically strips properties with undefined values.
    return JSON.parse(JSON.stringify(data));
  }

  async getById(id: string): Promise<T | null> {
    const docSnap = await getDoc(this.getDocRef(id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  }

  async query(constraints: QueryConstraint[]): Promise<T[]> {
    const q = query(this.getCollectionRef(), ...constraints);
    const querySnapshot = await getDocs(q);
    const results: T[] = [];
    querySnapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() } as T);
    });
    return results;
  }

  async create(data: T): Promise<void> {
    const sanitized = this.sanitizeData(data);
    await FirestoreService.set(this.collectionName, [data.id], sanitized);
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    const sanitized = this.sanitizeData(data);
    await FirestoreService.update(this.collectionName, [id], sanitized);
  }

  async delete(id: string): Promise<void> {
    const { deleteDoc } = await import("firebase/firestore");
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(`[Firestore Timeout] deleteDoc exceeded 15000ms.`)), 15000);
    });

    try {
      await Promise.race([deleteDoc(this.getDocRef(id)), timeoutPromise]);
    } finally {
      clearTimeout(timeoutId!);
    }
  }
}
