import { setDoc, updateDoc, doc, addDoc, collection, DocumentReference } from "firebase/firestore";
import { db } from "./firebase";

const FIRESTORE_TIMEOUT_MS = 15000; // 15 seconds

export class FirestoreService {
  /**
   * Wraps a Promise with a strict timeout.
   */
  private static async withTimeout<T>(promise: Promise<T>, operationName: string): Promise<T> {
    let timeoutId: NodeJS.Timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`[Firestore Timeout] ${operationName} exceeded ${FIRESTORE_TIMEOUT_MS}ms.`));
      }, FIRESTORE_TIMEOUT_MS);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      return result;
    } finally {
      clearTimeout(timeoutId!);
    }
  }

  /**
   * Sets a document with a timeout.
   */
  static async set(path: string, pathSegments: string[], data: any): Promise<void> {
    const docRef = doc(db, path, ...pathSegments);
    await this.withTimeout(setDoc(docRef, data), `setDoc on ${docRef.path}`);
  }

  /**
   * Updates a document with a timeout.
   */
  static async update(path: string, pathSegments: string[], data: any): Promise<void> {
    const docRef = doc(db, path, ...pathSegments);
    await this.withTimeout(updateDoc(docRef, data), `updateDoc on ${docRef.path}`);
  }

  /**
   * Adds a document to a collection with a timeout.
   */
  static async add(path: string, data: any): Promise<DocumentReference> {
    const colRef = collection(db, path);
    return this.withTimeout(addDoc(colRef, data), `addDoc on ${path}`);
  }
}
