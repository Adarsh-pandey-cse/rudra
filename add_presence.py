import re

with open("src/components/layout/DashboardLayout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add global presence effect for students
old_effect = """  // Sync FCM token logic
  useEffect(() => {"""

new_effect = """  // Global Presence Tracker for Students
  useEffect(() => {
    if (currentUser?.id && currentUser?.role === "student" && typeof window !== "undefined") {
      const { setOnlineStatus } = useChatStore.getState();
      
      const updatePresence = (isOnline: boolean) => {
        setOnlineStatus(currentUser.id, "student", currentUser.name, isOnline);
      };

      // Mark online when dashboard mounts
      updatePresence(true);

      // Handle tab visibility changes
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          updatePresence(true);
        } else {
          updatePresence(false);
        }
      };

      // Handle window close/refresh
      const handleBeforeUnload = () => {
        updatePresence(false);
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("beforeunload", handleBeforeUnload);

      return () => {
        updatePresence(false);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }
  }, [currentUser?.id, currentUser?.role, currentUser?.name]);

  // Sync FCM token logic
  useEffect(() => {"""

content = content.replace(old_effect, new_effect)

with open("src/components/layout/DashboardLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
