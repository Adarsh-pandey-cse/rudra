import re

with open("src/app/dashboard/teacher/students/add/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_father_input = """                      <div>
                        <label className={labelClasses}>Father's Name (Optional)</label>
                        <input
                          type="text"
                          value={fatherName}
                          onChange={(e) => setFatherName(e.target.value)}
                          className={inputClasses}
                          placeholder="e.g. Mr. Kumar"
                        />
                      </div>"""

new_father_input = """                      <div>
                        <label className={labelClasses}>Gender</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value as any)}
                          className={`${inputClasses} appearance-none`}
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>

                      <div>
                        <label className={labelClasses}>Father's Name (Optional)</label>
                        <input
                          type="text"
                          value={fatherName}
                          onChange={(e) => setFatherName(e.target.value)}
                          className={inputClasses}
                          placeholder="e.g. Mr. Kumar"
                        />
                      </div>"""

content = content.replace(old_father_input, new_father_input)

with open("src/app/dashboard/teacher/students/add/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
