export const BOARDS = ["CBSE", "ICSE", "State Board"];
export const MEDIUMS = ["English", "Hindi"];
export const CLASSES = ["6", "7", "8", "9", "10"];

export const SUBJECTS_BY_CLASS: Record<string, { id: string; name: string }[]> = {
  "6": [
    { id: "math", name: "Mathematics" },
    { id: "science", name: "Science" },
    { id: "english", name: "English" },
    { id: "hindi", name: "Hindi" },
    { id: "social_science", name: "Social Science" },
  ],
  "7": [
    { id: "math", name: "Mathematics" },
    { id: "science", name: "Science" },
    { id: "english", name: "English" },
    { id: "hindi", name: "Hindi" },
    { id: "social_science", name: "Social Science" },
  ],
  "8": [
    { id: "math", name: "Mathematics" },
    { id: "science", name: "Science" },
    { id: "english", name: "English" },
    { id: "hindi", name: "Hindi" },
    { id: "social_science", name: "Social Science" },
  ],
  "9": [
    { id: "math", name: "Mathematics" },
    { id: "science", name: "Science" },
    { id: "english", name: "English" },
    { id: "hindi", name: "Hindi" },
    { id: "social_science", name: "Social Science" },
    { id: "computer", name: "Computer Applications" },
  ],
  "10": [
    { id: "math", name: "Mathematics" },
    { id: "science", name: "Science" },
    { id: "english", name: "English" },
    { id: "hindi", name: "Hindi" },
    { id: "social_science", name: "Social Science" },
    { id: "computer", name: "Computer Applications" },
  ],
};

export function getSubjectsForClass(classId: string) {
  return SUBJECTS_BY_CLASS[classId] || [];
}
