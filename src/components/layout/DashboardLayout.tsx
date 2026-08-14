"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  BookOpen,
  BarChart,
  Settings,
  LogOut,
  Menu,
  X,
  Bot,
  CreditCard,
  Receipt,
  Search,
  Bell,
  Megaphone,
  MessageCircleQuestion,
  Trophy
} from "lucide-react";
import Link from "next/link";
import RudraLogo from "@/components/brand/RudraLogo";
import { Toaster } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { useNoticeStore } from "@/store/noticeStore";
import { useHomeworkStore } from "@/store/homeworkStore";
import { useDoubtStore } from "@/store/doubtStore";
import { cn, formatDate } from "@/lib/utils";
import { useNotificationStore } from "@/store/notificationStore";
import { useLeaderboardStore } from "@/store/leaderboardStore";
import { useBadgeStore } from "@/store/badgeStore";
import { useFeeStore } from "@/store/feeStore";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "teacher" | "student";
}

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  comingSoon?: boolean;
};

const TEACHER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/teacher", icon: LayoutDashboard },
  { label: "Students", href: "/dashboard/teacher/students", icon: Users },
  { label: "Homework", href: "/dashboard/teacher/homework", icon: BookOpen },
  { label: "Leaderboard", href: "/dashboard/teacher/leaderboard", icon: Trophy },
  { label: "Progress", href: "/dashboard/teacher/progress", icon: TrendingUp },
  { label: "Doubts", href: "/dashboard/teacher/doubts", icon: MessageCircleQuestion },
  { label: "Notices", href: "/dashboard/teacher/notices", icon: Megaphone },
  { label: "Fees", href: "/dashboard/teacher/fees", icon: Receipt },
  { label: "Settings", href: "/dashboard/teacher/settings", icon: Settings },
];

const STUDENT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/student", icon: LayoutDashboard },
  { label: "Homework", href: "/dashboard/student/homework", icon: BookOpen },
  { label: "Leaderboard", href: "/dashboard/student/leaderboard", icon: Trophy },
  { label: "My Progress", href: "/dashboard/student/progress", icon: TrendingUp },
  { label: "Doubts", href: "/dashboard/student/doubts", icon: MessageCircleQuestion },
  { label: "Notices", href: "/dashboard/student/notices", icon: Megaphone },
  { label: "Fees", href: "/dashboard/student/fees", icon: CreditCard },
  { label: "Settings", href: "/dashboard/student/settings", icon: Settings },
];

const TEACHER_BOTTOM_NAV = [
  { label: "Home", href: "/dashboard/teacher", icon: LayoutDashboard },
  { label: "Students", href: "/dashboard/teacher/students", icon: Users },
  { label: "Homework", href: "/dashboard/teacher/homework", icon: BookOpen },
  { label: "Leaderboard", href: "/dashboard/teacher/leaderboard", icon: Trophy },
  { label: "Profile", href: "/dashboard/teacher/settings", icon: Settings },
];

