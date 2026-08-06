"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, ChevronLeft, Send } from "lucide-react";
import RudraLogo from "@/components/brand/RudraLogo";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import GlassInput from "@/components/ui/GlassInput";

export default function GuestPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", phone: "", message: "" });

  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
  };

  return (
    <main className="relative min-h-screen bg-[#07111F] px-4 py-8 md:p-8">
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8 flex items-center"
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
          className="space-y-8"
        >
          <motion.div variants={itemVariants}>
            <GlassCard className="overflow-hidden p-8 relative">
              <div className="relative z-10 text-center md:text-left">
                <h1 className="mb-2 text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-[#5B5CFF] to-[#2DD4BF] bg-clip-text text-transparent">
                  Rudra Academy
                </h1>
                <p className="text-[#B6C2D9] text-sm mb-8">Excellence in Coaching & Mentorship</p>
                
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-4 text-[#B6C2D9] bg-[#0F172A] p-4 rounded-[14px] border border-white/[0.08]">
                    <Phone className="h-5 w-5 text-[#5B5CFF] shrink-0" />
                    <span className="text-sm">+91 98765 43210</span>
                  </div>
                  <div className="flex items-center gap-4 text-[#B6C2D9] bg-[#0F172A] p-4 rounded-[14px] border border-white/[0.08]">
                    <Mail className="h-5 w-5 text-[#2DD4BF] shrink-0" />
                    <span className="text-sm">admissions@rudraacademy.edu</span>
                  </div>
                  <div className="flex items-center gap-4 text-[#B6C2D9] bg-[#0F172A] p-4 rounded-[14px] border border-white/[0.08]">
                    <MapPin className="h-5 w-5 text-[#22C55E] shrink-0" />
                    <span className="text-sm">123 Learning Avenue, Knowledge Park, City Center</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard className="p-6 md:p-8">
              <h2 className="mb-6 text-lg font-semibold text-white flex items-center gap-2">
                <Send className="h-5 w-5 text-[#5B5CFF]" />
                Request Access
              </h2>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <GlassInput
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <GlassInput
                  label="Phone Number"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
                
                {/* For textarea, assuming GlassInput doesn't support it or standard styling is fine */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#B6C2D9] ml-1">Message (Optional)</label>
                  <textarea
                    placeholder="Enter your message"
                    rows={3}
                    className="w-full resize-none rounded-[14px] border border-white/[0.08] bg-[#0F172A] px-4 py-3 text-sm text-white placeholder-[#7B8798] outline-none transition-all focus:border-[#5B5CFF] focus:bg-white/[0.06] focus:ring-1 focus:ring-[#5B5CFF]"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>
                
                <GradientButton className="w-full py-4 mt-2 font-semibold min-h-[44px]">
                  Submit Request
                </GradientButton>
              </form>
            </GlassCard>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
