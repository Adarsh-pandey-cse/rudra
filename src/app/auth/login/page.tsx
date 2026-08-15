"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { User, Lock, Eye, EyeOff, ChevronLeft } from "lucide-react";

import RudraLogo from "@/components/brand/RudraLogo";
import BackgroundOrbs from "@/components/brand/BackgroundOrbs";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import GlassInput from "@/components/ui/GlassInput";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    const result = await login(username, password);
    
    if (result.success) {
      const currentUser = useAuthStore.getState().currentUser;
      if (currentUser?.role === "teacher") {
        router.push("/dashboard/teacher");
      } else {
        if (!currentUser?.pin) {
          router.push("/auth/setup-pin");
        } else {
          router.push("/auth/verify-pin");
        }
      }
    } else {
      setError(result.error || "Login failed");
      setIsLoading(false);
    }
  };

  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
  };

  return (
    <main className="relative min-h-screen flex flex-col bg-[#07111F] px-4 py-8 sm:px-6 overflow-hidden">
      <BackgroundOrbs />
      
      <div className="relative z-10 mx-auto w-full max-w-md flex-1 flex flex-col">
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
          <motion.div variants={itemVariants} className="mb-8 text-center md:text-left">
            <h1 className="text-2xl font-bold text-white mb-2">Sign In to Rudra</h1>
            <p className="text-[#B6C2D9] text-sm">Enter your username and password to continue.</p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard className="p-6 sm:p-8">
              <form className="space-y-5" onSubmit={handleLogin}>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-[14px] bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-sm font-medium"
                  >
                    {error}
                  </motion.div>
                )}
                
                <GlassInput
                  label="Username"
                  icon={<User className="h-4 w-4" />}
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />

                <div className="relative">
                  <GlassInput
                    label="Password"
                    icon={<Lock className="h-4 w-4" />}
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center text-[#7B8798] hover:text-white transition-colors min-h-[44px] min-w-[44px] focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-end pt-1">
                  <Link href="#" className="text-sm text-[#4F9DFF] hover:text-[#5B5CFF] transition-colors">
                    Forgot Password?
                  </Link>
                </div>

                <GradientButton loading={isLoading} className="w-full py-4 text-base font-semibold min-h-[44px]">
                  Sign In
                </GradientButton>
              </form>
            </GlassCard>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
