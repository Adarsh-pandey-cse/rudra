import { create } from "zustand";
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, where, getDocs } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase/firebase";
import { uploadFile } from "@/lib/firebase/uploadService";
import { Note } from "@/types";

interface NoteState {
  notes: Note[];
  isLoading: boolean;
  initializeListeners: (role: "student" | "teacher", classId?: string) => () => void;
  uploadNote: (file: File, classId: string, subjectId: string, title: string, teacherId: string, onProgress?: (p: number) => void) => Promise<void>;
  deleteNote: (note: Note) => Promise<void>;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  isLoading: false,

  initializeListeners: (role, classId) => {
    set({ isLoading: true });
    
    let q;
    if (role === "student" && classId) {
      q = query(collection(db, "notes"), where("classId", "==", classId));
    } else {
      // Teacher sees all notes
      q = query(collection(db, "notes"));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotes = snapshot.docs.map(doc => doc.data() as Note);
      
      // Sort by uploadedAt desc
      fetchedNotes.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      
      set({ notes: fetchedNotes, isLoading: false });
    });

    return unsubscribe;
  },

  uploadNote: async (file, classId, subjectId, title, teacherId, onProgress) => {
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let fileType: "pdf" | "image" | "docx" | "other" = "other";
      if (extension === "pdf") fileType = "pdf";
      else if (["jpg", "jpeg", "png", "webp", "gif"].includes(extension || "")) fileType = "image";
      else if (["doc", "docx"].includes(extension || "")) fileType = "docx";

      const noteId = `note_${Date.now()}`;
      const storagePath = `notes/${classId}/${subjectId}/${noteId}.${extension}`;
      
      const fileUrl = await uploadFile(file, storagePath, onProgress);

      const note: Note = {
        id: noteId,
        title,
        classId,
        subjectId,
        fileUrl,
        fileType,
        uploadedAt: new Date().toISOString(),
        teacherId,
        sizeBytes: file.size,
        fileName: file.name
      };

      await setDoc(doc(db, "notes", noteId), note);
    } catch (error) {
      console.error("Failed to upload note:", error);
      throw error;
    }
  },

  deleteNote: async (note: Note) => {
    try {
      // 1. Delete from storage
      try {
        const fileRef = ref(storage, note.fileUrl);
        await deleteObject(fileRef);
      } catch (storageError) {
        console.error("Failed to delete file from storage, continuing to delete doc...", storageError);
      }
      
      // 2. Delete doc
      await deleteDoc(doc(db, "notes", note.id));
    } catch (error) {
      console.error("Failed to delete note:", error);
      throw error;
    }
  }
}));

