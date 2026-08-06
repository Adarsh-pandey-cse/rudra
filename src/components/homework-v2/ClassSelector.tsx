"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import type { Student } from "@/types";

interface ClassSelectorProps {
  selectedClassId: string | null;
  onSelect: (classId: string) => void;
}

export default function ClassSelector({ selectedClassId, onSelect }: ClassSelectorProps) {
  const { getAllUsers } = useAuthStore();
  
  // Extract unique classes from student list
  const students = getAllUsers().filter((u): u is Student => u.role === "student");
  const uniqueClasses = [
    "class-6th", "class-7th", "class-8th", "class-9th", "class-10th", "class-11th", "class-12th"
  ];
  
  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
  };

  if (uniqueClasses.length === 0) {
    return (
      <div className="text-center p-8 bg-white/5 rounded-2xl border border-white/10">
        <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
        <p className="text-white/60">No classes available. Please add students first.</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
    >
      {uniqueClasses.map((classId) => {
        const studentCount = students.filter(s => s.classId === classId).length;
        const isSelected = selectedClassId === classId;
        const displayName = classId.replace("class-", "Class ").toUpperCase();
        
        return (
          <motion.div
            key={classId}
            variants={itemVariants}
            onClick={() => onSelect(classId)}
            className={`
              relative cursor-pointer rounded-2xl border p-6 transition-all duration-300
              ${isSelected 
                ? "bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]" 
                : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"}
            `}
          >
            {isSelected && (
              <div className="absolute top-3 right-3 w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,1)]" />
            )}
            
            <Users className={`w-8 h-8 mb-4 ${isSelected ? "text-blue-400" : "text-white/40"}`} />
            
            <h3 className="text-xl font-bold text-white mb-1">{displayName}</h3>
            <p className="text-sm text-white/50">{studentCount} Students Enrolled</p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
