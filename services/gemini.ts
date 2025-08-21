import config from '@/config/env';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
    };
  }[];
}

class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor() {
    this.apiKey = config.GEMINI_API_KEY;
  }

  async generateContent(messages: GeminiMessage[]): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: messages,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data: GeminiResponse = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }

  async askQuestion(question: string): Promise<string> {
    const messages: GeminiMessage[] = [
      {
        role: 'user',
        parts: [{ text: question }],
      },
    ];

    return this.generateContent(messages);
  }

  async generateExamQuestions(subject: string, grade: number, difficulty: 'easy' | 'medium' | 'hard'): Promise<string> {
    const prompt = `Generate 10 multiple choice questions for ${subject} for grade ${grade} students with ${difficulty} difficulty level. Format each question with 4 options (A, B, C, D) and indicate the correct answer.`;
    
    return this.askQuestion(prompt);
  }

  async analyzeStudentPerformance(scores: number[], subject: string): Promise<string> {
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const prompt = `Analyze student performance in ${subject}. Average score: ${averageScore.toFixed(2)}%. Individual scores: ${scores.join(', ')}%. Provide insights and recommendations for improvement.`;
    
    return this.askQuestion(prompt);
  }
}

export default new GeminiService();