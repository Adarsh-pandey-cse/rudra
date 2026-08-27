"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useFeeStore } from "@/store/feeStore";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import GlassButton from "@/components/ui/GlassButton";
import { UserPlus, ArrowLeft, RefreshCw, CheckCircle, AlertCircle, Copy, Check, Settings2 } from "lucide-react";
import { motion, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

export default function AddStudentPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, _hasHydrated, registerStudent, getStudentUsers, getAllUsers } = useAuthStore();
  const { updateFeeProfile } = useFeeStore();
  const { updateStudentProfile } = useAuthStore();
  
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState("6th");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [parentPhone, setParentPhone] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [admissionDate, setAdmissionDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Fee State
  const [monthlyFee, setMonthlyFee] = useState("5000");
  const [lateFeeType, setLateFeeType] = useState<"none" | "flat" | "per_day" | "percentage">("per_day");
  const [lateFeeAmount, setLateFeeAmount] = useState("50");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (!isAuthenticated || currentUser?.role !== "teacher") {
      router.replace("/login");
    }
  }, [isAuthenticated, currentUser, router]);

  useEffect(() => {
    if (name && !username && !success) {
      const cleanName = name.replace(/[^a-zA-Z]/g, '');
      if (cleanName.length >= 3) {
        const prefix = cleanName.substring(0, 3);
        const capitalizedPrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();
        
        // Calculate the next serial number
        const studentsCount = getStudentUsers().length;
        const serialNumber = String(studentsCount + 1).padStart(3, '0');
        
        setUsername(`${capitalizedPrefix}${serialNumber}`);
      }
    }
  }, [name, username, success, getStudentUsers]);

  const generatePassword = () => {
    let prefix = "Std";
    if (name) {
      const cleanName = name.replace(/[^a-zA-Z]/g, '');
      if (cleanName.length >= 3) {
        const firstThree = cleanName.substring(0, 3);
        prefix = firstThree.charAt(0).toUpperCase() + firstThree.slice(1).toLowerCase();
      }
    }
    
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    setPassword(`${prefix}${randomDigits}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!name || !username || !password || !grade) {
      setError("Please fill in all required fields.");
      return;
    }

    const res = await registerStudent(name, username, password, grade, parentPhone, fatherName);
    if (res.success) {
      const studentId = res.studentId;
      
      if (studentId) {
        await updateStudentProfile(studentId, { gender } as any);
        const admissionDay = new Date(admissionDate).getDate();
        const preferredDueDate = admissionDay > 28 ? 28 : admissionDay;
        
        updateFeeProfile({
          studentId: studentId,
          monthlyFee: parseFloat(monthlyFee) || 5000,
          paymentFrequency: "monthly",
          preferredDueDate,
          feeStartDate: new Date(admissionDate).toISOString(),
          admissionDate: new Date(admissionDate).toISOString(),
          isActive: true,
          discounts: [],
          lateFeeRule: {
            type: lateFeeType,
            amount: parseFloat(lateFeeAmount) || 0,
            gracePeriodDays: 5
          }
        });
      }
      
      setSuccess(true);
    } else {
      setError(res.error || "Failed to add student.");
    }
  };

  const resetForm = () => {
    setName("");
    setUsername("");
    setPassword("");
    setGrade("6th");
    setParentPhone("");
    setFatherName("");
    setAdmissionDate(new Date().toISOString().split('T')[0]);
    setMonthlyFee("5000");
    setLateFeeType("per_day");
    setLateFeeAmount("50");
    setError("");
    setSuccess(false);
    setCopied(false);
  };

  const copyCredentials = () => {
    navigator.clipboard.writeText(`Username: ${username}\nPassword: ${password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAuthenticated || currentUser?.role !== "teacher") {
    return null;
  }

  const inputClasses = "w-full bg-white/[0.04] border border-white/[0.08] rounded-[14px] px-4 py-3 text-sm text-white placeholder:text-[#7B8798] focus:outline-none focus:ring-2 focus:ring-[#5B5CFF]/50 transition-all";
  const labelClasses = "text-[11px] text-[#7B8798] uppercase tracking-wider font-medium block mb-2";

  return (
    <DashboardLayout role="teacher">
      <motion.div 
        className="max-w-2xl mx-auto space-y-6 pb-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard/teacher/students")} className="p-2 rounded-[14px] bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-[#7B8798] hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Add New Student</h1>
            <p className="text-sm text-[#B6C2D9] mt-1">Register a student and configure their billing profile.</p>
          </div>
        </motion.div>

        {error && (
          <motion.div variants={itemVariants}>
            <GlassCard className="bg-[#EF4444]/10 border-[#EF4444]/30 p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-[#EF4444]" />
                <p className="text-sm text-white font-medium">{error}</p>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {success ? (
          <motion.div variants={itemVariants}>
            <GlassCard className="text-center p-8 space-y-6 border-[#22C55E]/30 bg-[#22C55E]/5">
              <div className="mx-auto w-16 h-16 bg-[#22C55E]/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-[#22C55E]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Student Added Successfully!</h2>
                <p className="text-sm text-[#B6C2D9]">Share these credentials with the student.</p>
              </div>

              <div className="bg-[#07111F] rounded-[14px] p-5 text-left relative group border border-white/[0.08]">
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] text-[#7B8798] uppercase tracking-wider font-medium mb-1">Username</p>
                    <p className="font-mono text-white text-base">{username}</p>
                  </div>
                  <div className="h-px w-full bg-white/[0.08]" />
                  <div>
                    <p className="text-[11px] text-[#7B8798] uppercase tracking-wider font-medium mb-1">Password</p>
                    <p className="font-mono text-white text-base">{password}</p>
                  </div>
                </div>
                <button
                  onClick={copyCredentials}
                  className="absolute top-5 right-5 p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] transition-colors"
                  title="Copy Credentials"
                >
                  {copied ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Copy className="w-4 h-4 text-[#B6C2D9]" />}
                </button>
              </div>

              <div className="pt-2">
                <GradientButton onClick={resetForm} className="w-full py-4 text-sm font-semibold">
                  Add Another Student
                </GradientButton>
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants}>
            <GlassCard className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-5">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4 border-b border-white/[0.08] pb-4">
                    <UserPlus className="w-4 h-4 text-[#5B5CFF]" />
                    Basic Details
                  </h3>

                  <div>
                    <label className={labelClasses}>Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputClasses}
                      placeholder="e.g. Rahul Kumar"
                    />
                  </div>

                  <div>
                    <label className={labelClasses}>Username *</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={inputClasses}
                      placeholder="e.g. rahul.kumar"
                    />
                  </div>

                  <div>
                    <label className={labelClasses}>Password *</label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={inputClasses}
                        placeholder="Min 6 characters"
                      />
                      <button 
                        type="button" 
                        onClick={generatePassword} 
                        className="px-4 rounded-[14px] bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-[#7B8798] hover:text-white transition-colors" 
                        title="Generate Password"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelClasses}>Grade/Class *</label>
                      <select
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className={inputClasses}
                      >
                        {["6th", "7th", "8th", "9th", "10th", "11th", "12th"].map((g) => (
                          <option key={g} value={g}>
                            {g} Grade
                          </option>
                        ))}
                      </select>
                    </div>

                                          <div>
                        <label className={labelClasses}>Gender</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value as any)}
                          className={`${inputClasses} appearance-none`}
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>

                      <div>
                        <label className={labelClasses}>Father's Name (Optional)</label>
                      <input
                        type="text"
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        className={inputClasses}
                        placeholder="e.g. Mr. Kumar"
                      />
                    </div>

                      <div>
                        <label className={labelClasses}>Parent Phone Number *</label>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={parentPhone}
                          onChange={(e) => setParentPhone(e.target.value.replace(/\D/g, ''))}
                          className={inputClasses}
                          placeholder="10-digit number"
                          required
                        />
                      </div>

                    <div className="md:col-span-2">
                      <label className={labelClasses}>Admission Date *</label>
                      <input
                        type="date"
                        required
                        value={admissionDate}
                        onChange={(e) => setAdmissionDate(e.target.value)}
                        className={inputClasses}
                      />
                      <p className="text-[11px] text-[#B6C2D9] mt-1">Fee due date will be generated based on this joining date.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-6 border-b border-white/[0.08] pb-4">
                    <Settings2 className="w-4 h-4 text-[#5B5CFF]" />
                    Billing Configuration
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelClasses}>Monthly Base Fee (₹)</label>
                      <input
                        type="number" required value={monthlyFee} onChange={e => setMonthlyFee(e.target.value)}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Late Fee Type</label>
                      <select
                        value={lateFeeType} onChange={e => setLateFeeType(e.target.value as any)}
                        className={inputClasses}
                      >
                        <option value="none">No Late Fee</option>
                        <option value="flat">Flat Amount</option>
                        <option value="per_day">Per Day Charge</option>
                        <option value="percentage">Percentage</option>
                      </select>
                    </div>
                    {lateFeeType !== "none" && (
                      <div className="md:col-span-2">
                        <label className={labelClasses}>Late Fee Amount</label>
                        <input
                          type="number" required value={lateFeeAmount} onChange={e => setLateFeeAmount(e.target.value)}
                          className={inputClasses}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/[0.08]">
                  <GradientButton type="submit" className="w-full py-4 text-sm font-semibold flex items-center justify-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    <span>Add Student</span>
                  </GradientButton>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
