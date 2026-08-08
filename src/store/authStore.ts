import { create } from "zustand";
import type { User, UserRole } from "@/types";
import { auth, db, firebaseConfig, getFCMToken } from "@/lib/firebase/firebase";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, onSnapshot, query, where } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  users: User[];
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  initializeAuthListener: () => () => void;
  initializeUsersListener: () => () => void;
  
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  registerStudent: (
    name: string,
    email: string,
    password: string,
    grade: string,
    parentPhone?: string,
    fatherName?: string,
    status?: 'active' | 'archived',
    leaveDate?: string
  ) => Promise<{ success: boolean; error?: string; studentId?: string }>;
  
  getStudentUsers: () => User[];
  getArchivedStudents: () => User[];
  getAllUsers: () => User[];
  
  deleteStudent: (studentId: string) => Promise<void>;
  updateStudent: (studentId: string, name: string, email: string) => Promise<{ success: boolean; error?: string }>;
  updateStudentProfile: (studentId: string, updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  archiveStudent: (studentId: string) => Promise<{ success: boolean; error?: string }>;
  restoreStudent: (studentId: string) => Promise<{ success: boolean; error?: string }>;
  updateAvatar: (userId: string, avatarData: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  users: [],
  _hasHydrated: true,
  setHasHydrated: (state) => set({ _hasHydrated: state }),

  initializeAuthListener: () => {
    set({ isLoading: true });
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            set({
              currentUser: { id: firebaseUser.uid, ...userDoc.data() } as User,
              isAuthenticated: true,
              isLoading: false
            });
          } else {
            set({ currentUser: null, isAuthenticated: false, isLoading: false });
          }
        } catch (error) {
          console.error("Auth listener error fetching user doc:", error);
          set({ currentUser: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        set({ currentUser: null, isAuthenticated: false, isLoading: false });
      }
    });
    return unsubscribe;
  },

  initializeUsersListener: () => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allUsers: User[] = [];
      snapshot.forEach((docSnap) => {
        allUsers.push({ id: docSnap.id, ...docSnap.data() } as User);
      });
      set({ users: allUsers });
    });
    return unsubscribe;
  },

  login: async (emailOrUsername: string, password: string) => {
    set({ isLoading: true });
    try {
      let firebaseEmail = emailOrUsername.trim();
      let cleanPassword = password.trim();
      let normalizedUsername = firebaseEmail.toLowerCase();
      
      let isAdarsh = normalizedUsername === "adarsh@77" || normalizedUsername === "adarsh@rudra.edu";
      let isAkansha = normalizedUsername === "akansha@27" || normalizedUsername === "akansha@rudra.edu";

      if (isAdarsh) firebaseEmail = "adarsh@rudra.edu";
      else if (isAkansha) firebaseEmail = "akansha@rudra.edu";
      else if (!firebaseEmail.includes('@')) {
        firebaseEmail = `${firebaseEmail}@rudra.edu`.toLowerCase();
      }

      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, firebaseEmail, cleanPassword);
      } catch (error: any) {
        if (error.code === "auth/invalid-api-key") throw error; // Don't swallow missing client API key!
        
        if (
          (isAdarsh && cleanPassword === "Master@99") ||
          (isAkansha && cleanPassword === "Madam@88")
        ) {
          try {
            // Forcefully sync the teacher passwords in Firebase via our backend
            await fetch('/api/fix-teachers');
            
            try {
              // Retry sign in after fixing the password
              userCredential = await signInWithEmailAndPassword(auth, firebaseEmail, cleanPassword);
            } catch (retryError: any) {
              // If it STILL fails, it means the user doesn't exist at all, so we create it.
              userCredential = await createUserWithEmailAndPassword(auth, firebaseEmail, cleanPassword);
            }
          } catch (createError: any) {
             if (createError.code === "auth/invalid-api-key") throw createError;
             throw new Error("Could not sync teacher account. Make sure FIREBASE_SERVICE_ACCOUNT is exactly correct in Vercel.");
          }
        } else {
          throw error;
        }
      }
      let userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      
      // Auto-provision if it's a known teacher but doc doesn't exist (e.g. newly enabled Auth)
      if (!userDoc.exists() && (firebaseEmail === "adarsh@rudra.edu" || firebaseEmail === "akansha@rudra.edu")) {
        const newTeacherDoc = {
          id: userCredential.user.uid,
          name: firebaseEmail === "adarsh@rudra.edu" ? "Adarsh Pandey" : "Akansha Pandey",
          username: firebaseEmail === "adarsh@rudra.edu" ? "Adarsh@77" : "Akansha@27",
          email: firebaseEmail,
          role: "teacher",
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, "users", userCredential.user.uid), newTeacherDoc);
        userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      }

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.status === "deleted" || userData.status === "archived") {
          await signOut(auth);
          set({ isLoading: false });
          return { success: false, error: "This account has been disabled or deleted." };
        }
        
        try {
          const token = await getFCMToken();
          if (token) {
            await updateDoc(doc(db, "users", userCredential.user.uid), {
              fcmToken: token
            });
          }
        } catch (e) {
          console.error("Failed to save FCM token", e);
        }

        set({ 
          currentUser: { id: userCredential.user.uid, ...userData } as User,
          isAuthenticated: true,
          isLoading: false
        });
        return { success: true };
      } else {
        await signOut(auth);
        set({ isLoading: false });
        return { success: false, error: "User document not found" };
      }
    } catch (error: any) {
      set({ isLoading: false });
      let errorMsg = "Invalid username or password";
      if (error.message && !error.message.includes("Firebase:")) {
        errorMsg = error.message; // Show our custom errors
      } else if (error.code === "auth/invalid-api-key") {
        errorMsg = "Missing Firebase API Key in Vercel. Please add NEXT_PUBLIC_FIREBASE variables.";
      }
      return { success: false, error: errorMsg };
    }
  },
  logout: async () => {
    try {
      await signOut(auth);
      set({ currentUser: null, isAuthenticated: false });
    } catch (error) {
      console.error("Logout error:", error);
    }
  },

  registerStudent: async (name, email, password, grade, parentPhone, fatherName, status = 'active', leaveDate) => {
    const { currentUser } = get();
    if (!currentUser || currentUser.role !== "teacher") {
      return { success: false, error: "Only teachers can add students" };
    }

    try {
      // PROD WAY: Create secondary auth instance to prevent logging out the teacher
      const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
      const secondaryAuth = getAuth(secondaryApp);
      
      const cleanEmail = email.trim();
      const cleanPassword = password.trim();
      
      const firebaseEmail = cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@rudra.edu`.toLowerCase();
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, firebaseEmail, cleanPassword);
      const studentId = userCredential.user.uid;
      
      // Sign out of the secondary app so it doesn't persist
      await signOut(secondaryAuth);
      
      const newStudent = {
        username: email,
        name,
        role: "student" as UserRole,
        password: cleanPassword, // Stored to allow teachers to view and share with students
        createdAt: new Date().toISOString(),
        classId: `class-${grade.replace(/\s+/g, '-').toLowerCase()}`,
        grade,
        addedByTeacherId: currentUser.id,
        parentPhone: parentPhone || "",
        fatherName: fatherName || "",
        status,
        leaveDate: leaveDate || ""
      };

      // Create document in Firestore
      await setDoc(doc(db, "users", studentId), newStudent);
      
      // GENERATE INITIAL FEE PROFILE & INVOICE INSTANTLY
      try {
        const { useFeeStore } = await import("./feeStore");
        // Ensure fee store is hydrated before writing
        if ((useFeeStore as any).persist) {
            await (useFeeStore as any).persist.rehydrate();
        }
        
        const now = new Date();
        const monthStr = now.toISOString().substring(0, 7);
        const dueDate = new Date(now);
        dueDate.setMonth(dueDate.getMonth() + 1); // Exact same date, next month

        const newProfile = {
          studentId,
          monthlyFee: 2500,
          paymentFrequency: "monthly",
          preferredDueDate: 5,
          feeStartDate: now.toISOString(),
          lateFeeRule: { type: "none", amount: 0, gracePeriodDays: 5 },
          discounts: [],
          isActive: true
        };

        const newInvoice = {
          id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          studentId,
          month: monthStr,
          issueDate: now.toISOString(),
          dueDate: dueDate.toISOString(),
          baseAmount: 2500,
          discountAmount: 0,
          lateFeeAmount: 0,
          previousBalance: 0,
          totalAmount: 2500,
          amountPaid: 0,
          status: "pending",
          items: [{ description: "Initial Tuition Fee", amount: 2500 }]
        };

        await setDoc(doc(db, "fees", studentId), newProfile);
        await setDoc(doc(db, "feeInvoices", newInvoice.id), newInvoice);
        
        console.log(`[authStore] Generated initial fee profile and invoice for ${studentId}`);
      } catch (feeError) {
        console.error("Failed to generate initial fee invoice:", feeError);
      }
      
      return { success: true, studentId };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to create student" };
    }
  },

  getStudentUsers: () => {
    return get().users.filter(u => u.role === "student" && (u as any).status !== "archived" && (u as any).status !== "deleted");
  },
  
  getArchivedStudents: () => {
    return get().users.filter(u => u.role === "student" && ((u as any).status === "archived" || (u as any).status === "deleted"));
  },

  getAllUsers: () => {
    return get().users;
  },

  deleteStudent: async (studentId: string) => {
    try {
      const { users } = get();
      
      // Permanently remove from Firestore
      await deleteDoc(doc(db, "users", studentId));
      
      // Remove from local state
      const updatedUsers = users.filter(user => user.id !== studentId);
      set({ users: updatedUsers });
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  },

  archiveStudent: async (studentId: string) => {
    try {
      const { users } = get();
      const userRef = doc(db, 'users', studentId);
      
      const leaveDate = new Date().toISOString();
      await updateDoc(userRef, {
        status: "archived",
        leaveDate
      });

      const updatedUsers = users.map(user => 
        user.id === studentId 
          ? { ...user, status: "archived", leaveDate } as User
          : user
      );
      set({ users: updatedUsers });
      return { success: true };
    } catch (error: any) {
      console.error("Archive error:", error);
      return { success: false, error: error.message };
    }
  },

  restoreStudent: async (studentId: string) => {
    try {
      const { users } = get();
      const userRef = doc(db, 'users', studentId);
      
      await updateDoc(userRef, {
        status: "active",
        leaveDate: ""
      });

      const updatedUsers = users.map(user => 
        user.id === studentId 
          ? { ...user, status: "active", leaveDate: "" } as User
          : user
      );
      set({ users: updatedUsers });
      return { success: true };
    } catch (error: any) {
      console.error("Restore error:", error);
      return { success: false, error: error.message };
    }
  },

  updateStudent: async (studentId: string, name: string, email: string) => {
    try {
      await updateDoc(doc(db, "users", studentId), {
        name,
        username: email
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to update student" };
    }
  },

  updateStudentProfile: async (studentId: string, updates: Partial<User>) => {
    try {
      await updateDoc(doc(db, "users", studentId), updates);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to update profile" };
    }
  },

  updateAvatar: async (userId: string, avatarData: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { avatar: avatarData });
      const { currentUser } = get();
      if (currentUser && currentUser.id === userId) {
        set({ currentUser: { ...currentUser, avatar: avatarData } });
      }
    } catch (error) {
      console.error("Firebase update failed for avatar", error);
    }
  },
}));
