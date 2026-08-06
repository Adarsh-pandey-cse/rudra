export type Board = "CBSE" | "ICSE" | "State";

export interface CurriculumDatabase {
  classes: ClassCurriculum[];
}

export interface ClassCurriculum {
  classId: string; // e.g. "class-10"
  className: string;
  subjects: SubjectCurriculum[];
}

export interface SubjectCurriculum {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  color: string;
  iconName: string;
  bookName: string;
  academicYear: string;
  board: Board;
  language: string;
  totalChapters: number;
  totalTopics: number;
  estimatedCompletionTimeHours: number;
  difficulty: "Easy" | "Medium" | "Hard";
  units: Unit[];
}

export interface Unit {
  unitId: string;
  unitName: string;
  chapters: ChapterCurriculum[];
}

export interface ChapterCurriculum {
  chapterId: string;
  chapterName: string;
  unitName: string;
  chapterNumber: number;
  chapterDescription: string;
  
  // Hours
  estimatedHours: number;
  revisionHours: number;
  homeworkHours: number;
  practiceHours: number;
  
  // Importance & Difficulty
  difficulty: "Easy" | "Medium" | "Hard";
  importance: "High" | "Medium" | "Low";
  conceptWeight: number; // 0-100
  examWeight: number; // 0-100
  pyqWeight: number; // 0-100
  
  learningObjectives: string[];
  commonMistakes: string[];
  
  // Visuals
  visualLearningRecommended: boolean;
  diagramRequired: boolean;
  numericalRequired: boolean;
  practicalRequired: boolean;
  
  // Search
  synonyms: string[];
  alternativeNames: string[];
  keywords: string[];
  examKeywords: string[];
  importantWords: string[];
  
  topics: TopicCurriculum[];
  
  // Test Gen Meta
  testMetadata: TestMetadata;
  // Game System
  xpReward: number;
}

export interface TestMetadata {
  mcqCount: number;
  veryShortCount: number;
  shortCount: number;
  longCount: number;
  caseStudyCount: number;
  assertionReasonCount: number;
  hotsCount: number;
  competencyCount: number;
  practicalCount: number;
  diagramCount: number;
}

export interface TopicCurriculum {
  topicId: string;
  topicName: string;
  shortDescription: string;
  conceptExplanation: string;
  
  prerequisiteTopics: string[];
  nextTopics: string[];
  
  formulaList: string[];
  definitions: string[];
  examples: string[];
  realLifeApplications: string[];
  importantFacts: string[];
  keywords: string[];
  expectedQuestions: string[];
  
  difficulty: "Easy" | "Medium" | "Hard";
  estimatedStudyTimeMinutes: number;
  estimatedPracticeTimeMinutes: number;
  revisionFrequencyDays: number;
  
  // Mastery Engine
  masteryWeight: number;
  revisionPriority: "High" | "Medium" | "Low";
  retentionDifficulty: number; // 1-10
  confidenceThreshold: number; // 0-100
  minimumPracticeQuestions: number;
  recommendedRevisionDays: number[];
  weakTopicFlag: boolean;
  
  // Visual Learning
  needsDiagram: boolean;
  needsAnimation: boolean;
  needsVideo: boolean;
  needsSimulation: boolean;
  needsExperiment: boolean;
  
  // AI Tutor Support
  aiTutorSupport: {
    simpleExplanation: string;
    mediumExplanation: string;
    detailedExplanation: string;
    analogy: string;
    realLifeExample: string;
    commonDoubts: string[];
    frequentlyAskedQuestions: Array<{ q: string; a: string }>;
  };
  
  subtopics: SubtopicCurriculum[];
  flashcards: Flashcard[];
}

export interface SubtopicCurriculum {
  subtopicId: string;
  subtopicName: string;
  learningObjective: string;
  microConcepts: string[];
  commonErrors: string[];
  memoryTricks: string[];
  examples: string[];
  practiceSuggestions: string[];
}

export interface Flashcard {
  question: string;
  answer: string;
  hint?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  memoryCategory: "Fact" | "Concept" | "Formula" | "Date";
}
