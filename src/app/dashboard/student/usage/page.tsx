"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/store/authStore";
import { useUsageStore } from "@/store/usageStore";
import { Activity, Calendar as CalendarIcon, Clock } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

const formatTime = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m ${seconds % 60}s`;
};

export default function StudentUsagePage() {
  const { currentUser } = useAuthStore();
  const { fetchUsage } = useUsageStore();
  const [date, setDate] = useState(() => new Date().toLocaleDateString("en-CA"));
  const [time, setTime] = useState<number | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const loadUsage = async () => {
      const t = await fetchUsage(currentUser.id, date);
      setTime(t);
    };
    loadUsage();
  }, [date, currentUser]);

  return (
    <DashboardLayout role="student">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-[#38BDF8]" /> My App Usage
        </h1>
        
        <GlassCard className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="flex items-center gap-3 bg-[#131D2E] p-3 rounded-xl border border-white/[0.05] mb-8">
            <CalendarIcon className="w-5 h-5 text-[#38BDF8]" />
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-white outline-none text-md cursor-pointer"
            />
          </div>

          <div className="w-32 h-32 rounded-full border-4 border-[#38BDF8]/20 flex items-center justify-center relative mb-4">
            <Clock className="w-10 h-10 text-[#38BDF8] absolute top-2 right-2 opacity-20" />
            <div className="text-3xl font-bold text-white">
              {time !== null ? formatTime(time) : "--"}
            </div>
          </div>
          <p className="text-[#7B8798]">Total time spent learning on this date.</p>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
