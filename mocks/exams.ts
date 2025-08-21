import { Exam, Performance } from '@/types/exam';

export const recentExams: Exam[] = [
  {
    id: '1',
    subject: 'Math',
    date: '2025-01-15',
    score: 85,
    grade: 'B',
    icon: '📚',
    status: 'completed',
  },
  {
    id: '2',
    subject: 'Physics',
    date: '2025-01-10',
    score: 72,
    grade: 'C',
    icon: '📚',
    status: 'completed',
  },
  {
    id: '3',
    subject: 'Chemistry',
    date: '2025-01-05',
    score: 91,
    grade: 'A',
    icon: '🧪',
    status: 'completed',
  },
];

export const upcomingExams: Exam[] = [
  {
    id: '4',
    subject: 'Biology',
    date: '2025-01-22',
    icon: '🧬',
    status: 'upcoming',
  },
  {
    id: '5',
    subject: 'English',
    date: '2025-01-25',
    icon: '📖',
    status: 'upcoming',
  },
];

export const performanceData: Performance[] = [
  { month: 'Sep', score: 72 },
  { month: 'Oct', score: 75 },
  { month: 'Nov', score: 78 },
  { month: 'Dec', score: 74 },
  { month: 'Jan', score: 85 },
];