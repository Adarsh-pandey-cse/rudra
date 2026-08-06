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
  const { login, loginWithGoogle } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
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
        router.push("/dashboard/student");
      }
    } else {
      setError(result.error || "Login failed");
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsGoogleLoading(true);
    
    const result = await loginWithGoogle();
    
    if (result.success) {
      const currentUser = useAuthStore.getState().currentUser;
      if (currentUser?.role === "teacher") {
        router.push("/dashboard/teacher");
      } else {
        router.push("/dashboard/student");
      }
    } else if (result.error) {
      setError(result.error);
    }
    setIsGoogleLoading(false);
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
                
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink-0 mx-4 text-[#7B8798] text-sm">Or</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading || isLoading}
                  className="w-full py-4 flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all focus:outline-none disabled:opacity-50 min-h-[44px]"
                >
                  {isGoogleLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-t-2 border-white"></div>
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                      <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                        <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                        <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                        <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                        <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                      </g>
                    </svg>
                  )}
                  Continue with Google
                </button>
              </form>
            </GlassCard>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
