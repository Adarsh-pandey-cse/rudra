"use client";

import { useState } from "react";
import { BrainCircuit, Clock, Calendar, CheckCircle2, Bot, Type, Eye, Calculator, Copy, FileText, UploadCloud } from "lucide-react";
import { motion } from "framer-motion";
import type { HomeworkType, HomeworkDifficulty, EvaluationMethod, AiSettings } from "@/types";
import GlassCard from "@/components/ui/GlassCard";

export interface AssignmentDetailsState {
  title: string;
  description: string;
  type: HomeworkType;
  difficulty: HomeworkDifficulty;
  estimatedTimeMin: number;
  dueDate: string;
  dueTime: string;
  allowLate: boolean;
  lateWindowHours: number;
  evaluationMethod: EvaluationMethod;
  aiSettings: AiSettings;
  assignmentFiles?: File[];
  answerKeyFiles?: File[];
}

interface AssignmentDetailsProps {
  state: AssignmentDetailsState;
  onChange: (updates: Partial<AssignmentDetailsState>) => void;
  subjectId?: string | null;
}

export default function AssignmentDetails({ state, onChange, subjectId }: AssignmentDetailsProps) {
  
  const handleAssignmentFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      onChange({ assignmentFiles: [...(state.assignmentFiles || []), ...newFiles] });
    }
  };

  const handleAnswerKeyFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      onChange({ answerKeyFiles: [...(state.answerKeyFiles || []), ...newFiles] });
    }
  };

  const removeAssignmentFile = (index: number) => {
    const updated = [...(state.assignmentFiles || [])];
    updated.splice(index, 1);
    onChange({ assignmentFiles: updated });
  };

  const removeAnswerKeyFile = (index: number) => {
    const updated = [...(state.answerKeyFiles || [])];
    updated.splice(index, 1);
    onChange({ answerKeyFiles: updated });
  };

  const handleAiSettingToggle = (key: keyof AiSettings) => {
    onChange({
      aiSettings: {
        ...state.aiSettings,
        [key]: !state.aiSettings[key]
      }
    });
  };

  const aiToggles = [
    { key: "ocr" as const, label: "Enable OCR", icon: Eye, desc: "Read student handwriting" },
    { key: "conceptDetection" as const, label: "Concept Check", icon: BrainCircuit, desc: "Map answers to curriculum" },
    { key: "grammarCheck" as const, label: "Grammar Check", icon: Type, desc: "Check English spelling/grammar" },
    { key: "formulaCheck" as const, label: "Formula Check", icon: Calculator, desc: "Verify mathematical formulas" },
    { key: "similarityDetection" as const, label: "Plagiarism", icon: Copy, desc: "Check against peers" },
    { key: "aiFeedback" as const, label: "AI Feedback", icon: Bot, desc: "Generate hints for weak areas" },
  ];

  return (
    <div className="space-y-12">
      {/* Basic Info */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          General Information
        </h3>
        
        <div>
          <label className="block text-sm text-white/70 mb-2">Assignment Title</label>
          <input 
            type="text" 
            value={state.title} 
            onChange={e => onChange({ title: e.target.value })} 
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors" 
            placeholder={
              subjectId === 'math' ? "e.g. Linear Equations Mastery Worksheet" :
              subjectId === 'science' ? "e.g. Motion and Force Lab Report" :
              subjectId === 'english' ? "e.g. Essay on Formal Letter Writing" :
              subjectId === 'social' ? "e.g. Nationalism in Europe Quiz" :
              "e.g. Chapter 1 Mastery Worksheet"
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm text-white/70 mb-2">Type</label>
            <select value={state.type} onChange={e => onChange({ type: e.target.value as HomeworkType })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500">
              <option value="Practice Questions">Practice Questions</option>
              <option value="Worksheet">Worksheet</option>
              <option value="MCQ">MCQ</option>
              <option value="Numerical">Numerical</option>
              <option value="AI Generated Worksheet">AI Generated Worksheet</option>
              <option value="Mixed">Mixed Format</option>
              <option value="Project">Project</option>
              <option value="Lab Work">Lab Work</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-2">Difficulty</label>
            <select value={state.difficulty} onChange={e => onChange({ difficulty: e.target.value as HomeworkDifficulty })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500">
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
              <option value="Adaptive">Adaptive (AI adjusts per student)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-2">Estimated Time (mins)</label>
            <select value={state.estimatedTimeMin} onChange={e => onChange({ estimatedTimeMin: parseInt(e.target.value) })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500">
              <option value="10">10 mins</option>
              <option value="20">20 mins</option>
              <option value="30">30 mins</option>
              <option value="45">45 mins</option>
              <option value="60">60 mins</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-white/70 mb-2">Instructions</label>
          <textarea 
            rows={3} 
            value={state.description} 
            onChange={e => onChange({ description: e.target.value })} 
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors" 
            placeholder="Write specific instructions or links for the students..." 
          />
        </div>
      </div>

      {/* Deadlines & Late Policy */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          Deadlines
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-white/70 mb-2">Due Date</label>
              <input 
                type="date" 
                value={state.dueDate} 
                onChange={e => onChange({ dueDate: e.target.value })} 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 [color-scheme:dark]" 
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-white/70 mb-2">Time</label>
              <input 
                type="time" 
                value={state.dueTime} 
                onChange={e => onChange({ dueTime: e.target.value })} 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 [color-scheme:dark]" 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-white/70 mb-2">Late Submission Policy</label>
            <div className="flex items-center gap-4 bg-black/40 border border-white/10 rounded-xl px-4 py-3">
              <label className="flex items-center gap-2 cursor-pointer text-white">
                <input 
                  type="checkbox" 
                  checked={state.allowLate} 
                  onChange={e => onChange({ allowLate: e.target.checked })} 
                  className="w-5 h-5 accent-blue-500" 
                />
                Allow Late
              </label>
              
              {state.allowLate && (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm text-white/50">Window:</span>
                  <select 
                    value={state.lateWindowHours} 
                    onChange={e => onChange({ lateWindowHours: parseInt(e.target.value) })}
                    className="bg-transparent text-sm text-white outline-none border-b border-white/20 focus:border-blue-500"
                  >
                    <option className="bg-[#1E293B]" value="1">1 Hour</option>
                    <option className="bg-[#1E293B]" value="6">6 Hours</option>
                    <option className="bg-[#1E293B]" value="12">12 Hours</option>
                    <option className="bg-[#1E293B]" value="24">24 Hours</option>
                    <option className="bg-[#1E293B]" value="48">48 Hours</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Configuration */}
      <div className="space-y-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-purple-400" />
            AI Pipeline Settings
          </h3>
          <select 
            value={state.evaluationMethod} 
            onChange={e => onChange({ evaluationMethod: e.target.value as EvaluationMethod })}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
          >
            <option value="Teacher Only">Evaluation: Teacher Only</option>
            <option value="Teacher + AI">Evaluation: AI Suggests, Teacher Confirms</option>
            <option value="AI Suggestion + Teacher Final">Evaluation: Full AI Autopilot</option>
          </select>
        </div>

        {state.evaluationMethod !== "Teacher Only" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {aiToggles.map(toggle => {
              const Icon = toggle.icon;
              const isActive = state.aiSettings[toggle.key];
              return (
                <button
                  type="button"
                  key={toggle.key}
                  onClick={() => handleAiSettingToggle(toggle.key)}
                  className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                    isActive 
                      ? "bg-purple-500/10 border-purple-500/50" 
                      : "bg-white/5 border-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]" : "bg-white/10 text-white/40"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-medium ${isActive ? "text-purple-300" : "text-white/70"}`}>{toggle.label}</h4>
                    <p className="text-xs text-white/40 mt-0.5">{toggle.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="p-6 bg-white/5 rounded-xl border border-white/10 text-center text-white/50 text-sm">
            AI Pipeline is disabled. You will manually grade all submissions.
          </div>
        )}
      </div>

      {/* Attachments & Answer Key */}
      <div className="space-y-6 pt-4 border-t border-white/10">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-emerald-400" />
          Materials
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="flex flex-col gap-3">
            <label className="border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 hover:border-blue-500/50 transition-colors cursor-pointer group relative">
              <input type="file" multiple className="hidden" onChange={handleAssignmentFileUpload} />
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white mb-1">Assignment Files</h3>
              <p className="text-xs text-white/50">Upload questions (PDF, Images, DOCX, TXT)</p>
            </label>
            
            {state.assignmentFiles && state.assignmentFiles.length > 0 && (
              <div className="space-y-2">
                {state.assignmentFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm">
                    <span className="text-blue-200 truncate pr-2 max-w-[200px]" title={file.name}>{file.name}</span>
                    <button type="button" onClick={() => removeAssignmentFile(i)} className="text-blue-400 hover:text-white">&times;</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <label className="border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 hover:border-emerald-500/50 transition-colors cursor-pointer group relative">
              <input type="file" multiple className="hidden" onChange={handleAnswerKeyFileUpload} />
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-white mb-1">Answer Key</h3>
              <p className="text-xs text-white/50">Upload rubric for AI Evaluation</p>
            </label>
            
            {state.answerKeyFiles && state.answerKeyFiles.length > 0 && (
              <div className="space-y-2">
                {state.answerKeyFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm">
                    <span className="text-emerald-200 truncate pr-2 max-w-[200px]" title={file.name}>{file.name}</span>
                    <button type="button" onClick={() => removeAnswerKeyFile(i)} className="text-emerald-400 hover:text-white">&times;</button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
      
    </div>
  );
}
