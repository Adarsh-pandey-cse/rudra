"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Home, CalendarDays, BookOpen, BarChart3, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { name: "Home", href: "/", icon: Home },
  { name: "Planner", href: "/planner", icon: CalendarDays },
  { name: "Classes", href: "/classes", icon: BookOpen },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Profile", href: "/profile", icon: User },
];

export function FloatingNav() {
  const pathname = usePathname();

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md"
    >
      <div className="glass-nav flex items-center justify-between px-6 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
