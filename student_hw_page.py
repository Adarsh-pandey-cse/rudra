import re

with open("src/app/dashboard/student/homework/[id]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add Lock icon import if it's not there
if "Lock" not in content:
    content = content.replace('Send,', 'Send, Lock,')

# Add isClosed variable
content = content.replace(
    'const isPastDue = new Date() > new Date(homework.dueDate);',
    'const isPastDue = new Date() > new Date(homework.dueDate);\n  const isClosed = homework.isClosed;'
)

# Fix subjective submit button
old_subj_button = """                      <GradientButton 
                        onClick={handleSubmitSubjective} 
                        disabled={isSubmitting || isUploading || isPastDue} 
                        className="w-full sm:w-1/2 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed justify-center"
                      >
                        {isSubmitting ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mx-auto" />
                        ) : (
                          <span className="flex items-center justify-center font-medium">Submit Work <Send className="w-4 h-4 ml-2" /></span>
                        )}
                      </GradientButton>"""

new_subj_button = """                      <GradientButton 
                        onClick={handleSubmitSubjective} 
                        disabled={isSubmitting || isUploading || isPastDue || isClosed} 
                        className="w-full sm:w-1/2 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed justify-center"
                      >
                        {isSubmitting ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mx-auto" />
                        ) : isClosed ? (
                          <span className="flex items-center justify-center font-medium">Submission Closed <Lock className="w-4 h-4 ml-2" /></span>
                        ) : (
                          <span className="flex items-center justify-center font-medium">Submit Work <Send className="w-4 h-4 ml-2" /></span>
                        )}
                      </GradientButton>"""
content = content.replace(old_subj_button, new_subj_button)


# Fix MCQ submit button
old_mcq_button = """                    {!isCompleted && isLastQuestion ? (
                      <GradientButton onClick={handleSubmitMCQ} disabled={isSubmitting || isPastDue} className={`px-8 flex items-center ${isPastDue ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {isSubmitting ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        {isPastDue ? "Deadline Passed" : "Submit Answers"}
                      </GradientButton>
                    ) : ("""

new_mcq_button = """                    {!isCompleted && isLastQuestion ? (
                      <GradientButton onClick={handleSubmitMCQ} disabled={isSubmitting || isPastDue || isClosed} className={`px-8 flex items-center ${(isPastDue || isClosed) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {isSubmitting ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2" />
                        ) : isClosed ? (
                          <Lock className="w-4 h-4 mr-2" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        {isClosed ? "Submission Closed" : isPastDue ? "Deadline Passed" : "Submit Answers"}
                      </GradientButton>
                    ) : ("""
content = content.replace(old_mcq_button, new_mcq_button)

with open("src/app/dashboard/student/homework/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