const STUDENT_BOTTOM_NAV = [
  { label: "Home", href: "/dashboard/student", icon: LayoutDashboard },
  { label: "Homework", href: "/dashboard/student/homework", icon: BookOpen },
  { label: "Leaderboard", href: "/dashboard/student/leaderboard", icon: Trophy },
  { label: "Doubts", href: "/dashboard/student/doubts", icon: MessageCircleQuestion },
  { label: "Profile", href: "/dashboard/student/settings", icon: Settings },
];

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, isAuthenticated, isLoading, logout } = useAuthStore();
  
  const [mounted, setMounted] = useState(false);
  const visitRoute = useBadgeStore(state => state.visitRoute);
  
  // Minimal data selectors for badge counting to prevent excessive re-renders
  const assignmentsLength = useHomeworkStore(state => state.assignments?.length || 0);
  const doubtsLength = useDoubtStore(state => state.doubts?.length || 0);
  const noticesLength = useNoticeStore(state => state.notices?.length || 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // GLOBAL AUTH GUARD: Prevents the flash-logout race condition on refresh
  useEffect(() => {
    if (!mounted || isLoading) return;
    
    if (!isAuthenticated) {
      router.replace("/auth/login");
    } else if (currentUser && currentUser.role !== role) {
      router.replace(`/dashboard/${currentUser.role}`);
    }
  }, [mounted, isLoading, isAuthenticated, currentUser, role, router]);

  useEffect(() => {
    // Unregister legacy sw.js if it exists to prevent conflicts
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
          if (registration.active?.scriptURL.includes('sw.js') && !registration.active?.scriptURL.includes('firebase')) {
            registration.unregister();
            console.log('Unregistered conflicting sw.js');
          }
        }
      });
    }

    if (!currentUser) return;
    
    if (pathname) {
      // Find the base href (e.g. /dashboard/teacher/doubts instead of /dashboard/teacher/doubts/123)
      const nav = role === "teacher" ? TEACHER_NAV : STUDENT_NAV;
      const matchedNav = [...nav].sort((a, b) => b.href.length - a.href.length).find(n => pathname.startsWith(n.href));
      if (matchedNav) {
        visitRoute(currentUser.id, matchedNav.href);
      } else {
        visitRoute(currentUser.id, pathname);
      }
    }
  }, [pathname, currentUser, visitRoute, role]);

  const hasNewEvents = (href: string) => {
    if (!currentUser || !mounted) return false;
    
    if (pathname.startsWith(href) && href !== `/dashboard/${role}`) return false;
    
    const getLastVisited = useBadgeStore.getState().getLastVisited;
    let lastVisit = getLastVisited(currentUser.id, href);
    if (!lastVisit) {
      lastVisit = currentUser.createdAt ? new Date(currentUser.createdAt).getTime() : 0;
    }
    
    if (role === "student") {
      if (href === "/dashboard/student/homework") {
        const assignments = useHomeworkStore.getState().assignments || [];
        const myAssignments = assignments.filter(h => 
          ((h as any).targetClassId && (h as any).targetClassId !== "-" ? (h as any).targetClassId === (currentUser as any).classId : true) || 
          (h as any).assignedTo?.includes(currentUser.id) || 
          (h as any).recipientStudentIds?.includes(currentUser.id)
        );
        return myAssignments.some(h => new Date((h as any).createdAt).getTime() > lastVisit);
      }
      if (href === "/dashboard/student/doubts") {
        const doubts = useDoubtStore.getState().doubts || [];
        return doubts.some(d => 
          d.studentId === currentUser.id && 
          (d.status === 'teacher_answered' || d.status === 'ai_answered' || (d as any).status === 'answered') &&
          d.updatedAt && new Date(d.updatedAt).getTime() > lastVisit
        );
      }
      if (href === "/dashboard/student/notices") {
        const notices = useNoticeStore.getState().notices || [];
        return notices.some(n => 
          ((n as any).targetAudience === 'all' || (n as any).targetAudience === 'students' || (n as any).targetClass === (currentUser as any).classId) &&
          new Date(n.createdAt).getTime() > lastVisit
        );
      }
    } else {
      if (href === "/dashboard/teacher/doubts") {
        const doubts = useDoubtStore.getState().doubts || [];
        return doubts.some(d => {
          const timestamp = d.updatedAt ? new Date(d.updatedAt).getTime() : new Date(d.createdAt).getTime();
          return timestamp > lastVisit &&
                 (d.status === 'open' || d.status === 'escalated' || d.status === 'reopened' || (d as any).status === 'pending');
        });
      }
      if (href === "/dashboard/teacher/homework") {
        const { submissions } = useHomeworkStore.getState();
        return submissions.some(s => new Date(s.submittedAt || 0).getTime() > lastVisit);
      }
    }
    
    return false;
  };



  // Use notifications hook only for student (for this prototype)
  const { getUserNotifications, markAllAsRead, markAsRead, clearAll } = useNotificationStore();
  const inAppNotifs = (mounted && currentUser) ? getUserNotifications(currentUser.id, currentUser.role) : [];
  const unreadCount = inAppNotifs.filter(n => !n.read).length;
  const [showNotifications, setShowNotifications] = useState(false);

  // Initialize Stores listeners and cross-tab syncing
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "rudra-homework-firebase") (useHomeworkStore as any).persist?.rehydrate();
      if (e.key === "rudra-leaderboard-storage") (useLeaderboardStore as any).persist?.rehydrate();
      if (e.key === "rudra-notifications") (useNotificationStore as any).persist?.rehydrate();
      if (e.key === "rudra-auth") (useAuthStore as any).persist?.rehydrate();

    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      const { initializeUsersListener } = useAuthStore.getState();
      const { initializeNoticeListener, initializeReadListener } = useNoticeStore.getState();
      const { initializeAssignmentsListener, initializeSubmissionsListener } = useHomeworkStore.getState();
      const { initializeDoubtsListener } = useDoubtStore.getState();
      
      let unsubFees: (() => void) | undefined;
      import("@/store/feeStore").then(({ useFeeStore }) => {
        unsubFees = useFeeStore.getState().initializeFeeListeners();
      });

      let unsubLeaderboard: (() => void) | undefined;
      import("@/store/leaderboardStore").then(({ useLeaderboardStore }) => {
        unsubLeaderboard = useLeaderboardStore.getState().setupEventListeners();
      });
      
      let unsubNotifications: (() => void) | undefined;
      import("@/store/notificationStore").then(({ useNotificationStore }) => {
        unsubNotifications = useNotificationStore.getState().setupEventListeners();
      });
      
      const unsubUsers = initializeUsersListener();
      const unsubNotices = initializeNoticeListener();
      const unsubAssignments = initializeAssignmentsListener();
      const unsubSubmissions = initializeSubmissionsListener(currentUser.id, currentUser.role);
      const unsubDoubts = initializeDoubtsListener(currentUser.id, currentUser.role);
      
      let unsubReads: (() => void) | undefined;
      if (currentUser.role === "student") {
        unsubReads = initializeReadListener(currentUser.id);
      }
      
      return () => {
        unsubUsers();
        unsubNotices();
        unsubAssignments();
        unsubSubmissions();
        unsubDoubts();
        if (unsubFees) unsubFees();
        if (unsubLeaderboard) unsubLeaderboard();
        if (unsubNotifications) unsubNotifications();
        if (unsubReads) unsubReads();
      };
    }
  }, [currentUser?.id, currentUser?.role]);
  // Sync FCM token logic
  useEffect(() => {
    const syncToken = async () => {
      if (currentUser?.id && typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          try {
            const { getFCMToken } = await import("@/lib/firebase/firebase");
            const { doc, updateDoc } = await import("firebase/firestore");
            const { db } = await import("@/lib/firebase/firebase");
            
            const token = await getFCMToken();
            if (token && currentUser.fcmToken !== token) {
              await updateDoc(doc(db, "users", currentUser.id), { fcmToken: token });
              // Also update the local store so we don't spam the DB
              useAuthStore.setState(state => ({
                 currentUser: state.currentUser ? { ...state.currentUser, fcmToken: token } : null
              }));
            }
          } catch (e) {
            console.error("Failed to sync FCM token", e);
          }
        }
      }
    };
    
    // Auto-sync on load if permission is already granted
    syncToken();
    
    // Expose syncToken to the window for the bell icon click handler
    (window as any)._syncFCMToken = syncToken;
  }, [currentUser?.id, currentUser?.fcmToken]);

  // Watch for new notifications and trigger push
  const prevNotifCount = useRef(0);
  const isInitialMount = useRef(true);
  
  useEffect(() => {
    if (isInitialMount.current) {
      prevNotifCount.current = inAppNotifs.length;
      isInitialMount.current = false;
      return;
    }
    
    if (inAppNotifs.length > prevNotifCount.current) {
      const newNotifsCount = inAppNotifs.length - prevNotifCount.current;
      const newNotifs = inAppNotifs.slice(0, newNotifsCount);
      
      const now = new Date().getTime();
      const recentNotifs = newNotifs.filter(n => {
         const createdAt = new Date(n.createdAt).getTime();
         return (now - createdAt) < 60000; // Only trigger push for events in the last 60 seconds
      });
      
      if (recentNotifs.length > 0 && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        recentNotifs.forEach(n => {
          if (!n.read) {
            const showPwaNotification = async () => {
              try {
                if ('serviceWorker' in navigator) {
                  const registration = await navigator.serviceWorker.ready;
                  if (registration && registration.showNotification) {
                    await registration.showNotification(n.title, {
                      body: n.message,
                      icon: '/icon512_maskable.png',
                      badge: '/icon512_maskable.png',
                      vibrate: [200, 100, 200]
                    } as any);
                    return;
                  }
                }
                // Fallback for desktop browsers
                new Notification(n.title, {
                  body: n.message,
                  icon: '/icon512_maskable.png'
                });
              } catch (err) {
                console.warn("Browser push notification failed (expected on some mobile browsers):", err);
              }
            };
            showPwaNotification();
          }
        });
      }
    }
    prevNotifCount.current = inAppNotifs.length;
  }, [inAppNotifs]);

  const navItems = role === "teacher" ? TEACHER_NAV : STUDENT_NAV;
  const bottomNavItems = role === "teacher" ? TEACHER_BOTTOM_NAV : STUDENT_BOTTOM_NAV;

  const handleLogout = async () => {
    await logout();
    router.push("/welcome");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const sidebarVariants = {
    hidden: { x: "-100%", transition: { type: "spring" as const, stiffness: 400, damping: 40 } },
    visible: { x: 0, transition: { type: "spring" as const, stiffness: 400, damping: 40 } },
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#07111F] bg-gradient-to-b from-white/[0.02] to-transparent w-[260px] pt-6 pb-6 shadow-[1px_0_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between mb-8 px-6">
        <Link href={`/dashboard/${role}`}>
          <RudraLogo size="sm" showText={true} />
        </Link>
        <button
          className="lg:hidden text-[#7B8798] hover:text-white focus:outline-none p-1"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-2.5 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          if (item.comingSoon) {
            return (
              <div
                key={item.label}
                className="flex items-center justify-between px-3 h-[42px] rounded-xl font-medium text-[#7B8798] cursor-not-allowed opacity-70"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-[18px] h-[18px]" />
                  <span className="text-sm">{item.label}</span>
                </div>
                <span className="text-[11px] uppercase tracking-wider font-medium bg-white/5 text-white/40 px-1.5 py-0.5 rounded">Soon</span>
              </div>
            );
          }
          const showDot = hasNewEvents(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 h-[42px] rounded-xl font-medium transition-all group relative",
                isActive
                  ? "bg-[#5B5CFF]/12 text-[#5B5CFF]"
                  : "text-[#7B8798] hover:text-[#B6C2D9] hover:bg-white/[0.04]"
              )}
            >
              <div className="flex items-center gap-3">
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#5B5CFF] rounded-r-full" />
                )}
                <Icon
                  className={cn(
                    "w-[18px] h-[18px]",
                    isActive ? "text-[#5B5CFF]" : "text-[#7B8798] group-hover:text-[#B6C2D9]"
                  )}
                />
                <span className="text-sm">{item.label}</span>
              </div>
              
              {showDot && (
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 px-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 h-[42px] w-full rounded-xl font-medium text-[13px] text-[#7B8798] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all"
          aria-label="Logout"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Logout
        </button>
      </div>
    </div>
  );

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-[#07111F] text-white flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 border-4 border-white/10 border-t-[#5B5CFF] rounded-full animate-spin" />
          <p className="text-[#B6C2D9] font-medium text-sm">Authenticating...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111F] text-white flex overflow-hidden">
      <Toaster 
        position="top-center" 
        theme="dark" 
        richColors 
        expand={false}
        offset="80px"
        toastOptions={{ 
          className: "font-sans border border-white/10 bg-[#07111F]/90 backdrop-blur-md relative z-[999999]",
          duration: 4000
        }} 
      />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block shrink-0 w-[260px] z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#07111F]/80 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="fixed top-0 left-0 bottom-0 z-50 lg:hidden bg-[#07111F]"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header */}
        <header className="h-[60px] shrink-0 bg-[#07111F]/85 backdrop-blur-[32px] border-b border-white/[0.06] flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-[#7B8798] hover:text-white p-2 -ml-2 rounded-lg hover:bg-white/[0.04] focus:outline-none"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center relative">
              <Search className="w-4 h-4 text-[#7B8798] absolute left-3" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-white/[0.06] border border-white/[0.08] rounded-full pl-9 pr-4 py-1.5 text-sm text-white placeholder-[#7B8798] focus:outline-none focus:border-[#5B5CFF]/50 focus:bg-white/[0.1] transition-all w-56 backdrop-blur-[28px]"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 relative">
            <div className="relative">
              <button
                className="relative p-2 text-[#7B8798] hover:text-white rounded-full hover:bg-white/[0.04] transition-colors focus:outline-none"
                aria-label="Notifications"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications && unreadCount > 0 && currentUser) markAllAsRead(currentUser.id);
                  
                  // Request permission on user interaction (Required for iOS Safari/Mobile)
                  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
                    Notification.requestPermission().then(perm => {
                      if (perm === 'granted' && (window as any)._syncFCMToken) {
                        (window as any)._syncFCMToken();
                      }
                    });
                  }
                }}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-[#EF4444] rounded-full animate-pulse" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-3 border-l border-white/[0.08] pl-4 sm:pl-6">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-white leading-none mb-1">
                  {currentUser?.name || "User"}
                </p>
                <p className="text-[11px] text-[#7B8798] uppercase tracking-wider font-medium">
                  {currentUser?.role || role}
                </p>
              </div>
              <div className="h-9 w-9 rounded-full p-[2px] bg-gradient-to-tr from-[#5B5CFF] to-[#2DD4BF] shrink-0">
                <div className="w-full h-full rounded-full bg-[#07111F] flex items-center justify-center overflow-hidden">
                  {currentUser?.avatar ? (
                    currentUser.avatar?.length < 10 ? (
                      <span className="text-sm font-bold text-white">{currentUser.avatar}</span>
                    ) : (
                      <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    )
                  ) : (
                    <span className="text-sm font-bold text-white">
                      {currentUser?.name ? getInitials(currentUser.name) : "RU"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#07111F] p-4 sm:p-6 lg:p-8 pb-32 lg:pb-8 scroll-smooth relative z-0">
          {children}
        </main>
      </div>

      {/* Notifications Dropdown - Portal-like behavior */}
      <AnimatePresence>
        {showNotifications && (
          <>
            {/* Backdrop for outside click */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden"
              onClick={() => setShowNotifications(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="fixed bottom-24 left-4 right-4 lg:absolute lg:top-16 lg:right-8 lg:bottom-auto lg:left-auto lg:w-80 max-h-[60vh] lg:max-h-[400px] rounded-[18px] border border-white/[0.08] bg-[#131D2E] backdrop-blur-[28px] shadow-2xl overflow-hidden z-50 flex flex-col"
            >
              <div className="p-4 border-b border-white/[0.08] flex flex-col bg-white/[0.02]">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] bg-white/[0.06] px-2 py-0.5 rounded-full text-[#B6C2D9] font-medium">
                      {inAppNotifs.length} new
                    </span>
                    {inAppNotifs.length > 0 && (
                      <button 
                        onClick={() => currentUser && clearAll(currentUser.id, currentUser.role)}
                        className="text-[11px] text-[#EF4444] hover:text-white bg-[#EF4444]/10 hover:bg-[#EF4444]/30 px-2 py-0.5 rounded-full transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-[#7B8798] hover:text-white transition-colors ml-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Push Notification Status Banner */}
                {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
                  <div className="mt-3 p-3 bg-[#5B5CFF]/10 border border-[#5B5CFF]/20 rounded-xl flex flex-col gap-2">
                    <p className="text-[11px] text-[#B6C2D9] leading-relaxed">Enable push notifications to get alerts when the app is closed.</p>
                    {Notification.permission === 'default' ? (
                      <button 
                        onClick={() => {
                          Notification.requestPermission().then(perm => {
                            if (perm === 'granted' && (window as any)._syncFCMToken) {
                              (window as any)._syncFCMToken();
                            }
                            // Force re-render of this banner
                            setShowNotifications(false);
                            setTimeout(() => setShowNotifications(true), 50);
                          });
                        }}
                        className="text-[11px] font-semibold bg-[#5B5CFF] hover:bg-[#4F46E5] transition-colors text-white py-1.5 rounded-lg w-full"
                      >
                        Enable Notifications
                      </button>
                    ) : (
                      <p className="text-[11px] text-[#EF4444] font-medium bg-[#EF4444]/10 p-2 rounded-md">
                        Notifications are blocked in your browser settings.
                      </p>
                    )}
                  </div>
                )}
                {typeof window !== 'undefined' && !('Notification' in window) && (
                  <div className="mt-3 p-3 bg-[#FB923C]/10 border border-[#FB923C]/20 rounded-xl">
                    <p className="text-[11px] text-[#FB923C] leading-relaxed">
                      To get notifications on iPhone/iPad, tap Share <span className="inline-block px-1 border border-[#FB923C]/30 rounded">⎙</span> and select "Add to Home Screen".
                    </p>
                  </div>
                )}
              </div>
            <div className="overflow-y-auto flex-1 p-2">
              {inAppNotifs.length === 0 ? (
                <div className="p-6 text-center text-[#7B8798]">
                  <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">You're all caught up!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {inAppNotifs.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => {
                        if (!n.read) markAsRead(n.id);
                        if (n.link) {
                          router.push(n.link);
                          setShowNotifications(false);
                        }
                      }}
                      className={`p-3 rounded-xl transition-colors hover:bg-white/[0.04] cursor-pointer relative ${!n.read ? 'bg-white/[0.02]' : ''}`}
                    >
                      {!n.read && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-[#5B5CFF] rounded-r-full" />}
                      <div className="flex items-start gap-3 pl-2">
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-0.5">{n.title}</h4>
                          <p className="text-[13px] text-[#B6C2D9] mb-1.5">{n.message}</p>
                          <span className="text-[11px] text-[#7B8798] uppercase tracking-wider font-medium">
                            {formatDate(n.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation Dock */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pointer-events-none">
        <div className="bg-[#07111F]/80 backdrop-blur-[40px] rounded-[22px] border border-white/[0.1] shadow-[0_-4px_32px_rgba(0,0,0,0.4)] p-2 flex items-center justify-between pointer-events-auto">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            const content = (
                <motion.div whileTap={{ scale: 0.9 }} className="flex flex-col items-center justify-center w-full py-1 relative">
                  <div className="relative">
                    <Icon className={cn("w-[22px] h-[22px] mb-0.5 transition-colors", isActive ? "text-[#5B5CFF]" : "text-[#4B5563] group-hover:text-[#7B8798]")} />
                    {item.href === "#notifications" && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#EF4444] rounded-full animate-pulse border-2 border-[#07111F]" />
                    )}
                  </div>
                  <span className={cn("text-[10px] font-medium transition-colors mb-1.5", isActive ? "text-[#5B5CFF]" : "text-[#4B5563] group-hover:text-[#7B8798]")}>
                    {item.label}
                  </span>
                  {isActive && <div className="absolute bottom-0 w-1 h-1 rounded-full bg-[#5B5CFF]" />}
                </motion.div>
            );

            return (
              <Link key={item.label} href={item.href} className="flex-1 flex flex-col items-center group outline-none">
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
