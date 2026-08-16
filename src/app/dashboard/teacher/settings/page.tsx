"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { 
  Settings as SettingsIcon, Bell, Palette, 
  Shield, Building2, Save, CheckCircle2, LogOut, Star, MessageSquare
} from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import { useDoubtStore } from "@/store/doubtStore";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import GlassButton from "@/components/ui/GlassButton";
import ImageCropper from "@/components/ui/ImageCropper";
import { Camera, Trash2 } from "lucide-react";

type Tab = "profile" | "feedback" | "notifications" | "appearance" | "security";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function TeacherSettingsPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, _hasHydrated, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Avatar states
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);

  const { doubts } = useDoubtStore();
  const teacherFeedbacks = doubts
    .filter(d => d.resolvedBy === currentUser?.id && d.studentRating !== null)
    .sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const averageRating = teacherFeedbacks.length > 0 
    ? (teacherFeedbacks.reduce((acc, d) => acc + (d.studentRating || 0), 0) / teacherFeedbacks.length).toFixed(1)
    : "0.0";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCropperSrc(reader.result?.toString() || null);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImageBase64: string) => {
    setAvatarPreview(croppedImageBase64);
    setCropperSrc(null);
  };

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || currentUser?.role !== "teacher") {
      // router.replace("/auth/login"); /* Handled by DashboardLayout */
      return;
    }
    setMounted(true);
  }, [isAuthenticated, currentUser, router, _hasHydrated]);

  if (!mounted || !currentUser) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (avatarPreview && currentUser) {
        await useAuthStore.getState().updateAvatar(currentUser.id, avatarPreview);
      }
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save settings", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
      await logout();
      router.replace("/");
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Institute Profile", icon: Building2 },
    { id: "feedback", label: "Student Feedback", icon: MessageSquare },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <DashboardLayout role="teacher">
      <motion.div 
        className="max-w-5xl mx-auto space-y-8 pb-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-[#7B8798]" />
            Settings
          </h1>
          <p className="text-[13px] text-[#B6C2D9]">Manage your institute profile and application preferences.</p>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-6">
          
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 shrink-0 space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-[14px] transition-all text-sm ${
                      isActive 
                        ? "bg-[#5B5CFF]/10 text-[#5B5CFF] border border-[#5B5CFF]/20" 
                        : "text-[#B6C2D9] hover:text-white hover:bg-white/[0.04] border border-transparent"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
            
            <div className="pt-8">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-[14px] transition-all text-sm text-[#EF4444] hover:bg-[#EF4444]/10 border border-transparent hover:border-[#EF4444]/20"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <GlassCard className="p-8 min-h-[500px]">
              <form onSubmit={handleSave} className="space-y-8 h-full flex flex-col">
                
                <div className="flex-1">
                  {/* Profile Tab */}
                  {activeTab === "profile" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <h2 className="text-lg font-semibold text-white mb-6">Institute Details</h2>
                      
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
                        <div className="relative group">
                          <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                            {avatarPreview || currentUser?.avatar ? (
                              <img src={avatarPreview || currentUser?.avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-3xl text-white font-bold">{currentUser?.name?.substring(0,2).toUpperCase()}</span>
                            )}
                          </div>
                          <label className="absolute bottom-0 right-0 p-2 bg-[#5B5CFF] rounded-full cursor-pointer hover:bg-[#5B5CFF]/80 transition-colors shadow-lg">
                            <Camera className="w-4 h-4 text-white" />
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                          </label>
                        </div>
                        <div className="text-center sm:text-left">
                          <h3 className="text-white font-medium mb-1">Profile Picture</h3>
                          <p className="text-[13px] text-[#B6C2D9] mb-3">Upload a square image, recommended size 256x256.</p>
                          {avatarPreview && (
                            <button type="button" onClick={() => setAvatarPreview(null)} className="text-xs text-[#EF4444] hover:text-[#EF4444]/80 flex items-center gap-1 mx-auto sm:mx-0">
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[13px] text-[#7B8798]">Teacher / Admin Name</label>
                          <input type="text" defaultValue={currentUser.name} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5B5CFF]/50 transition-colors" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[13px] text-[#7B8798]">Email Address</label>
                          <input type="email" defaultValue={`${currentUser.username}@rudra.com`} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5B5CFF]/50 transition-colors" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[13px] text-[#7B8798]">Institute / Coaching Name</label>
                          <input type="text" defaultValue="Rudra Academy" className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5B5CFF]/50 transition-colors" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[13px] text-[#7B8798]">Contact Number</label>
                          <input type="tel" defaultValue="+91 98765 43210" className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5B5CFF]/50 transition-colors" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[13px] text-[#7B8798]">Gemini API Key (for AI features)</label>
                          <input 
                            type="password" 
                            placeholder="AIzaSy..." 
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5B5CFF]/50 transition-colors" 
                            onChange={(e) => {
                              if(typeof window !== "undefined") {
                                localStorage.setItem('rudra_gemini_api_key', e.target.value);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Feedback Tab */}
                  {activeTab === "feedback" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <h2 className="text-lg font-semibold text-white mb-6">Student Feedback & Ratings</h2>
                      
                      <div className="flex items-center gap-6 p-6 rounded-2xl bg-[#5B5CFF]/10 border border-[#5B5CFF]/20 mb-8">
                        <div className="flex flex-col items-center justify-center shrink-0">
                          <div className="flex items-end gap-1">
                            <span className="text-4xl font-bold text-white">{averageRating}</span>
                            <span className="text-lg text-[#7B8798] mb-1">/10</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star key={star} className={`w-4 h-4 ${star <= (parseFloat(averageRating) / 2) ? "fill-[#FB923C] text-[#FB923C]" : "text-[#7B8798]/30"}`} />
                            ))}
                          </div>
                          <span className="text-[11px] text-[#7B8798] mt-2">{teacherFeedbacks.length} total reviews</span>
                        </div>
                        <div className="h-16 w-px bg-white/[0.08]" />
                        <div>
                          <h3 className="text-white font-medium mb-1">Your Impact</h3>
                          <p className="text-sm text-[#B6C2D9]">Only you can see this feedback. These ratings are from students whose doubts you have directly resolved.</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-white mb-4">Recent Reviews</h3>
                        {teacherFeedbacks.length === 0 ? (
                          <div className="text-center py-8 text-[#7B8798] text-sm bg-white/[0.02] rounded-xl border border-white/[0.04]">
                            No feedback received yet. Resolve doubts to get rated!
                          </div>
                        ) : (
                          teacherFeedbacks.map(doubt => (
                            <div key={doubt.id} className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F9DFF] to-[#5B5CFF] flex items-center justify-center text-white text-xs font-bold">
                                    {doubt.studentName.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-white">{doubt.studentName}</p>
                                    <p className="text-[10px] text-[#7B8798]">{doubt.subjectName} • {new Date(doubt.updatedAt).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.08]">
                                  <Star className="w-3.5 h-3.5 fill-[#FB923C] text-[#FB923C]" />
                                  <span className="text-xs font-bold text-white">{doubt.studentRating}/10</span>
                                </div>
                              </div>
                              
                              {doubt.studentFeedback ? (
                                <div className="bg-[#131D2E] p-3 rounded-lg border border-white/[0.04]">
                                  <p className="text-sm text-[#B6C2D9] italic">"{doubt.studentFeedback}"</p>
                                </div>
                              ) : (
                                <p className="text-[11px] text-[#7B8798] italic">No written feedback provided.</p>
                              )}
                              
                              <div className="mt-3 text-[10px] text-[#7B8798] flex items-center gap-1.5 border-t border-white/[0.04] pt-2">
                                <span className="font-medium text-[#5B5CFF]">Q:</span> 
                                <span className="truncate max-w-md">{doubt.question}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Notifications Tab */}
                  {activeTab === "notifications" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <h2 className="text-lg font-semibold text-white mb-6">Alert Preferences</h2>
                      
                      <div className="space-y-4">
                        {[
                          { title: "Daily Revenue Summary", desc: "Receive an email every evening with collection stats." },
                          { title: "Late Fee Alerts", desc: "Get notified when a student crosses their fee grace period." },
                          { title: "Homework Completion", desc: "Weekly summary of class homework performance." },
                          { title: "AI Diagnostic Alerts", desc: "Proactive warnings if a student is falling behind." }
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]">
                            <div>
                              <p className="text-sm font-medium text-white">{item.title}</p>
                              <p className="text-[13px] text-[#7B8798]">{item.desc}</p>
                            </div>
                            <div className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors ${i < 2 ? 'bg-[#22C55E]' : 'bg-white/10'}`}>
                              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${i < 2 ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Appearance Tab */}
                  {activeTab === "appearance" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <h2 className="text-lg font-semibold text-white mb-6">Theme Settings</h2>
                      
                      <div className="space-y-6">
                        <div>
                          <p className="text-[13px] text-[#7B8798] mb-3">Color Mode</p>
                          <div className="flex gap-4">
                            <div className="border border-[#5B5CFF] bg-[#5B5CFF]/10 text-[#5B5CFF] px-6 py-3 rounded-xl flex items-center justify-center text-sm font-medium cursor-pointer">Dark (Default)</div>
                            <div className="border border-white/[0.08] bg-white/[0.02] text-[#7B8798] px-6 py-3 rounded-xl flex items-center justify-center text-sm font-medium cursor-not-allowed">Light (Coming Soon)</div>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-[13px] text-[#7B8798] mb-3">Accent Color</p>
                          <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#5B5CFF] ring-2 ring-white ring-offset-2 ring-offset-[#131D2E] cursor-pointer"></div>
                            <div className="w-10 h-10 rounded-full bg-[#22C55E] opacity-50 cursor-pointer hover:opacity-100 transition-opacity"></div>
                            <div className="w-10 h-10 rounded-full bg-[#8B5CF6] opacity-50 cursor-pointer hover:opacity-100 transition-opacity"></div>
                            <div className="w-10 h-10 rounded-full bg-[#EF4444] opacity-50 cursor-pointer hover:opacity-100 transition-opacity"></div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Security Tab */}
                  {activeTab === "security" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <h2 className="text-lg font-semibold text-white mb-6">Security Settings</h2>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[13px] text-[#7B8798]">Current Password</label>
                          <input type="password" placeholder="••••••••" className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5B5CFF]/50 transition-colors" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[13px] text-[#7B8798]">New Password</label>
                          <input type="password" placeholder="Min 8 characters" className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5B5CFF]/50 transition-colors" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
                
                <div className="pt-6 border-t border-white/[0.08] flex items-center justify-between">
                  {showSuccess && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-[#22C55E] text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" /> Settings Saved
                    </motion.div>
                  )}
                  <div className="ml-auto flex gap-3">
                    <GradientButton type="submit" disabled={isSaving}>
                      {isSaving ? "Saving..." : <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Save Changes</span>}
                    </GradientButton>
                  </div>
                </div>
              </form>
            </GlassCard>
          </div>
        </motion.div>
      </motion.div>

      {cropperSrc && (
        <ImageCropper
          imageSrc={cropperSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropperSrc(null)}
        />
      )}
    </DashboardLayout>
  );
}
