export interface Exam {
  id: string;
  subject: string;
  date: string;
  score?: number;
  grade?: string;
  icon?: string;
  status: 'completed' | 'upcoming';
}

export interface Performance {
  month: string;
  score: number;
}

export interface BoardPost {
  id: string;
  type: 'announcement' | 'question';
  title: string;
  content: string;
  author: string;
  authorAvatar?: string;
  date: string;
  priority?: 'urgent' | 'high' | 'normal';
  likes: number;
  comments: number;
  isLiked?: boolean;
}

export type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // For multiple choice
  correctAnswer?: string | number; // For multiple choice (index) or true/false
  points: number;
  explanation?: string;
}

export interface ExamTemplate {
  id: string;
  title: string;
  description: string;
  subject: string;
  grade: string;
  duration: number; // in minutes
  totalPoints: number;
  questions: Question[];
  instructions?: string;
  allowedAttempts: number;
  shuffleQuestions: boolean;
  showResults: boolean;
  passingScore: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published' | 'archived';
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
}

export interface ExamSchedule {
  id: string;
  examId: string;
  title: string;
  subject: string;
  grade: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalQuestions: number;
  totalPoints: number;
  allowedAttempts: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  participants: string[]; // student IDs
}

export interface ExamSubmission {
  id: string;
  examScheduleId: string;
  studentId: string;
  studentName: string;
  answers: { [questionId: string]: any };
  score?: number;
  percentage?: number;
  submittedAt: string;
  timeSpent: number; // in minutes
  status: 'in-progress' | 'submitted' | 'graded';
  feedback?: string;
  gradedBy?: string;
  gradedAt?: string;
}

export interface AIQuestionRequest {
  subject: string;
  grade: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: QuestionType;
  count: number;
}