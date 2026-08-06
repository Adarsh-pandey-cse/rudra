"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Book, Sparkles, Command, CheckCircle2 } from "lucide-react";
import { useDataStore } from "@/store/dataStore";

import { CBSE_CURRICULUM, CurriculumTopic } from "@/data/cbse-curriculum";

export type { CurriculumTopic };

interface CurriculumSearchProps {
  classId: string;
  subjectId: string | null;
  onSubjectChange: (id: string) => void;
  onTopicSelect: (topic: CurriculumTopic) => void;
}

// Data is now loaded from CBSE_CURRICULUM

export default function CurriculumSearch({ classId, subjectId, onSubjectChange, onTopicSelect }: CurriculumSearchProps) {
  const { subjects } = useDataStore();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<CurriculumTopic | null>(null);

  const searchResults = query.length > 1 && subjectId 
    ? CBSE_CURRICULUM.filter(t => 
        t.subject === subjectId && 
        (t.title.toLowerCase().includes(query.toLowerCase()) || 
         t.chapter.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  const getPlaceholder = (subId: string | null) => {
    if (subId === 'math') return "Search topic (e.g., 'Polynomials', 'Triangles')...";
    if (subId === 'science') return "Search topic (e.g., 'Motion', 'Acids')...";
    if (subId === 'english') return "Search topic (e.g., 'Grammar', 'Writing')...";
    if (subId === 'social') return "Search topic (e.g., 'Nationalism', 'Resources')...";
    return "Search curriculum topic...";
  };

  const handleSelect = (topic: CurriculumTopic) => {
    setSelectedTopic(topic);
    setIsSearching(false);
    setQuery(topic.title);
    onTopicSelect(topic);
  };

  return (
    <div className="space-y-8">
      {/* Subject Selection (Step 3) */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Book className="w-5 h-5 text-blue-400" />
          Choose Subject
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {subjects.map(sub => (
            <button
              key={sub.id}
              onClick={() => {
                onSubjectChange(sub.id);
                setSelectedTopic(null);
                setQuery("");
              }}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                subjectId === sub.id
                  ? "bg-blue-500/20 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                  : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"
              }`}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${sub.color}20`, color: sub.color }}>
                {/* Simplified icon rendering for mock */}
                {sub.name.charAt(0)}
              </div>
              <span className="font-medium text-sm">{sub.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Curriculum Search (Step 4) */}
      <AnimatePresence>
        {subjectId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Curriculum Engine
            </h3>
            
            <div className="relative z-20">
              <div className={`relative flex items-center bg-black/40 border transition-colors rounded-xl overflow-hidden ${isSearching ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'border-white/10'}`}>
                <Search className="absolute left-4 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  placeholder={getPlaceholder(subjectId)}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setIsSearching(true);
                    setSelectedTopic(null);
                  }}
                  onFocus={() => setIsSearching(true)}
                  className="w-full bg-transparent pl-12 pr-12 py-4 text-white outline-none placeholder:text-white/30 font-medium text-lg"
                />
                <div className="absolute right-4 px-2 py-1 bg-white/10 rounded-md flex items-center gap-1 text-white/40 text-xs font-medium">
                  <Command className="w-3 h-3" /> K
                </div>
              </div>

              {/* Search Dropdown Results */}
              <AnimatePresence>
                {isSearching && query.length > 1 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-[#1E293B] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    {searchResults.length > 0 ? (
                      <ul className="max-h-64 overflow-y-auto p-2">
                        {searchResults.map(topic => (
                          <li key={topic.id}>
                            <button
                              onClick={() => handleSelect(topic)}
                              className="w-full text-left p-3 rounded-lg hover:bg-white/5 transition-colors flex items-start gap-3 group"
                            >
                              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-blue-500/20">
                                <Book className="w-4 h-4 text-blue-400" />
                              </div>
                              <div>
                                <h4 className="text-white font-medium">{topic.title}</h4>
                                <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
                                  <span>{topic.chapter}</span>
                                  <span>•</span>
                                  <span>{topic.unit}</span>
                                  <span>•</span>
                                  <span className="text-emerald-400">{topic.board}</span>
                                </div>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-white/40 mb-3 text-sm">No curriculum matches found.</p>
                        <button
                          onClick={() => handleSelect({
                            id: `custom_${Date.now()}`,
                            title: query,
                            chapter: "Custom Topic",
                            unit: "Custom Unit",
                            subject: "Custom",
                            board: "Custom",
                            difficulty: "Medium",
                            estimatedTime: 30,
                            learningOutcomes: ["Custom learning objective"],
                            class: "10",
                            book: "Custom Book",
                            subtopics: [],
                            keywords: []
                          })}
                          className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium transition-colors border border-blue-500/20"
                        >
                          Use "{query}" as Custom Topic
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Selected Topic Details Metadata */}
            <AnimatePresence>
              {selectedTopic && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Curriculum Matched</span>
                      </div>
                      <h4 className="text-xl font-bold text-white mb-2">{selectedTopic.title}</h4>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-white/70">{selectedTopic.chapter}</span>
                        <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-white/70">{selectedTopic.unit}</span>
                        <span className="px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">Est: {selectedTopic.estimatedTime}m</span>
                        <span className={`px-2.5 py-1 rounded-md border text-xs font-medium ${
                          selectedTopic.difficulty === 'Easy' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                          selectedTopic.difficulty === 'Medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                          'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}>
                          {selectedTopic.difficulty}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-white/40 uppercase">Learning Outcomes</p>
                        <ul className="list-disc list-inside text-sm text-white/70">
                          {selectedTopic.learningOutcomes.map((lo, i) => (
                            <li key={i}>{lo}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
