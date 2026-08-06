// ─── AI Homework Service ───────────────────────────────────────
// Mock-first AI that generates realistic homework questions,
// answer keys, and evaluations. Falls back to pre-built responses
// when no Gemini API key is configured.

import type { GeneratedQuestion, QuestionGenConfig, AiEvaluation, QuestionResult, AnswerKeyItem } from "@/types/homework-types";

// ─── Question Templates by Type ────────────────────────────────

function generateId() {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const MCQ_TEMPLATES: Record<string, { q: string; opts: string[]; ans: string; sol: string; concepts: string[] }[]> = {
  default: [
    { q: "Which of the following best describes the main concept?", opts: ["Option A — Primary definition", "Option B — Secondary property", "Option C — Related but incorrect", "Option D — Common misconception"], ans: "Option A — Primary definition", sol: "The correct answer is A because the primary definition directly addresses the core concept. Option B describes a secondary property, C is related but not the main concept, and D is a common misconception.", concepts: ["Core Definition"] },
    { q: "What is the correct formula or relationship?", opts: ["Formula A (correct)", "Formula B (reversed)", "Formula C (partial)", "Formula D (unrelated)"], ans: "Formula A (correct)", sol: "Formula A is correct as it represents the standard mathematical relationship. Formula B has reversed variables, C is incomplete, and D applies to a different concept.", concepts: ["Formulae", "Relationships"] },
    { q: "In which real-life situation is this concept applied?", opts: ["Scenario A (direct application)", "Scenario B (indirect)", "Scenario C (wrong context)", "Scenario D (no relation)"], ans: "Scenario A (direct application)", sol: "Scenario A demonstrates a direct real-life application. Understanding how concepts apply to everyday situations strengthens comprehension.", concepts: ["Applications"] },
    { q: "Which statement about this topic is FALSE?", opts: ["True statement 1", "True statement 2", "FALSE statement (answer)", "True statement 3"], ans: "FALSE statement (answer)", sol: "The false statement contradicts the established principle. Always verify statements against fundamental rules.", concepts: ["Critical Thinking"] },
    { q: "What happens when the key variable is doubled?", opts: ["Result doubles", "Result halves", "Result quadruples", "No change"], ans: "Result doubles", sol: "Based on the linear relationship, doubling the input variable results in a proportional doubling of the output.", concepts: ["Proportional Reasoning"] },
  ],
};

function generateMockQuestions(config: QuestionGenConfig): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const { topicTitle, subject, difficulty } = config;
  const diffMultiplier = difficulty === "Easy" ? 1 : difficulty === "Medium" ? 1.5 : difficulty === "Hard" ? 2 : 1.5;

  // MCQs
  const mcqTemplates = MCQ_TEMPLATES.default;
  for (let i = 0; i < config.distribution.mcq; i++) {
    const t = mcqTemplates[i % mcqTemplates.length];
    questions.push({
      id: generateId(),
      type: "mcq",
      question: `[${topicTitle}] ${t.q}`,
      options: t.opts,
      correctAnswer: t.ans,
      solution: t.sol,
      marks: 1,
      bloomLevel: i < 2 ? "Remember" : "Understand",
      expectedTimeMinutes: 2,
      conceptsCovered: t.concepts.map(c => `${topicTitle} — ${c}`),
      isEdited: false,
    });
  }

  // Very Short
  for (let i = 0; i < config.distribution.very_short; i++) {
    questions.push({
      id: generateId(),
      type: "very_short",
      question: `Define the key term related to ${topicTitle}. (${i + 1})`,
      correctAnswer: `The key term refers to the fundamental principle of ${topicTitle} that governs the relationship between the primary variables.`,
      solution: `A complete definition should mention: (1) the core principle, (2) the variables involved, (3) the unit of measurement if applicable.`,
      marks: 2,
      bloomLevel: "Remember",
      expectedTimeMinutes: 3,
      conceptsCovered: [`${topicTitle} — Definitions`],
      isEdited: false,
    });
  }

  // Short Answer
  for (let i = 0; i < config.distribution.short; i++) {
    questions.push({
      id: generateId(),
      type: "short",
      question: `Explain the relationship between the two main variables in ${topicTitle}. Provide an example. (${i + 1})`,
      correctAnswer: `The relationship is directly proportional / inversely proportional. As one variable increases, the other increases / decreases accordingly. For example, when we increase input by 2x, the output changes by the same factor.`,
      solution: `Step 1: State the relationship type.\nStep 2: Explain the proportionality.\nStep 3: Give a numerical example.\nStep 4: Mention any conditions or exceptions.`,
      marks: 3,
      bloomLevel: "Apply",
      expectedTimeMinutes: 5,
      conceptsCovered: [`${topicTitle} — Relationships`, `${topicTitle} — Examples`],
      isEdited: false,
    });
  }

  // Long Answer
  for (let i = 0; i < config.distribution.long; i++) {
    questions.push({
      id: generateId(),
      type: "long",
      question: `Derive the main formula for ${topicTitle} from first principles. State the assumptions made and discuss two real-world applications.`,
      correctAnswer: `Derivation:\n1. Start with the base equation...\n2. Apply the fundamental theorem...\n3. Substitute and simplify...\n\nAssumptions: (a) Ideal conditions, (b) No external interference\n\nApplications:\n1. Engineering — Used in structural design calculations\n2. Daily life — Applied in household measurements`,
      solution: `Full marks awarded for: Complete derivation (3 marks), correct assumptions (1 mark), two valid applications with explanations (1 mark each).`,
      marks: 5,
      bloomLevel: "Analyze",
      expectedTimeMinutes: 12,
      conceptsCovered: [`${topicTitle} — Derivation`, `${topicTitle} — Applications`],
      isEdited: false,
    });
  }

  // HOTS
  for (let i = 0; i < config.distribution.hots; i++) {
    questions.push({
      id: generateId(),
      type: "hots",
      question: `A student claims that the principle of ${topicTitle} does not apply in extreme conditions. Evaluate this claim with evidence and reasoning.`,
      correctAnswer: `The claim is partially correct. Under standard conditions, the principle holds true. However, at extreme values (very high temperature, pressure, or scale), deviations occur because the underlying assumptions break down.`,
      solution: `Award marks for: (1) Acknowledging partial truth (1 mark), (2) Explaining standard applicability (1 mark), (3) Identifying extreme conditions (1 mark), (4) Scientific reasoning for deviations (1 mark).`,
      marks: 4,
      bloomLevel: "Evaluate",
      expectedTimeMinutes: 8,
      conceptsCovered: [`${topicTitle} — Critical Analysis`, `${topicTitle} — Limitations`],
      isEdited: false,
    });
  }

  // Competency
  for (let i = 0; i < config.distribution.competency; i++) {
    questions.push({
      id: generateId(),
      type: "competency",
      question: `Read the following passage about a real-world scenario involving ${topicTitle}:\n\n"A scientist measured the relationship between two quantities and found unexpected results. The data showed a non-linear pattern instead of the expected linear one."\n\n(a) What could explain this deviation?\n(b) How would you redesign the experiment?`,
      correctAnswer: `(a) The deviation could be caused by confounding variables, measurement errors, or the system operating outside the linear range of the relationship.\n(b) Redesign: Control additional variables, increase sample size, use more precise instruments, and test across a wider range of values.`,
      solution: `(a) 2 marks for valid explanation with reasoning.\n(b) 2 marks for practical redesign suggestions.`,
      marks: 4,
      bloomLevel: "Create",
      expectedTimeMinutes: 10,
      conceptsCovered: [`${topicTitle} — Competency`, `${topicTitle} — Experimental Design`],
      isEdited: false,
    });
  }

  // Application
  for (let i = 0; i < config.distribution.application; i++) {
    questions.push({
      id: generateId(),
      type: "application",
      question: `A local community needs to solve a problem using the concepts of ${topicTitle}. Describe how you would apply your knowledge to help them, including calculations where necessary.`,
      correctAnswer: `Step 1: Identify the relevant principle from ${topicTitle}.\nStep 2: Gather required measurements.\nStep 3: Apply the formula with real values.\nStep 4: Interpret the result in practical terms.\nStep 5: Suggest improvements based on findings.`,
      solution: `Full marks for: Problem identification (1), correct application (2), calculations (1), practical interpretation (1).`,
      marks: 5,
      bloomLevel: "Apply",
      expectedTimeMinutes: 10,
      conceptsCovered: [`${topicTitle} — Real-World Application`],
      isEdited: false,
    });
  }

  // Diagram
  for (let i = 0; i < config.distribution.diagram; i++) {
    questions.push({
      id: generateId(),
      type: "diagram",
      question: `Draw a well-labelled diagram illustrating the key concept of ${topicTitle}. Label all important parts and indicate the direction of flow/force/process.`,
      correctAnswer: `A correct diagram should include:\n1. Clear outline of the main structure\n2. All parts labelled with arrows\n3. Direction indicators (arrows for flow/force)\n4. Title and legend if applicable\n5. Neat and proportional drawing`,
      solution: `Marks distribution: Diagram accuracy (2), Labels (1), Direction/Flow indicators (1), Neatness (1).`,
      marks: 5,
      bloomLevel: "Understand",
      expectedTimeMinutes: 8,
      conceptsCovered: [`${topicTitle} — Visual Representation`],
      isEdited: false,
    });
  }

  return questions;
}

