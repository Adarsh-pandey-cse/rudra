import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { action, config, apiKey, topicTitle, type } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 401 });
    }

    // Dynamically import to avoid build issues
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    if (action === 'generateQuestions') {
      const resp = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate homework questions for the topic: "${config.topicTitle}".
Subject: ${config.subject}. Difficulty: ${config.difficulty}.
Distribution of question types: ${JSON.stringify(config.distribution)}.

Return ONLY a valid JSON array of question objects. Each object must have:
- id (string, unique e.g. "q_1")
- type (string: "mcq", "very_short", "short", "long", "hots", "competency", "application", or "diagram")
- question (string)
- options (array of 4 strings for mcq, empty array for others)
- correctAnswer (string)
- solution (string, step-by-step)
- marks (number)
- bloomLevel (string)
- expectedTimeMinutes (number)
- conceptsCovered (array of strings)
- isEdited (boolean, always false)

Return raw JSON array only, no markdown, no explanation.`,
      });

      const text = resp.text;
      if (!text) throw new Error('Empty response from Gemini');

      // Strip markdown code fences if present
      const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const questions = JSON.parse(clean);
      return NextResponse.json({ questions });
    }

    if (action === 'regenerateQuestion') {
      const resp = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate ONE homework question for the topic: "${topicTitle}". Type: ${type}.

Return ONLY a valid JSON object with fields:
- id (string, e.g. "q_regen_1")
- type ("${type}")
- question (string)
- options (array of 4 strings if mcq, empty array otherwise)
- correctAnswer (string)
- solution (string)
- marks (number)
- bloomLevel (string)
- expectedTimeMinutes (number)
- conceptsCovered (array of strings)
- isEdited (false)

Return raw JSON only.`,
      });

      const text = resp.text;
      if (!text) throw new Error('Empty response from Gemini');
      const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const question = JSON.parse(clean);
      return NextResponse.json({ question });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
