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
  const [inAppNotifs, setInAppNotifs] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load preferences and history on mount
  useEffect(() => {
    if (typeof window === "undefined" || !currentUser) return;
    
    const savedPrefs = localStorage.getItem(`notif_prefs_${currentUser.id}`);
    if (savedPrefs) setPrefs(JSON.parse(savedPrefs));

    const savedNotifs = localStorage.getItem(`notif_history_${currentUser.id}`);
    if (savedNotifs) {
      const parsed = JSON.parse(savedNotifs);
      setInAppNotifs(parsed);
      setUnreadCount(parsed.filter((n: InAppNotification) => !n.read).length);
    }
  }, [currentUser]);

  // Register Service Worker and subscribe to Push API
  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn("Push notifications are not supported by the browser.");
      return;
    }

    try {
      // Register the service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration.scope);

      // Request Notification Permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn("Notification permission denied.");
        return;
      }

      // Subscribe to Push API
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });

      console.log("Push Subscription Object (Send this to your backend):", JSON.stringify(subscription));
      // NOTE: In a real app, you would POST this `subscription` object to your backend here
      // so the backend knows where to send the web push events.
      
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
    
    // Request OS permission and subscribe if any pref is turned on
    if (Object.values(newPrefs).some(v => v)) {
      subscribeToPush();
    }
  };

  const markAllAsRead = () => {
    const updated = inAppNotifs.map(n => ({ ...n, read: true }));
    setInAppNotifs(updated);
    setUnreadCount(0);
    if (currentUser) {
      localStorage.setItem(`notif_history_${currentUser.id}`, JSON.stringify(updated));
    }
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

    // Add to in-app history
    const newNotif: InAppNotification = {
      id, title, body, type, date: new Date().toISOString(), read: false
    };
    
    setInAppNotifs(prev => {
      const updated = [newNotif, ...prev].slice(0, 50); // Keep last 50
      localStorage.setItem(`notif_history_${currentUser.id}`, JSON.stringify(updated));
      setUnreadCount(updated.filter(n => !n.read).length);
      return updated;
    });

    // Trigger OS Native Notification if permission granted
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" }); // Fallback icon
    }
  };

  // Background Daemon
  useEffect(() => {
    if (!currentUser || currentUser.role !== "student") return;

    const checkAlerts = () => {
      const homework = getStudentHomework(currentUser.id) || [];
      const now = new Date();

      // 1. New Assignments
      if (prefs.newAssignments) {
        homework.forEach(hw => {
          if (hw.status === "pending") {
            // Check if assigned in last 24h to avoid old notifications
            // Trigger logic will prevent duplicates via notif_triggered
            triggerNotification(
              `new_hw_${hw.id}`, 
              "New Assignment", 
              `${currentUser.name}, you have got a new assignment: ${hw.title}. Please submit before the due date.`, 
              "assignment"
            );
          }
        });
      }

      // 2. Homework Due Soon (<= 24h)
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
    inAppNotifs,
    unreadCount,
    markAllAsRead,
    requestPermission: subscribeToPush
  };
}
