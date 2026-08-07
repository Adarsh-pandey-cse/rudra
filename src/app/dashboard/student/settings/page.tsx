"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings as SettingsIcon, User, Bell, 
  BrainCircuit, Save, CheckCircle2, Shield, Camera, X, LogOut, ArrowLeft
} from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import { useNotifications } from "@/hooks/useNotifications";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import GlassButton from "@/components/ui/GlassButton";
import ImageCropperModal from "@/components/ui/ImageCropperModal";
import StatusBadge from "@/components/ui/StatusBadge";

type Tab = "profile" | "ai_preferences" | "notifications";

export default function StudentSettingsPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, _hasHydrated, updateAvatar, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // AI Pref State
  const [learningStyle, setLearningStyle] = useState("socratic");

  // Notifications
  const { prefs, updatePrefs, requestPermission } = useNotifications();

  // Avatar State
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SMART_EMOJIS = ['👨‍🎓', '👩‍🎓', '🚀', '💡', '🌟', '📚'];

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || currentUser?.role !== "student") {
      router.replace("/auth/login");
      return;
    }
    setMounted(true);
  }, [isAuthenticated, currentUser, router, _hasHydrated]);

  if (!mounted || !currentUser) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (tempAvatar && currentUser) {
        await updateAvatar(currentUser.id, tempAvatar);
      }
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save settings", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setRawImageSrc(event.target.result);
        setCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const handleCropComplete = (croppedImageBase64: string) => {
    setTempAvatar(croppedImageBase64);
    setCropModalOpen(false);
    setRawImageSrc(null);
  };

  const currentDisplayAvatar = tempAvatar !== null ? tempAvatar : (currentUser?.avatar || null);
  
  const containerVariants: any = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
  const itemVariants: any = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

  return (
    <DashboardLayout role="student">
      <div className="max-w-3xl mx-auto space-y-6 pb-24 px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white hover:bg-white/[0.10] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
          </div>
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-sm font-medium"
            >
              <CheckCircle2 className="w-4 h-4" /> Saved
            </motion.div>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
            
            {/* Profile Header */}
            <motion.div variants={itemVariants}>
              <GlassCard className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-full sm:w-auto flex items-center gap-4 sm:gap-6 flex-1">
                  <div className="relative group shrink-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[#5B5CFF] overflow-hidden bg-black/40 relative">
                      {currentDisplayAvatar ? (
                        currentDisplayAvatar.length < 10 ? (
                          <div className="w-full h-full flex items-center justify-center text-3xl">{currentDisplayAvatar}</div>
                        ) : (
                          <img src={currentDisplayAvatar} alt="Profile" className="w-full h-full object-cover" />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white/50 bg-white/5">
                          {currentUser?.name?.charAt(0) || "S"}
                        </div>
                      )}
                      <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white mb-1" />
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleImageUpload}
                          accept="image/jpeg,image/png,image/webp" 
                          className="hidden" 
                        />
                      </label>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-white mb-1 truncate">{currentUser.name}</h2>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="text-sm text-[#7B8798] truncate">@{currentUser.username}</span>
                      <StatusBadge variant="info">Student</StatusBadge>
                    </div>
                  </div>
                </div>
                <div className="w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                  <GradientButton type="submit" className="w-full sm:w-auto px-6 justify-center" disabled={isSaving}>
                    {!isSaving && <Save className="w-4 h-4 mr-2" />}
                    {isSaving ? "Saving..." : "Save Changes"}
                  </GradientButton>
                </div>
              </GlassCard>
            </motion.div>

            {/* Personal Info */}
            <motion.div variants={itemVariants}>
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#5B5CFF]" />
                  Personal Information
                </h3>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                    <span className="text-sm font-medium text-white">Full Name</span>
                    <input 
                      type="text" 
                      defaultValue={currentUser.name}
                      className="w-full sm:w-1/2 bg-transparent text-right text-[#B6C2D9] focus:outline-none placeholder:text-[#7B8798]" 
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                    <span className="text-sm font-medium text-white">Username</span>
                    <input 
                      type="text" 
                      disabled 
                      defaultValue={currentUser.username}
                      className="w-full sm:w-1/2 bg-transparent text-right text-[#7B8798] cursor-not-allowed" 
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                    <span className="text-sm font-medium text-white">Parent Phone</span>
                    <input 
                      type="tel" 
                      defaultValue="+91 98765 43210"
                      className="w-full sm:w-1/2 bg-transparent text-right text-[#B6C2D9] focus:outline-none placeholder:text-[#7B8798]" 
                    />
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* AI Tutor Behavior */}
            <motion.div variants={itemVariants}>
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-[#8B5CF6]" />
                  AI Tutor Behavior
                </h3>
                <div className="space-y-3">
                  {[
                    { id: 'socratic', label: 'Socratic Method', desc: 'Ask me guiding questions' },
                    { id: 'direct', label: 'Direct Answers', desc: 'Give me the final answer immediately' },
                    { id: 'eli5', label: 'Explain Like I\'m 5', desc: 'Use simple analogies' },
                  ].map((style) => (
                    <label key={style.id} className={`flex items-center justify-between p-4 rounded-xl border transition-colors cursor-pointer ${learningStyle === style.id ? 'bg-[#8B5CF6]/10 border-[#8B5CF6]/30' : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.06]'}`}>
                      <div className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name="learning" 
                          value={style.id} 
                          checked={learningStyle === style.id} 
                          onChange={() => setLearningStyle(style.id)} 
                          className="w-4 h-4 accent-[#8B5CF6]" 
                        />
                        <div>
                          <span className="block text-sm font-medium text-white">{style.label}</span>
                          <span className="block text-[13px] text-[#7B8798]">{style.desc}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* Account Security */}
            <motion.div variants={itemVariants}>
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#EF4444]" />
                  Account Security
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  <div>
                    <span className="block text-sm font-medium text-white mb-1">Sign Out</span>
                    <span className="block text-[13px] text-[#7B8798]">Log out of your Rudra account on this device</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => logout()}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/20 text-[#EF4444] text-sm font-medium transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </GlassCard>
            </motion.div>

          </motion.div>
        </form>
      </div>

      <ImageCropperModal
        isOpen={cropModalOpen}
        imageSrc={rawImageSrc}
        onClose={() => setCropModalOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </DashboardLayout>
  );
}
