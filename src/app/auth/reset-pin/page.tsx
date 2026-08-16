"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, ChevronLeft, User, Lock, Phone } from "lucide-react";

import RudraLogo from "@/components/brand/RudraLogo";
import BackgroundOrbs from "@/components/brand/BackgroundOrbs";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import GlassInput from "@/components/ui/GlassInput";
import { useAuthStore } from "@/store/authStore";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { Student } from "@/types";

export default function ResetPinPage() {
  const router = useRouter();
  const { currentUser, setPinVerified } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  // Step 1: Verification
  const [username, setUsername] = useState(currentUser?.username || "");
  const [password, setPassword] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  
  // Step 2: New PIN
  const [isVerified, setIsVerified] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  
  const [error, setError] = useState<string | null>(null);

  const handleVerifyDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!currentUser) {
      setError("Please log in first to reset your PIN.");
      setIsLoading(false);
      return;
    }

    // Verify username and password first
    let isPasswordCorrect = false;
    
    if (currentUser.role === 'teacher' && !currentUser.password) {
      const isAdarsh = currentUser.username.toLowerCase() === "adarsh@77";
      const isAkansha = currentUser.username.toLowerCase() === "akansha@27";
      
      if (isAdarsh && password === "Master@99") isPasswordCorrect = true;
      else if (isAkansha && password === "Madam@88") isPasswordCorrect = true;
    } else {
      isPasswordCorrect = currentUser.password === password;
    }

    if (currentUser.username !== username) {
      setError("Incorrect username.");
    } else if (!isPasswordCorrect) {
      setError("Incorrect password.");
    } else {
      // Validate phone number based on role
      if (currentUser.role === 'teacher') {
        if (parentPhone !== "8800795476" && parentPhone !== "7011811671") {
          setError("Incorrect authorized teacher phone number.");
        } else {
          setIsVerified(true);
          setError(null);
        }
      } else {
        const student = currentUser as Student;
        if (student.parentPhone !== parentPhone) {
          setError("Incorrect parent phone number.");
        } else {
          setIsVerified(true);
          setError(null);
        }
      }
    }
    
    setIsLoading(false);
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPin.length !== 6) {
      setError("PIN must be exactly 6 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setError("PINs do not match.");
      return;
    }
    if (!currentUser) return;

    setIsLoading(true);
    
    try {
      await updateDoc(doc(db, "users", currentUser.id), {
        pin: newPin
      });
      // Update local state to reflect verification
      useAuthStore.setState({ currentUser: { ...currentUser, pin: newPin } });
      setPinVerified(true);
      
      router.push(`/dashboard/${currentUser.role}`);
    } catch (err: any) {
      console.error(err);
      setError("Failed to reset PIN. Please try again.");
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
    exit: { opacity: 0, y: -16, transition: { duration: 0.2 } }
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
            onClick={() => router.push(isVerified ? "/auth/reset-pin" : "/auth/verify-pin")}
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
            <div className="mx-auto w-16 h-16 bg-[#4F9DFF]/10 rounded-full flex items-center justify-center border border-[#4F9DFF]/20 mb-4">
              <KeyRound className="w-8 h-8 text-[#4F9DFF]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Reset Login PIN</h1>
            <p className="text-[#B6C2D9] text-sm">
              {isVerified ? "Create a new 6-digit PIN." : "Verify your identity to reset your PIN."}
            </p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard className="p-6 sm:p-8">
              <AnimatePresence mode="wait">
                {!isVerified ? (
                  <motion.form 
                    key="verify-form"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-5" 
                    onSubmit={handleVerifyDetails}
                  >
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
                      placeholder="Enter username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />

                    <GlassInput
                      label="Password"
                      icon={<Lock className="h-4 w-4" />}
                      placeholder="Enter password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />

                    <GlassInput
                      label={currentUser?.role === 'teacher' ? "Authorized Phone Number" : "Parent Phone Number"}
                      icon={<Phone className="h-4 w-4" />}
                      placeholder="Enter 10-digit number"
                      type="number"
                      inputMode="numeric"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value.replace(/\D/g, ''))}
                      required
                    />

                    <GradientButton loading={isLoading} className="w-full py-4 text-base font-semibold min-h-[44px] mt-2">
                      Verify Identity
                    </GradientButton>
                  </motion.form>
                ) : (
                  <motion.form 
                    key="reset-form"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-5" 
                    onSubmit={handleResetPin}
                  >
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-[14px] bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-sm font-medium text-center"
                      >
                        {error}
                      </motion.div>
                    )}
                    
                    <div className="p-4 rounded-[14px] bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-sm text-center mb-6">
                      Identity verified successfully!
                    </div>

                    <GlassInput
                      label="Create New 6-Digit PIN"
                      icon={<KeyRound className="h-4 w-4" />}
                      placeholder="••••••"
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      className="text-center text-xl tracking-[0.5em] font-mono font-bold"
                      autoFocus
                      required
                    />

                    <GlassInput
                      label="Confirm New PIN"
                      icon={<KeyRound className="h-4 w-4" />}
                      placeholder="••••••"
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      className="text-center text-xl tracking-[0.5em] font-mono font-bold"
                      required
                    />

                    <GradientButton loading={isLoading} className="w-full py-4 text-base font-semibold min-h-[44px] mt-2">
                      Save New PIN
                    </GradientButton>
                  </motion.form>
                )}
              </AnimatePresence>
            </GlassCard>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
