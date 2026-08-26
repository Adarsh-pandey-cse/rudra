import re

with open("src/app/dashboard/student/settings/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Change handleSave
content = content.replace(
    'const parentName = formData.get("parentName") as string;',
    'const fatherName = formData.get("fatherName") as string;'
)
content = content.replace(
    'if (parentName !== null) updates.parentName = parentName;',
    'if (fatherName !== null) updates.fatherName = fatherName;'
)

# Disable Full Name input
content = content.replace(
    '''<input 
                        type="text" 
                        name="name"
                        defaultValue={currentUser.name}
                        className="w-full sm:w-1/2 bg-transparent text-right text-[#B6C2D9] focus:outline-none placeholder:text-[#7B8798]" 
                      />''',
    '''<input 
                        type="text" 
                        name="name"
                        defaultValue={currentUser.name}
                        readOnly
                        className="w-full sm:w-1/2 bg-transparent text-right text-[#7B8798] cursor-not-allowed focus:outline-none placeholder:text-[#7B8798]" 
                      />'''
)

# Change Parent Name to Father's Name
content = content.replace(
    '''<span className="text-sm font-medium text-white">Parent Name</span>
                      <input 
                        type="text" 
                        name="parentName"
                        placeholder="Enter parent's name"
                        defaultValue={(currentUser as any).parentName || ""}''',
    '''<span className="text-sm font-medium text-white">Father's Name</span>
                      <input 
                        type="text" 
                        name="fatherName"
                        placeholder="Enter father's name"
                        defaultValue={(currentUser as any).fatherName || ""}'''
)

# Change Parent Phone to Mobile Number
content = content.replace(
    '<span className="text-sm font-medium text-white">Parent Phone</span>',
    '<span className="text-sm font-medium text-white">Mobile Number</span>'
)

with open("src/app/dashboard/student/settings/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
