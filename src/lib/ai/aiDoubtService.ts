// ─── AI Doubt Service ──────────────────────────────────────────
// Answers student doubts using curriculum context.
// Implements a Socratic Tutor persona.

import { CBSE_CURRICULUM } from "@/data/cbse-curriculum";

interface AiDoubtResponse {
  answer: string;
  confidence: number;
  relatedTopics: string[];
  followUpSuggestions: string[];
}

function findRelatedCurriculumInfo(subjectId: string, topicName?: string): string {
  const topics = CBSE_CURRICULUM.filter(t => {
    if (subjectId && t.subject !== subjectId) return false;
    if (topicName) {
      return t.title.toLowerCase().includes(topicName.toLowerCase());
    }
    return true;
  });

  if (topics.length === 0) return "";
  
  const topic = topics[0];
  return `Based on ${topic.title} (${topic.chapter}, ${topic.unit}):\n\nLearning Outcomes: ${topic.learningOutcomes.join(", ")}`;
}

function generateMockSocraticInitial(question: string, subjectId: string, topicName?: string): AiDoubtResponse {
  const answer = `That's a great question! Instead of just giving you the answer, let's figure this out together.\n\n` +
    `Think about the core concept we learned recently. If we break this down into smaller pieces, what is the **first step** you would normally take when encountering a problem like this?\n\n` +
    `*Hint: Look at the variables you already know versus what you are trying to find.*`;

  return {
    answer,
    confidence: 85,
    relatedTopics: [
      topicName || "General Concepts",
      "Problem Solving Techniques",
    ],
    followUpSuggestions: [
      "I think the first step is to write down the formula.",
      "I'm completely stuck, can I have a bigger hint?",
      "Does it have to do with substitution?"
    ],
  };
}

function generateMockSocraticFollowUp(question: string, previousAnswer: string): AiDoubtResponse {
  // Simple heuristic mock for Socratic back-and-forth
  const qLower = question.toLowerCase();
  
  let answer = "";
  if (qLower.includes("formula") || qLower.includes("equation")) {
    answer = `Exactly! You start with the formula. \n\nNow, if you plug the numbers we have into that formula, what does the left side of the equation look like?`;
  } else if (qLower.includes("stuck") || qLower.includes("hint") || qLower.includes("don't know")) {
    answer = `No worries, that's what I'm here for! \n\nLet's try a simpler example. If you had 10 apples and gave away half, you'd have 5, right? We just divided by 2. \n\nApply that same logic to our current problem. What happens if we divide our main variable by 2?`;
  } else if (qLower.includes("yes") || qLower.includes("divide") || qLower.includes("multiply") || qLower.includes("add") || qLower.includes("subtract")) {
    answer = `You're on the right track! Brilliant deduction. \n\nSo, combining everything we just discussed, what is your final conclusion or answer to your original doubt?`;
  } else {
    answer = `Interesting thought! Let's explore that. \n\nIf we assume that's true, how would that affect the rest of the problem? Does it align with the rules we learned in class?`;
  }

  return {
    answer,
    confidence: 90,
    relatedTopics: ["Logical Deduction", "Step-by-step Analysis"],
    followUpSuggestions: [
      "I think I get it now, the answer is...",
      "Can I escalate this to my teacher?",
    ],
  };
}

// ─── Exported Service ──────────────────────────────────────────

export const aiDoubtService = {
  answerDoubt: async (question: string, subjectId: string, topicName?: string): Promise<AiDoubtResponse> => {
    // Simulate network delay for AI generation
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 800));
    return generateMockSocraticInitial(question, subjectId, topicName);
  },

  answerFollowUp: async (question: string, previousAnswer: string): Promise<AiDoubtResponse> => {
    // Simulate network delay for AI generation
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));
    return generateMockSocraticFollowUp(question, previousAnswer);
  },

  searchKnowledgeBase: async (query: string): Promise<{ question: string; answer: string }[]> => {
    await new Promise(r => setTimeout(r, 300));
    return [];
  },
};
