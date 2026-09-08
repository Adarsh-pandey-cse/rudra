"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/store/authStore";
import { useUsageStore } from "@/store/usageStore";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Activity, Clock, Search, User } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

const formatTime = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m ${seconds % 60}s`;
};

export default function TeacherUsagePage() {
  const { getAllUsers } = useAuthStore();
  const { fetchUsage } = useUsageStore();
  const [date, setDate] = useState(() => new Date().toLocaleDateString("en-CA"));
  const [search, setSearch] = useState("");
  const [usages, setUsages] = useState<{ id: string, name: string, time: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const students = getAllUsers().filter(u => u.role === "student");

  useEffect(() => {
    const loadUsage = async () => {
      setLoading(true);
      const data = await Promise.all(
        students.map(async (student) => {
          const time = await fetchUsage(student.id, date);
          return { id: student.id, name: student.name, time };
        })
      );
      setUsages(data.sort((a, b) => b.time - a.time));
      setLoading(false);
    };
    loadUsage();
  }, [date]); // React on date change

  const filtered = usages.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout role="teacher">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-[#38BDF8]" /> App Usage Analytics
            </h1>
            <p className="text-sm text-[#7B8798] mt-1">Monitor daily student engagement time.</p>
          </div>
          <div className="flex items-center gap-3 bg-[#131D2E] p-2 rounded-xl border border-white/[0.05]">
            <CalendarIcon className="w-5 h-5 text-[#38BDF8]" />
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-white outline-none text-sm cursor-pointer"
            />
          </div>
        </div>

        <GlassCard className="p-6">
          <div className="relative mb-6">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7B8798]" />
            <input
              type="text"
              placeholder="Search student..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-[#38BDF8]/50 transition-colors"
            />
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="text-center text-[#7B8798] py-8">Loading usage data...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-[#7B8798] py-8">No usage data found for this date.</div>
            ) : (
              filtered.map((u, i) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center font-bold">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-medium">{u.name}</p>
                      <p className="text-[12px] text-[#7B8798]">Student</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#38BDF8]" />
                    <span className="text-[#B6C2D9] font-medium">{formatTime(u.time)}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
