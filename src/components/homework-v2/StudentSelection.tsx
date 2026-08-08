"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CheckCircle2, Circle, Filter } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getMasteryLevel, getMasteryColor } from "@/types";
import type { Student } from "@/types";

interface StudentSelectionProps {
  classId: string;
  selectedStudentIds: string[];
  onChange: (ids: string[]) => void;
}

type FilterType = "All" | "Weak" | "Top" | "Absent" | "Low Homework" | "Needs Revision";

export default function StudentSelection({ classId, selectedStudentIds, onChange }: StudentSelectionProps) {
  const { getAllUsers } = useAuthStore();
  
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");

  // Fetch all students for this class and mock some dynamic stats for UI demonstration
  const allStudents = useMemo(() => {
    return getAllUsers()
      .filter((u): u is Student => u.role === "student" && u.status !== "archived" && u.status !== "deleted" && (u as Student).classId === classId)
      .map(s => {
        // Mock data for UI demonstration based on user id length to make it deterministic
        const mockScore = (s.id.length * 7) % 100;
        const mockHw = (s.id.length * 13) % 100;
        const mockAttendance = 80 + (s.id.length % 20);
        return {
          ...s,
          attendance: mockAttendance,
          homeworkCompletion: mockHw,
          masteryScore: mockScore,
          masteryLevel: getMasteryLevel(mockScore)
        };
      });
  }, [classId, getAllUsers]);

  // Apply Search & Filters
  const filteredStudents = useMemo(() => {
    let result = allStudents;

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(lower) || 
        s.username.toLowerCase().includes(lower) ||
        s.id.toLowerCase().includes(lower)
      );
    }

    switch (activeFilter) {
      case "Weak": result = result.filter(s => s.masteryLevel === "weak" || s.masteryLevel === "learning"); break;
      case "Top": result = result.filter(s => s.masteryLevel === "mastered"); break;
      case "Absent": result = result.filter(s => s.attendance < 85); break;
      case "Low Homework": result = result.filter(s => s.homeworkCompletion < 70); break;
      case "Needs Revision": result = result.filter(s => s.masteryLevel === "practicing"); break;
    }

    return result;
  }, [allStudents, search, activeFilter]);

  const allSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedStudentIds.includes(s.id));
  
  const toggleAll = () => {
    if (allSelected) {
      // Remove currently filtered from selection
      const newSelection = selectedStudentIds.filter(id => !filteredStudents.find(s => s.id === id));
      onChange(newSelection);
    } else {
      // Add all filtered to selection
      const newSelection = Array.from(new Set([...selectedStudentIds, ...filteredStudents.map(s => s.id)]));
      onChange(newSelection);
    }
  };

  const toggleOne = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      onChange(selectedStudentIds.filter(sid => sid !== id));
    } else {
      onChange([...selectedStudentIds, id]);
    }
  };

  const filters: FilterType[] = ["All", "Weak", "Top", "Absent", "Low Homework", "Needs Revision"];

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input 
            type="text" 
            placeholder="Search by name, roll, ID..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-6 text-sm">
          <div className="flex flex-col items-end">
            <span className="text-white/50 text-xs">Selected</span>
            <span className="font-bold text-blue-400 text-lg leading-none">{selectedStudentIds.length}</span>
          </div>
          <div className="w-px h-8 bg-white/10"></div>
          <div className="flex flex-col items-end">
            <span className="text-white/50 text-xs">Removed</span>
            <span className="font-bold text-rose-400 text-lg leading-none">
              {allStudents.length - selectedStudentIds.length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        <Filter className="w-4 h-4 text-white/40 mr-2 self-center" />
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeFilter === f 
                ? "bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.4)]" 
                : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white/5 text-white/60 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 w-12 cursor-pointer" onClick={toggleAll}>
                {allSelected ? <CheckCircle2 className="w-5 h-5 text-blue-400" /> : <Circle className="w-5 h-5 text-white/20 hover:text-white/40" />}
              </th>
              <th className="px-6 py-4 font-medium">Student</th>
              <th className="px-6 py-4 font-medium">Attendance</th>
              <th className="px-6 py-4 font-medium">Homework</th>
              <th className="px-6 py-4 font-medium">Mastery</th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                    No students match the current filters.
                  </td>
                </tr>
              )}
              {filteredStudents.map((student, i) => {
                const isSelected = selectedStudentIds.includes(student.id);
                return (
                  <motion.tr 
                    key={student.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => toggleOne(student.id)}
                    className={`cursor-pointer border-b border-white/5 transition-colors hover:bg-white/5 ${isSelected ? 'bg-blue-500/5' : ''}`}
                  >
                    <td className="px-6 py-4">
                      {isSelected ? <CheckCircle2 className="w-5 h-5 text-blue-400" /> : <Circle className="w-5 h-5 text-white/20" />}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-white">{student.name}</div>
                          <div className="text-xs text-white/40">{student.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${student.attendance < 85 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {student.attendance}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${student.homeworkCompletion}%` }}></div>
                        </div>
                        <span className="text-xs text-white/60">{student.homeworkCompletion}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ color: getMasteryColor(student.masteryLevel), backgroundColor: getMasteryColor(student.masteryLevel) }}></div>
                        <span className="text-white/80 capitalize">{student.masteryLevel}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isSelected ? (
                        <span className="text-xs text-blue-400 font-medium">Included</span>
                      ) : (
                        <span className="text-xs text-white/30">Excluded</span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
