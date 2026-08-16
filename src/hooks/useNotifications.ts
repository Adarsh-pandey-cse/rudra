"use client";

import { useEffect, useState } from "react";
import { useDataStore } from "@/store/dataStore";
import { useAuthStore } from "@/store/authStore";

export interface NotificationPref {
  homeworkDueSoon: boolean;
  feeReminders: boolean;
  newAssignments: boolean;
}

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
  type: "homework" | "fee" | "assignment" | "notice" | "doubt";
}

const DEFAULT_PREFS: NotificationPref = {
  homeworkDueSoon: true,
  feeReminders: true,
  newAssignments: true,
};

// This is a dummy VAPID public key for the prototype.
// In production, you generate this on your backend and provide it here.
const PUBLIC_VAPID_KEY = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";

// Helper to convert base64 to Uint8Array for Push API
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useNotifications() {
  const { currentUser } = useAuthStore();
  const { getStudentHomework } = useDataStore();
  
  const [prefs, setPrefs] = useState<NotificationPref>(DEFAULT_PREFS);

  // Load preferences and history on mount
  useEffect(() => {
    if (typeof window === "undefined" || !currentUser) return;
    
    const savedPrefs = localStorage.getItem(`notif_prefs_${currentUser.id}`);
    if (savedPrefs) setPrefs(JSON.parse(savedPrefs));
  }, [currentUser]);

  // Request Notification Permission
  const subscribeToPush = async () => {
    if (!('Notification' in window)) {
      console.warn("Push notifications are not supported by the browser.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // If permission granted, force sync the Firebase token via the global hook
        if (typeof window !== 'undefined' && (window as any)._syncFCMToken) {
          (window as any)._syncFCMToken();
        }
      } else {
        console.warn("Notification permission denied.");
      }
    } catch (error) {
      console.error("Error setting up push notifications:", error);
    }
  };

  // Save prefs
  const updatePrefs = (newPrefs: NotificationPref) => {
    setPrefs(newPrefs);
    if (currentUser) {
      localStorage.setItem(`notif_prefs_${currentUser.id}`, JSON.stringify(newPrefs));
    }
    
    // Request OS permission if any pref is turned on
    if (Object.values(newPrefs).some(v => v)) {
      subscribeToPush();
    }
  };

  const markAllAsRead = () => {
    // Left empty for compatibility with Settings page if needed
  };

  // Trigger OS Notification and save In-App
  const triggerNotification = (id: string, title: string, body: string, type: "homework" | "fee" | "assignment") => {
    if (!currentUser) return;
    
    // Check if already notified
    const triggeredStr = localStorage.getItem(`notif_triggered_${currentUser.id}`) || "{}";
    const triggered = JSON.parse(triggeredStr);
    
    if (triggered[id]) return; // Already triggered

    // Save as triggered
    triggered[id] = true;
    localStorage.setItem(`notif_triggered_${currentUser.id}`, JSON.stringify(triggered));

    // Delegate to the global unified notification store
    import("@/store/notificationStore").then(({ useNotificationStore }) => {
      useNotificationStore.getState().addNotification({
        recipientId: currentUser.id,
        title,
        message: body,
        link: type === "homework" || type === "assignment" ? "/dashboard/student/homework" : (type === "fee" ? "/dashboard/student/fees" : undefined)
      });
    });
  };

  // Background Daemon
  useEffect(() => {
    if (!currentUser || currentUser.role !== "student") return;

    const checkAlerts = () => {
      const homework = getStudentHomework(currentUser.id) || [];
      const now = new Date();

      // 1. Homework Due Soon (<= 24h)
      if (prefs.homeworkDueSoon) {
        homework.forEach(hw => {
          if (hw.status === "pending") {
            const dueDate = new Date(hw.dueDate);
            const hoursLeft = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
            
            if (hoursLeft > 0 && hoursLeft <= 24) {
              triggerNotification(
                `due_hw_${hw.id}`, 
                "Homework Due Soon", 
                `${currentUser.name}, ${hw.title} is due in ${Math.ceil(hoursLeft)} hours!`, 
                "homework"
              );
            }
          }
        });
      }

      // 3. Manual Fee Reminders (Intercepted from Teacher)
      if (prefs.feeReminders) {
        const manualReminderStr = localStorage.getItem(`manual_fee_reminder_${currentUser.id}`);
        if (manualReminderStr) {
          const manualReminder = JSON.parse(manualReminderStr);
          triggerNotification(
            manualReminder.id,
            manualReminder.title,
            manualReminder.body,
            "fee"
          );
          // Clear it so we don't trigger it again
          localStorage.removeItem(`manual_fee_reminder_${currentUser.id}`);
        }
      }
    };

    // Initial check
    checkAlerts();
    
    // Check every 1 minute
    const interval = setInterval(checkAlerts, 60000);
    return () => clearInterval(interval);

  }, [currentUser, prefs, getStudentHomework]);

  return {
    prefs,
    updatePrefs,
    markAllAsRead,
    requestPermission: subscribeToPush
  };
}
