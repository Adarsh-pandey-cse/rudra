import { create } from "zustand";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

interface UsageState {
  dailyUsage: Record<string, number>; // "YYYY-MM-DD" -> duration in seconds
  isActive: boolean;
  lastActiveTime: number | null;
  startTracking: (userId: string) => void;
  stopTracking: () => void;
  fetchUsage: (userId: string, dateStr: string) => Promise<number>;
}

export const useUsageStore = create<UsageState>((set, get) => ({
  dailyUsage: {},
  isActive: false,
  lastActiveTime: null,
  
  startTracking: (userId) => {
    if (get().isActive) return;
    
    // Set initial active state
    set({ isActive: true, lastActiveTime: Date.now() });

    // Sync periodically (e.g. every 1 minute)
    const syncInterval = setInterval(async () => {
      const { isActive, lastActiveTime } = get();
      if (!isActive || !lastActiveTime) return;
      
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastActiveTime) / 1000);
      if (elapsedSeconds <= 0) return;
      
      const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
      set({ lastActiveTime: now });
      
      // Update local state
      set(state => ({
        dailyUsage: {
          ...state.dailyUsage,
          [today]: (state.dailyUsage[today] || 0) + elapsedSeconds
        }
      }));
      
      // Update Firestore
      try {
        const usageRef = doc(db, "users", userId, "usage", today);
        const usageDoc = await getDoc(usageRef);
        if (usageDoc.exists()) {
          await updateDoc(usageRef, { duration: increment(elapsedSeconds) });
        } else {
          await setDoc(usageRef, { duration: elapsedSeconds });
        }
      } catch (e) {
        console.error("Failed to sync usage", e);
      }
    }, 60000); // 1 minute

    // Handle visibility change
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        set({ isActive: true, lastActiveTime: Date.now() });
      } else {
        // Sync before going inactive
        const { lastActiveTime } = get();
        if (lastActiveTime) {
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - lastActiveTime) / 1000);
          const today = new Date().toLocaleDateString("en-CA");
          
          set(state => ({
            isActive: false,
            lastActiveTime: null,
            dailyUsage: {
              ...state.dailyUsage,
              [today]: (state.dailyUsage[today] || 0) + elapsedSeconds
            }
          }));

          if (elapsedSeconds > 0) {
            try {
              const usageRef = doc(db, "users", userId, "usage", today);
              const usageDoc = await getDoc(usageRef);
              if (usageDoc.exists()) {
                await updateDoc(usageRef, { duration: increment(elapsedSeconds) });
              } else {
                await setDoc(usageRef, { duration: elapsedSeconds });
              }
            } catch(e) {}
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Store cleanup ref if needed, though usually store lives as long as app
    (window as any)._cleanupUsageTracking = () => {
      clearInterval(syncInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  },

  stopTracking: () => {
    if ((window as any)._cleanupUsageTracking) {
      (window as any)._cleanupUsageTracking();
    }
    set({ isActive: false, lastActiveTime: null });
  },

  fetchUsage: async (userId: string, dateStr: string) => {
    try {
      const usageRef = doc(db, "users", userId, "usage", dateStr);
      const usageDoc = await getDoc(usageRef);
      if (usageDoc.exists()) {
        return usageDoc.data().duration as number;
      }
      return 0;
    } catch (e) {
      return 0;
    }
  }
}));
