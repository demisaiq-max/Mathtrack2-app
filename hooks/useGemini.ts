import { useState } from 'react';
import geminiService from '@/services/gemini';

interface UseGeminiReturn {
  generateContent: (question: string) => Promise<string | null>;
  generateExamQuestions: (subject: string, grade: number, difficulty: 'easy' | 'medium' | 'hard') => Promise<string | null>;
  analyzePerformance: (scores: number[], subject: string) => Promise<string | null>;
  loading: boolean;
  error: string | null;
}

export const useGemini = (): UseGeminiReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApiCall = async <T extends any[]>(
    apiMethod: (...args: T) => Promise<string>,
    ...args: T
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiMethod(...args);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Gemini API Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async (question: string): Promise<string | null> => {
    return handleApiCall(geminiService.askQuestion.bind(geminiService), question);
  };

  const generateExamQuestions = async (
    subject: string,
    grade: number,
    difficulty: 'easy' | 'medium' | 'hard'
  ): Promise<string | null> => {
    return handleApiCall(
      geminiService.generateExamQuestions.bind(geminiService),
      subject,
      grade,
      difficulty
    );
  };

  const analyzePerformance = async (scores: number[], subject: string): Promise<string | null> => {
    return handleApiCall(
      geminiService.analyzeStudentPerformance.bind(geminiService),
      scores,
      subject
    );
  };

  return {
    generateContent,
    generateExamQuestions,
    analyzePerformance,
    loading,
    error,
  };
};