function generateAnswerKey(questions: GeneratedQuestion[]): AnswerKeyItem[] {
  return questions.map(q => ({
    questionId: q.id,
    answer: q.correctAnswer,
    markingScheme: `Total: ${q.marks} mark(s). ${q.type === "mcq" ? "1 mark for correct option, 0 for incorrect." : `Distribute marks across key points as per solution.`}`,
    stepByStepSolution: q.solution,
  }));
}

function generateMockEvaluation(maxMarks: number, questions: GeneratedQuestion[]): AiEvaluation {
  const scored = Math.floor(maxMarks * (0.5 + Math.random() * 0.4));
  const results: QuestionResult[] = questions.map(q => {
    const correct = Math.random() > 0.35;
    return {
      questionId: q.id,
      studentAnswer: correct ? q.correctAnswer : "Student's attempt at answering...",
      isCorrect: correct,
      marksAwarded: correct ? q.marks : Math.floor(q.marks * Math.random() * 0.5),
      marksTotal: q.marks,
      feedback: correct ? "Correct! Well answered." : "Partially correct. Review the step-by-step solution for improvement.",
    };
  });

  return {
    suggestedMarks: scored,
    maxMarks,
    percentage: Math.round((scored / maxMarks) * 100),
    overallFeedback: `The student scored ${scored}/${maxMarks} (${Math.round((scored / maxMarks) * 100)}%). Overall, the attempt shows a good understanding of basic concepts with room for improvement in application-based questions.`,
    studentFeedback: `Great effort! You got ${scored} out of ${maxMarks}. Focus on practicing the questions you got wrong, especially the application and HOTS questions.`,
    weakTopics: questions.filter((_, i) => !results[i].isCorrect).map(q => q.conceptsCovered[0] || "General"),
    strongTopics: questions.filter((_, i) => results[i].isCorrect).map(q => q.conceptsCovered[0] || "General"),
    conceptMastery: {},
    questionResults: results,
    evaluatedAt: new Date().toISOString(),
  };
}

