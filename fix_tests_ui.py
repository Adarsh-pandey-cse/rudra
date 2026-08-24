import re

with open('src/app/dashboard/teacher/tests/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure Edit2 is imported
if 'Edit2' not in content:
    content = content.replace('Trash2, ', 'Trash2, Edit2, ')

old_recent = '''                            <button 
                              onClick={() => deleteTestMark(mark.id)}
                              className="p-2 text-[#7B8798] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>'''

new_recent = '''                            <button 
                              onClick={() => {
                                setMarksInputs(prev => ({...prev, [mark.studentId]: mark.marks.toString()}));
                                setEditingMarks(prev => ({...prev, [mark.studentId]: mark.id}));
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className={`p-2 rounded-lg transition-colors ${editingMarks[mark.studentId] === mark.id ? 'bg-[#5B5CFF]/20 text-[#5B5CFF]' : 'text-[#7B8798] hover:text-[#5B5CFF] hover:bg-[#5B5CFF]/10'}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => deleteTestMark(mark.id)}
                              className="p-2 text-[#7B8798] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>'''

content = content.replace(old_recent, new_recent)

with open('src/app/dashboard/teacher/tests/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
