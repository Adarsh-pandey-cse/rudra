import re

with open("src/app/dashboard/teacher/students/add/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

new_gender_div = """                      <div>
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
                        <label className={labelClasses}>Father's Name (Optional)</label>"""

content = re.sub(r'<div>\s*<label className=\{labelClasses\}>Father\'s Name \(Optional\)</label>', new_gender_div, content)

with open("src/app/dashboard/teacher/students/add/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
