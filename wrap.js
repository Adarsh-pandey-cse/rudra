const fs = require('fs');

function wrapFile(filePath, role) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('import DashboardLayout')) {
    content = content.replace(
      'import { Note } from "@/types";',
      'import { Note } from "@/types";\nimport DashboardLayout from "@/components/layout/DashboardLayout";'
    );
  }
  
  if (!content.includes(<DashboardLayout role=" + role + ">)) {
    content = content.replace(
      '  return (\n    <div className="max-w-6xl mx-auto space-y-8 pb-20 relative">',
      '  return (\n    <DashboardLayout role="' + role + '">\n      <div className="max-w-6xl mx-auto space-y-8 pb-20 relative">'
    );
    // Also replace \r\n if needed
    content = content.replace(
      '  return (\r\n    <div className="max-w-6xl mx-auto space-y-8 pb-20 relative">',
      '  return (\r\n    <DashboardLayout role="' + role + '">\r\n      <div className="max-w-6xl mx-auto space-y-8 pb-20 relative">'
    );
    
    // Add closing tag at the end
    content = content.replace(
      '    </div>\n  );\n}',
      '      </div>\n    </DashboardLayout>\n  );\n}'
    );
    content = content.replace(
      '    </div>\r\n  );\r\n}',
      '      </div>\r\n    </DashboardLayout>\r\n  );\r\n}'
    );
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
}

wrapFile('src/app/dashboard/student/notes/page.tsx', 'student');
wrapFile('src/app/dashboard/teacher/notes/page.tsx', 'teacher');
