import re

with open("src/app/dashboard/teacher/students/add/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add gender state
content = content.replace(
    'const [grade, setGrade] = useState("6th");',
    'const [grade, setGrade] = useState("6th");\n  const [gender, setGender] = useState<"male" | "female">("male");'
)

# 2. Extract updateStudentProfile
if "updateStudentProfile" not in content:
    content = content.replace(
        'const { updateFeeProfile } = useFeeStore();',
        'const { updateFeeProfile } = useFeeStore();\n  const { updateStudentProfile } = useAuthStore();'
    )

# 3. Call updateStudentProfile after success
content = content.replace(
    """      if (studentId) {
        const admissionDay = new Date(admissionDate).getDate();""",
    """      if (studentId) {
        await updateStudentProfile(studentId, { gender } as any);
        const admissionDay = new Date(admissionDate).getDate();"""
)

# 4. Add UI field
form_html = """                  <div>
                    <label className={labelClasses}>Father's Name</label>
                    <input
                      type="text"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      className={inputClasses}
                      placeholder="e.g. Ramesh Kumar"
                    />
                  </div>"""

new_form_html = """                  <div>
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
                    <label className={labelClasses}>Father's Name</label>
                    <input
                      type="text"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      className={inputClasses}
                      placeholder="e.g. Ramesh Kumar"
                    />
                  </div>"""

content = content.replace(form_html, new_form_html)

with open("src/app/dashboard/teacher/students/add/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