// ─── Exported Service ──────────────────────────────────────────

export const aiHomeworkService = {
  generateQuestions: async (config: QuestionGenConfig): Promise<GeneratedQuestion[]> => {
    // Simulate AI processing time
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
    return generateMockQuestions(config);
  },

  generateAnswerKey: async (questions: GeneratedQuestion[]): Promise<AnswerKeyItem[]> => {
    await new Promise(r => setTimeout(r, 500));
    return generateAnswerKey(questions);
  },

  evaluateSubmission: async (maxMarks: number, questions: GeneratedQuestion[]): Promise<AiEvaluation> => {
    await new Promise(r => setTimeout(r, 2000 + Math.random() * 1500));
    return generateMockEvaluation(maxMarks, questions);
  },

  regenerateQuestion: async (type: GeneratedQuestion["type"], topicTitle: string): Promise<GeneratedQuestion> => {
    await new Promise(r => setTimeout(r, 800));
    const config: QuestionGenConfig = {
      topicId: "regen",
      topicTitle,
      subject: "",
      difficulty: "Medium",
      distribution: { mcq: 0, very_short: 0, short: 0, long: 0, hots: 0, competency: 0, application: 0, diagram: 0, [type]: 1 },
    };
    const questions = generateMockQuestions(config);
    return questions[0];
  },
};
