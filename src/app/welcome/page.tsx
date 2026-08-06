"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Brain, Target, Activity } from "lucide-react";
import RudraLogo from "@/components/brand/RudraLogo";
import BackgroundOrbs from "@/components/brand/BackgroundOrbs";
import GradientButton from "@/components/ui/GradientButton";
import GlassButton from "@/components/ui/GlassButton";
import GlassCard from "@/components/ui/GlassCard";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";

const features = [
  {
    icon: <Brain className="w-5 h-5 text-[#5B5CFF]" />,
    title: "AI-Powered Planning",
    desc: "Intelligent schedules tailored to you.",
    bg: "bg-[#5B5CFF]/10",
  },
  {
    icon: <Activity className="w-5 h-5 text-[#2DD4BF]" />,
    title: "Smart Revision",
    desc: "Adaptive spaced repetition algorithms.",
    bg: "bg-[#2DD4BF]/10",
  },
  {
    icon: <Target className="w-5 h-5 text-[#4F9DFF]" />,
    title: "Complete Visibility",
    desc: "Track progress and master subjects.",
    bg: "bg-[#4F9DFF]/10",
  },
];

const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

export default function WelcomePage() {
  const router = useRouter();
  const { isAuthenticated, currentUser } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (currentUser.role === "teacher") router.push("/dashboard/teacher");
      else router.push("/dashboard/student");
    }
  }, [isAuthenticated, currentUser, router]);

  return (
    <main className="relative flex min-h-screen flex-col items-center px-4 py-12 overflow-hidden bg-[#07111F] sm:px-6">
      <BackgroundOrbs />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="z-10 flex w-full max-w-md flex-col items-center"
      >
        <motion.div variants={itemVariants} className="mb-10 mt-8">
          <RudraLogo size="lg" />
        </motion.div>

        <motion.div variants={itemVariants} className="mb-12 text-center">
          <h1 className="mb-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
            <span className="bg-gradient-to-r from-[#5B5CFF] to-[#2DD4BF] bg-clip-text text-transparent">Master Learning.</span> Every Day.
          </h1>
          <p className="text-[#B6C2D9] text-sm max-w-sm mx-auto">
            Your intelligent academic operating system.
          </p>
        </motion.div>

        <div className="w-full space-y-4 mb-14">
          {features.map((feat, idx) => (
            <motion.div key={idx} variants={itemVariants}>
              <GlassCard hoverEffect className="flex items-center p-5 gap-4">
                <div className={`flex-shrink-0 p-3 rounded-xl border border-white/[0.08] ${feat.bg}`}>
                  {feat.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{feat.title}</h3>
                  <p className="text-[#B6C2D9] text-sm mt-0.5">{feat.desc}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <motion.div variants={itemVariants} className="w-full space-y-4 mt-auto">
          <GradientButton 
            className="w-full py-4 text-base font-semibold min-h-[44px]"
            onClick={() => router.push("/auth/login")}
          >
            Get Started
          </GradientButton>
          <GlassButton 
            className="w-full py-4 text-sm min-h-[44px]"
            onClick={() => router.push("/guest")}
          >
            Continue as Guest
          </GlassButton>
        </motion.div>
      </motion.div>
    </main>
  );
}
