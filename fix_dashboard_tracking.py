import re

with open("src/components/layout/DashboardLayout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'import { useNotificationStore } from "@/store/notificationStore";',
    'import { useNotificationStore } from "@/store/notificationStore";\nimport { useUsageStore } from "@/store/usageStore";'
)

content = re.sub(
    r'(useEffect\(\(\) => \{\n\s*if \(!mounted \|\| !currentUser\) return;\n\s*)',
    r'\1const { startTracking, stopTracking } = useUsageStore.getState();\n    startTracking(currentUser.id);\n    \n    ',
    content
)

content = re.sub(
    r'(return \(\) => \{\n\s*if \(\(window as any\)\.__notificationUnsub\) \{)',
    r'return () => {\n      stopTracking();\n      if ((window as any).__notificationUnsub) {',
    content
)

with open("src/components/layout/DashboardLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
