"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { KeyRound, ChevronLeft, LogOut } from "lucide-react";
import Link from "next/link";

import RudraLogo from "@/components/brand/RudraLogo";
import BackgroundOrbs from "@/components/brand/BackgroundOrbs";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import GlassInput from "@/components/ui/GlassInput";
import { useAuthStore } from "@/store/authStore";

export default function VerifyPinPage() {
  const router = useRouter();
  const { currentUser, setPinVerified, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e?: React.FormEvent, pinToVerify?: string) => {
    if (e) e.preventDefault();
    setError(null);

    const currentPin = pinToVerify || pin;
    if (currentPin.length !== 6) {
      setError("PIN must be exactly 6 digits.");
      return;
    }
    if (!currentUser) {
      setError("You are not logged in.");
      return;
    }

    setIsLoading(true);
    
    // Simulate slight network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 600));

    if (currentPin === currentUser.pin) {
      setPinVerified(true);
      router.push(`/dashboard/${currentUser.role}`);
    } else {
      setError("Incorrect PIN. Please try again.");
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
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
          className="mb-10 flex items-center justify-between"
        >
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.06] text-[#7B8798] hover:bg-white/[0.10] hover:text-[#EF4444] transition-all border border-white/[0.08]"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
            <div className="ml-4">
              <RudraLogo size="sm" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 flex flex-col justify-center pb-12"
        >
          <motion.div variants={itemVariants} className="mb-6 text-center">
            <div className="mx-auto w-16 h-16 bg-[#10B981]/10 rounded-full flex items-center justify-center border border-[#10B981]/20 mb-4">
              <KeyRound className="w-8 h-8 text-[#10B981]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back, {currentUser?.name?.split(' ')[0]}</h1>
            <p className="text-[#B6C2D9] text-sm">Enter your 6-digit PIN to continue.</p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard className="p-6 sm:p-8">
              <form className="space-y-5" onSubmit={handleVerify}>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-[14px] bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-sm font-medium text-center"
                  >
                    {error}
                  </motion.div>
                )}
                
                <GlassInput
                  label="Enter PIN"
                  icon={<KeyRound className="h-4 w-4" />}
                  placeholder="••••••"
                  type="tel"
                  autoComplete="off"
                  style={{ WebkitTextSecurity: "disc" } as any}
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setPin(val);
                    if (val.length === 6) {
                      handleVerify(undefined, val);
                    }
                  }}
                  className="text-center text-xl tracking-[0.5em] font-mono font-bold"
                  autoFocus
                  required
                />

                <div className="flex items-center justify-end pt-1">
                  <Link href="/auth/reset-pin" className="text-sm text-[#4F9DFF] hover:text-[#5B5CFF] transition-colors">
                    Forgot PIN?
                  </Link>
                </div>

                {isLoading ? (
                  <div className="flex justify-center items-center py-4 mt-2">
                    <div className="w-6 h-6 border-2 border-[#5B5CFF]/30 border-t-[#5B5CFF] rounded-full animate-spin" />
                  </div>
                ) : pin.length !== 6 && (
                  <GradientButton className="w-full py-4 text-base font-semibold min-h-[44px] mt-2 opacity-50 cursor-not-allowed">
                    Enter 6 digits...
                  </GradientButton>
                )}
              </form>
            </GlassCard>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}


