import re

with open("src/app/dashboard/student/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add imports
if "useTestStore" not in content:
    content = content.replace(
        "import { useLeaderboardStore } from '@/store/leaderboardStore';",
        "import { useLeaderboardStore } from '@/store/leaderboardStore';\nimport { useTestStore } from '@/store/testStore';\nimport { getSubjectsForClass } from '@/data/curriculum-index';"
    )

# Add state destructuring
if "getMarksForStudent" not in content:
    content = content.replace(
        "const leaderboardEntries = useLeaderboardStore(state => state.entries);",
        "const leaderboardEntries = useLeaderboardStore(state => state.entries);\n  const { initializeTestsListener, getMarksForStudent } = useTestStore();"
    )

# Add listener initialization
old_init = '''    if (currentUser) {
      initStudentData(currentUser.id);
      setIsLoaded(true);
    }
  }, [isAuthenticated, currentUser, router, initStudentData, _hasHydrated]);'''
new_init = '''    if (currentUser) {
      initStudentData(currentUser.id);
      const unsubTests = initializeTestsListener("student", currentUser.id);
      setIsLoaded(true);
      return () => {
        unsubTests();
      };
    }
  }, [isAuthenticated, currentUser, router, initStudentData, _hasHydrated, initializeTestsListener]);'''

if "unsubTests" not in content:
    content = content.replace(old_init, new_init)

# Add helper and data extraction
extraction_old = '''  const nextHomework = pendingHomework.length > 0 ? pendingHomework[0] : null;'''
extraction_new = '''  const nextHomework = pendingHomework.length > 0 ? pendingHomework[0] : null;

  const recentTests = getMarksForStudent(currentUser.id).slice(0, 3);
  
  const getPraiseWord = (marks: number) => {
    if (marks === 20) {
      const words = ["Excellent!", "Outstanding!", "Wonderful!", "Perfect!", "Brilliant!"];
      return words[Math.floor(Math.random() * words.length)];
    }
    if (marks >= 17) return "Excellent";
    if (marks >= 12) return "Average to Good";
    if (marks >= 10) return "Needs Improvement";
    if (marks >= 5) return "Under Performance";
    return "Very Poor";
  };
'''

if "recentTests =" not in content:
    content = content.replace(extraction_old, extraction_new)

# Add UI inside Action Center or just before it
ui_old = '''            {/* Action Center */}
            <motion.div variants={itemVariants} className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Action Center</h2>
              <div className="grid grid-cols-1 gap-4">'''

ui_new = '''            {/* Offline Tests Section */}
            {recentTests.length > 0 && (
              <motion.div variants={itemVariants} className="space-y-4">
                <h2 className="text-lg font-semibold text-white">Recent Test Marks</h2>
                <div className="grid grid-cols-1 gap-4">
                  {recentTests.map(test => {
                    const subjectName = getSubjectsForClass(classId).find(s => s.id === test.subjectId)?.name || test.subjectId;
                    return (
                      <GlassCard key={test.id} className="p-5 flex flex-col justify-between border-white/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-4 h-4 text-indigo-400" />
                              <span className="font-semibold text-white">{subjectName} Test</span>
                            </div>
                            <p className="text-[12px] text-[#7B8798]">
                              {new Date(test.createdAt).toLocaleDateString()} at {new Date(test.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-white mb-0.5">
                              {test.marks}<span className="text-sm text-[#7B8798]">/20</span>
                            </div>
                            <div className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full inline-block ${
                              test.marks >= 17 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              test.marks >= 12 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              test.marks >= 10 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                              'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              {getPraiseWord(test.marks)}
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Action Center */}
            <motion.div variants={itemVariants} className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Action Center</h2>
              <div className="grid grid-cols-1 gap-4">'''

if "Recent Test Marks" not in content:
    content = content.replace(ui_old, ui_new)

with open("src/app/dashboard/student/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
