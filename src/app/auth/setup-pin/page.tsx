"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, ChevronLeft } from "lucide-react";

import RudraLogo from "@/components/brand/RudraLogo";
import BackgroundOrbs from "@/components/brand/BackgroundOrbs";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import GlassInput from "@/components/ui/GlassInput";
import { useAuthStore } from "@/store/authStore";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

export default function SetupPinPage() {
  const router = useRouter();
  const { currentUser, setPinVerified } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pin.length !== 6) {
      setError("PIN must be exactly 6 digits.");
      return;
    }
    if (pin !== confirmPin) {
      setError("PINs do not match.");
      return;
    }
    if (!currentUser) {
      setError("You are not logged in.");
      return;
    }

    setIsLoading(true);
    
    try {
      await updateDoc(doc(db, "users", currentUser.id), {
        pin: pin
      });
      // Update local state to reflect verification
      useAuthStore.setState({ currentUser: { ...currentUser, pin: pin } });
      setPinVerified(true);
      
      router.push("/dashboard/student");
    } catch (err: any) {
      console.error(err);
      setError("Failed to set PIN. Please try again.");
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
            onClick={() => {
              useAuthStore.getState().logout();
              router.push("/auth/login");
            }}
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
          <motion.div variants={itemVariants} className="mb-6 text-center">
            <div className="mx-auto w-16 h-16 bg-[#5B5CFF]/10 rounded-full flex items-center justify-center border border-[#5B5CFF]/20 mb-4">
              <Shield className="w-8 h-8 text-[#5B5CFF]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Setup Login PIN</h1>
            <p className="text-[#B6C2D9] text-sm">Create a 6-digit PIN to secure your account.</p>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-6">
            <div className="p-4 rounded-[14px] bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[#F59E0B] text-sm text-center">
              <strong>Remember this PIN always</strong>, it is needed during the login.
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard className="p-6 sm:p-8">
              <form className="space-y-5" onSubmit={handleSetup}>
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
                  label="Create 6-Digit PIN"
                  icon={<Shield className="h-4 w-4" />}
                  placeholder="••••••"
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-xl tracking-[0.5em] font-mono font-bold"
                  required
                />

                <GlassInput
                  label="Confirm PIN"
                  icon={<Shield className="h-4 w-4" />}
                  placeholder="••••••"
                  type="password"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-xl tracking-[0.5em] font-mono font-bold"
                  required
                />

                <GradientButton loading={isLoading} className="w-full py-4 text-base font-semibold min-h-[44px] mt-2">
                  Save PIN & Continue
                </GradientButton>
              </form>
            </GlassCard>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
