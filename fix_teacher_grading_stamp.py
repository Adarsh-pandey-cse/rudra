import re

with open("src/app/dashboard/teacher/homework/analytics/[id]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

stamp_html = '''                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5B5CFF] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-lg">
                      {selectedSubmission.student.avatar ? <img src={selectedSubmission.student.avatar} alt="" className="w-full h-full rounded-full" /> : selectedSubmission.student.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        {selectedSubmission.student.name}'s Submission
                        {selectedSubmission.sub.status === "accepted" && (
                          <span className="ml-2 border-2 text-[12px] uppercase tracking-[0.2em] font-black px-2 py-0.5 rounded-md transform -rotate-6 opacity-90 select-none border-green-500 text-green-500">
                            GRADED
                          </span>
                        )}
                      </h2>'''

content = content.replace(
    '''                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5B5CFF] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-lg">
                      {selectedSubmission.student.avatar ? <img src={selectedSubmission.student.avatar} alt="" className="w-full h-full rounded-full" /> : selectedSubmission.student.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">{selectedSubmission.student.name}'s Submission</h2>''',
    stamp_html
)

with open("src/app/dashboard/teacher/homework/analytics/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
