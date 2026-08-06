"use client";

import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { GraduationCap, BookOpen, ChevronLeft } from "lucide-react";
import RudraLogo from "@/components/brand/RudraLogo";
import BackgroundOrbs from "@/components/brand/BackgroundOrbs";
import GlassCard from "@/components/ui/GlassCard";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function RoleSelectionPage() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen flex flex-col bg-[#07111F] px-4 py-8 sm:px-6 overflow-hidden">
      <BackgroundOrbs />
      
      <div className="relative z-10 mx-auto w-full max-w-4xl flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-10 flex items-center"
        >
          <button
            onClick={() => router.push("/welcome")}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.06] text-[#7B8798] hover:bg-white/[0.10] hover:text-white transition-all border border-white/[0.08]"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="ml-4">
            <RudraLogo size="sm" />
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 flex flex-col justify-center pb-12"
        >
          <motion.div variants={itemVariants} className="mb-12 text-center md:text-left">
            <h1 className="text-2xl font-bold text-white mb-2">I am a...</h1>
            <p className="text-[#B6C2D9] text-sm">Select your role to continue.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div variants={itemVariants}>
              <GlassCard 
                hoverEffect 
                onClick={() => router.push("/auth/login?role=teacher")}
                className="p-8 cursor-pointer group flex flex-col items-center text-center md:items-start md:text-left border-white/[0.08] hover:border-[#5B5CFF]/50 hover:shadow-[0_0_20px_rgba(91,92,255,0.15)] transition-all duration-300 min-h-[44px]"
              >
                <div className="mb-6 p-4 rounded-[14px] bg-[#5B5CFF]/10 border border-[#5B5CFF]/20 group-hover:scale-110 transition-transform duration-300">
                  <GraduationCap className="h-6 w-6 text-[#5B5CFF]" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">Teacher</h2>
                <p className="text-sm text-[#B6C2D9]">Plan, assess, and track</p>
              </GlassCard>
            </motion.div>

            <motion.div variants={itemVariants}>
              <GlassCard 
                hoverEffect 
                onClick={() => router.push("/auth/login?role=student")}
                className="p-8 cursor-pointer group flex flex-col items-center text-center md:items-start md:text-left border-white/[0.08] hover:border-[#4F9DFF]/50 hover:shadow-[0_0_20px_rgba(79,157,255,0.15)] transition-all duration-300 min-h-[44px]"
              >
                <div className="mb-6 p-4 rounded-[14px] bg-[#4F9DFF]/10 border border-[#4F9DFF]/20 group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="h-6 w-6 text-[#4F9DFF]" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">Student</h2>
                <p className="text-sm text-[#B6C2D9]">Learn, practice, and master</p>
              </GlassCard>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
