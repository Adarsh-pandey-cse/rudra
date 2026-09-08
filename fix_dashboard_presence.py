with open("src/components/layout/DashboardLayout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Find the Global Presence Tracker and replace it with Usage Tracker
import re
presence_tracker_regex = re.compile(r'// Global Presence Tracker for Students\s*useEffect\(\(\) => \{\s*if \(currentUser\?\.id.*?\}\s*\}, \[currentUser\?\.id, currentUser\?\.role, currentUser\?\.name\]\);', re.DOTALL)

usage_tracker = '''// Usage Time Tracker
  useEffect(() => {
    if (currentUser?.id && typeof window !== "undefined") {
      let isMounted = true;
      import("@/store/usageStore").then(({ useUsageStore }) => {
        if (!isMounted) return;
        useUsageStore.getState().startTracking(currentUser.id);
      });
      return () => {
        isMounted = false;
        import("@/store/usageStore").then(({ useUsageStore }) => {
          useUsageStore.getState().stopTracking();
        });
      };
    }
  }, [currentUser?.id]);'''

content = presence_tracker_regex.sub(usage_tracker, content)

with open("src/components/layout/DashboardLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
