"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedLogo from "@/components/brand/AnimatedLogo";
import BackgroundOrbs from "@/components/brand/BackgroundOrbs";
import { useAuthStore } from "@/store/authStore";

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, currentUser } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated && currentUser) {
        if (currentUser.role === "teacher") {
          router.push("/dashboard/teacher");
        } else {
          router.push("/dashboard/student");
        }
      } else {
        router.push("/welcome");
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, [router, isAuthenticated, currentUser]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#07111F]">
      <BackgroundOrbs />
      
      <div className="absolute top-4 right-4 z-50">
        <button 
          onClick={() => router.push("/welcome")}
          className="px-4 py-2 text-[13px] text-[#7B8798] hover:text-white transition-colors"
          aria-label="Skip intro"
        >
          Skip
        </button>
      </div>

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="z-10 flex flex-col items-center justify-center"
        >
          <AnimatedLogo />
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
