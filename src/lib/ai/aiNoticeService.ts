// ─── AI Notice Service ─────────────────────────────────────────
// Converts casual teacher input into professional notice text.
// Falls back to template-based generation without Gemini API.

import type { NoticeType } from "@/types/notice-types";

interface GeneratedNotice {
  title: string;
  body: string;                 // full professional notice
  shortBody: string;            // push notification version (< 100 chars)
}

const TYPE_TEMPLATES: Record<NoticeType, { titlePrefix: string; bodyTemplate: string }> = {
  general:         { titlePrefix: "Notice",              bodyTemplate: "Dear Students and Parents,\n\n{input}\n\nPlease take note of the above information.\n\nRegards,\n{teacher}\nRudra Academy" },
  homework:        { titlePrefix: "Homework Update",     bodyTemplate: "Dear Students,\n\n{input}\n\nPlease ensure timely completion and submission.\n\nRegards,\n{teacher}" },
  holiday:         { titlePrefix: "Holiday Notice",      bodyTemplate: "Dear Students and Parents,\n\nThis is to inform you that {input}.\n\nClasses will resume as per the regular schedule after the holiday.\n\nRegards,\n{teacher}\nRudra Academy" },
  class_cancelled: { titlePrefix: "Class Cancelled",     bodyTemplate: "Dear Students,\n\nPlease note that {input}.\n\nWe apologize for the inconvenience. Makeup class details will be shared soon.\n\nRegards,\n{teacher}" },
  class_delayed:   { titlePrefix: "Class Delayed",       bodyTemplate: "Dear Students,\n\nKindly note that {input}.\n\nPlease adjust your schedule accordingly.\n\nRegards,\n{teacher}" },
  extra_class:     { titlePrefix: "Extra Class",         bodyTemplate: "Dear Students,\n\n{input}.\n\nAttendance is recommended for all students.\n\nRegards,\n{teacher}" },
  fee_reminder:    { titlePrefix: "Fee Reminder",        bodyTemplate: "Dear Parents,\n\nThis is a gentle reminder that {input}.\n\nKindly ensure timely payment to avoid late fees.\n\nRegards,\nAccounts Department\nRudra Academy" },
  exam:            { titlePrefix: "Examination Notice",  bodyTemplate: "Dear Students,\n\n{input}.\n\nPlease prepare well and arrive on time. Carry all necessary stationery.\n\nBest wishes,\n{teacher}" },
  quiz:            { titlePrefix: "Quiz Announcement",   bodyTemplate: "Dear Students,\n\n{input}.\n\nBe prepared and give your best!\n\nRegards,\n{teacher}" },
  result:          { titlePrefix: "Results Declared",    bodyTemplate: "Dear Students and Parents,\n\n{input}.\n\nDetailed mark sheets will be available in the student dashboard.\n\nRegards,\n{teacher}" },
  emergency:       { titlePrefix: "⚠️ URGENT",          bodyTemplate: "URGENT NOTICE\n\n{input}.\n\nPlease act immediately and follow all instructions.\n\n— {teacher}, Rudra Academy" },
  important:       { titlePrefix: "Important Notice",    bodyTemplate: "Dear Students and Parents,\n\n⚠️ {input}.\n\nPlease take immediate note.\n\nRegards,\n{teacher}\nRudra Academy" },
  birthday:        { titlePrefix: "🎂 Birthday Wishes",  bodyTemplate: "Dear Students,\n\n🎉 {input}!\n\nWishing a wonderful year ahead filled with learning and success.\n\nWarm Regards,\n{teacher}\nRudra Academy" },
  achievement:     { titlePrefix: "🏆 Achievement",      bodyTemplate: "Dear Students and Parents,\n\nWe are proud to announce that {input}.\n\nCongratulations! Keep up the excellent work.\n\nRegards,\n{teacher}\nRudra Academy" },
  documents:       { titlePrefix: "Document Shared",     bodyTemplate: "Dear Students,\n\n{input}.\n\nPlease download and review the attached document(s).\n\nRegards,\n{teacher}" },
  announcement:    { titlePrefix: "Announcement",        bodyTemplate: "Dear Students and Parents,\n\n{input}.\n\nStay tuned for further updates.\n\nRegards,\n{teacher}\nRudra Academy" },
};

function generateFromTemplate(input: string, type: NoticeType, teacherName: string): GeneratedNotice {
  const template = TYPE_TEMPLATES[type] || TYPE_TEMPLATES.general;
  
  // Capitalize first letter of input
  const cleanInput = input.charAt(0).toUpperCase() + input.slice(1);
  
  const title = `${template.titlePrefix}: ${cleanInput.split('.')[0].substring(0, 60)}`;
  const body = template.bodyTemplate
    .replace(/{input}/g, cleanInput)
    .replace(/{teacher}/g, teacherName);
  
  // Short body for push notification
  const shortBody = cleanInput.length > 90 ? cleanInput.substring(0, 87) + "..." : cleanInput;

  return { title, body, shortBody };
}

// ─── Exported Service ──────────────────────────────────────────

export const aiNoticeService = {
  generateNotice: async (input: string, type: NoticeType, teacherName: string): Promise<GeneratedNotice> => {
    // Simulate AI processing
    await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
    return generateFromTemplate(input, type, teacherName);
  },
};
