"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useHomeworkStore } from "@/store/homeworkStore";
import { useNotificationStore } from "@/store/notificationStore";
import { useNoticeStore } from "@/store/noticeStore";
import { useDoubtStore } from "@/store/doubtStore";
import { useFeeStore } from "@/store/feeStore";
import { useDataStore } from "@/store/dataStore";
import { useLeaderboardStore } from "@/store/leaderboardStore";
import { useAnalyticsStore } from "@/store/analyticsStore";
import { eventBus } from "@/lib/eventBus";

export default function SyncStores() {
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    
    try {
      bc = new BroadcastChannel('rudra-store-sync');
      
      bc.onmessage = (event) => {
        if (event.data?.type === 'STORE_SYNC') {
          const storeName = event.data.store;
          switch (storeName) {
            case 'auth': useAuthStore.persist.rehydrate(); break;
            case 'homework': break;
            case 'notification': break;
            case 'notice': break;
            case 'doubt': break; // Doubt store is now synced via Firestore onSnapshot
            case 'fee': useFeeStore.persist.rehydrate(); break;
            case 'data': useDataStore.persist.rehydrate(); break;
            case 'leaderboard': useLeaderboardStore.persist.rehydrate(); break;
            case 'analytics': break;
          }
        }
      };
    } catch (e) {
      console.warn("BroadcastChannel not supported", e);
    }

    const broadcastUpdate = (storeName: string) => {
      if (bc) {
        bc.postMessage({ type: 'STORE_SYNC', store: storeName });
      }
    };

    const unsubs = [
      useAuthStore.subscribe(() => {}),
      useHomeworkStore.subscribe(() => {}),
      useNotificationStore.subscribe(() => {}),
      useNoticeStore.subscribe(() => {}),
      useDoubtStore.subscribe(() => {}),
      useFeeStore.subscribe(() => {}),
      useDataStore.subscribe(() => {}),
      useLeaderboardStore.subscribe(() => {}),
      useAnalyticsStore.subscribe(() => {}),
      
      // useAuthStore.persist.onFinishHydration(() => broadcastUpdate('auth')),
      // useHomeworkStore.persist.onFinishHydration(() => broadcastUpdate('homework')),
      // useNotificationStore.persist.onFinishHydration(() => broadcastUpdate('notification')),
      // useNoticeStore.persist.onFinishHydration(() => broadcastUpdate('notice')),
      // useDoubtStore.persist.onFinishHydration(() => broadcastUpdate('doubt')),
      // useFeeStore.persist.onFinishHydration(() => broadcastUpdate('fee')),
      // useDataStore.persist.onFinishHydration(() => broadcastUpdate('data')),
      // useLeaderboardStore.persist.onFinishHydration(() => broadcastUpdate('leaderboard')),
      // useAnalyticsStore.persist.onFinishHydration(() => broadcastUpdate('analytics'))
    ];

    const handleStorage = (e: StorageEvent) => {
      // Fallback for browsers without BroadcastChannel
      if (e.key) {
        if (e.key.includes('auth')) useAuthStore.persist.rehydrate();
        if (e.key.includes('homework')) {}
        if (e.key.includes('notification')) {}
        if (e.key.includes('notice')) {}
        if (e.key.includes('doubt')) {}
        if (e.key.includes('fee')) useFeeStore.persist.rehydrate();
        if (e.key.includes('data')) useDataStore.persist.rehydrate();
        if (e.key.includes('leaderboard')) useLeaderboardStore.persist.rehydrate();
        if (e.key.includes('analytics')) {}
      } else {
        useAuthStore.persist.rehydrate();
        useFeeStore.persist.rehydrate();
        useDataStore.persist.rehydrate();
        useLeaderboardStore.persist.rehydrate();
      }
    };

    window.addEventListener("storage", handleStorage);

    let cleanupLeaderboard: (() => void) | undefined;
    let cleanupNotification: (() => void) | undefined;

    const leaderboardStore = useLeaderboardStore.getState() as any;
    leaderboardStore.initializeLeaderboard();
    if (typeof leaderboardStore.setupEventListeners === 'function') {
      cleanupLeaderboard = leaderboardStore.setupEventListeners();
    }
    
    const analyticsStore = useAnalyticsStore.getState() as any;
    analyticsStore.initializeAnalytics();
    
    const notificationStore = useNotificationStore.getState() as any;
    if (typeof notificationStore.setupEventListeners === 'function') {
      cleanupNotification = notificationStore.setupEventListeners();
    }

    return () => {
      window.removeEventListener("storage", handleStorage);
      if (bc) bc.close();
      unsubs.forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
      if (cleanupLeaderboard) cleanupLeaderboard();
      if (cleanupNotification) cleanupNotification();
    };
  }, []);

  return null;
}
