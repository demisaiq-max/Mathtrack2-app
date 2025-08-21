import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import createContextHook from '@nkzw/create-context-hook';

interface Submission {
  id: string;
  studentName: string;
  studentInitial: string;
  examName: string;
  fileName: string;
  fileSize: string;
  submittedDate: string;
  status: 'Pending' | 'Graded' | 'Reviewed';
  grade?: string;
  feedback?: string;
  fileUrl?: string;
}

interface Announcement {
  id: string;
  title: string;
  priority: 'high' | 'normal' | 'urgent';
  content: string;
  author: string;
  date: string;
  likes: number;
  comments: number;
}

interface QAQuestion {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  replies: number;
  isAnswered: boolean;
  priority: 'high' | 'normal' | 'urgent';
}

interface LectureNote {
  id: string;
  title: string;
  fileName: string;
  fileUri: string;
  fileType: string;
  uploadDate: string;
  grade?: string;
  subject?: string;
}

interface ExamReport {
  id: string;
  studentId: string;
  studentName: string;
  examId: string;
  examTitle: string;
  fileName: string;
  fileUri: string;
  fileType: string;
  uploadDate: string;
  status: 'pending' | 'reviewed' | 'graded';
  grade?: number;
  feedback?: string;
}

interface AdminContextType {
  submissions: Submission[];
  announcements: Announcement[];
  qaQuestions: QAQuestion[];
  lectureNotes: LectureNote[];
  examReports: ExamReport[];
  pendingSubmissionsCount: number;
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'date' | 'likes' | 'comments'>) => void;
  updateSubmission: (id: string, updates: Partial<Submission>) => void;
  likeAnnouncement: (id: string) => void;
  addComment: (id: string) => void;
  addQAQuestion: (question: Omit<QAQuestion, 'id' | 'date' | 'replies' | 'isAnswered'>) => void;
  answerQAQuestion: (id: string) => void;
  uploadLectureNote: (title: string, grade?: string, subject?: string) => Promise<void>;
  deleteLectureNote: (id: string) => void;
  saveExamReport: (studentId: string, studentName: string, examId: string, examTitle: string) => Promise<void>;
  updateExamReport: (id: string, updates: Partial<ExamReport>) => void;
  deleteExamReport: (id: string) => void;
}

export const [AdminProvider, useAdmin] = createContextHook((): AdminContextType => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [qaQuestions, setQAQuestions] = useState<QAQuestion[]>([]);
  const [lectureNotes, setLectureNotes] = useState<LectureNote[]>([]);
  const [examReports, setExamReports] = useState<ExamReport[]>([]);

  useEffect(() => {
    // Initialize with mock data
    setSubmissions([
      {
        id: '1',
        studentName: 'John Smith',
        studentInitial: 'J',
        examName: 'Grade 5 Mathematics - Final Exam',
        fileName: 'algebra_final_john_smith.pdf',
        fileSize: '2.4 MB',
        submittedDate: '15/01/2025',
        status: 'Pending',
        fileUrl: 'https://example.com/files/algebra_final_john_smith.pdf',
      },
      {
        id: '2',
        studentName: 'Sarah Johnson',
        studentInitial: 'S',
        examName: 'Grade 6 Science - Chapter 8 Quiz',
        fileName: 'geometry_quiz_sarah.pdf',
        fileSize: '1.8 MB',
        submittedDate: '15/01/2025',
        status: 'Graded',
        grade: '92%',
        feedback: 'Excellent work! Great understanding of geometric principles.',
        fileUrl: 'https://example.com/files/geometry_quiz_sarah.pdf',
      },
      {
        id: '3',
        studentName: 'Mike Davis',
        studentInitial: 'M',
        examName: 'Grade 7 Mathematics - Midterm',
        fileName: 'calculus_midterm_mike.pdf',
        fileSize: '3.2 MB',
        submittedDate: '14/01/2025',
        status: 'Reviewed',
        feedback: 'Good effort, but needs improvement in integration techniques.',
        fileUrl: 'https://example.com/files/calculus_midterm_mike.pdf',
      },
      {
        id: '4',
        studentName: 'Emma Wilson',
        studentInitial: 'E',
        examName: 'Grade 8 Physics - Quiz 3',
        fileName: 'stats_quiz_emma.pdf',
        fileSize: '1.5 MB',
        submittedDate: '13/01/2025',
        status: 'Pending',
        fileUrl: 'https://example.com/files/stats_quiz_emma.pdf',
      },
      {
        id: '5',
        studentName: 'Alex Chen',
        studentInitial: 'A',
        examName: 'Grade 9 Chemistry - Lab Report',
        fileName: 'chemistry_lab_alex.pdf',
        fileSize: '2.1 MB',
        submittedDate: '12/01/2025',
        status: 'Graded',
        grade: '88%',
        feedback: 'Good analysis, but could improve on conclusion.',
        fileUrl: 'https://example.com/files/chemistry_lab_alex.pdf',
      },
      {
        id: '6',
        studentName: 'Lisa Park',
        studentInitial: 'L',
        examName: 'Grade 10 Biology - Final Exam',
        fileName: 'biology_final_lisa.pdf',
        fileSize: '3.5 MB',
        submittedDate: '11/01/2025',
        status: 'Pending',
        fileUrl: 'https://example.com/files/biology_final_lisa.pdf',
      },
    ]);

    setAnnouncements([
      {
        id: '1',
        title: 'Holiday',
        priority: 'high',
        content: 'Tomorrow is public holiday',
        author: 'ali jawad',
        date: '12/08/2025',
        likes: 0,
        comments: 0,
      },
      {
        id: '2',
        title: 'New Study Materials Available',
        priority: 'high',
        content: 'New study materials for Calculus have been uploaded to the resource center. Please check them out before the upcoming exam on January 22nd.',
        author: 'Mr. Johnson',
        date: '11/08/2025',
        likes: 5,
        comments: 2,
      },
      {
        id: '3',
        title: 'Office Hours Reminder',
        priority: 'normal',
        content: 'Reminder: Office hours are available every Tuesday and Thursday from 3-5 PM in room 204. Feel free to drop by if you need help with any math topics.',
        author: 'Ms. Smith',
        date: '11/08/2025',
        likes: 3,
        comments: 1,
      },
      {
        id: '4',
        title: 'Exam Schedule Update',
        priority: 'urgent',
        content: 'The midterm exam schedule has been updated. Please check your student portal for the latest dates and times. Make sure to prepare accordingly.',
        author: 'Dr. Wilson',
        date: '10/08/2025',
        likes: 8,
        comments: 4,
      },
    ]);

    setQAQuestions([
      {
        id: '1',
        title: 'Question about Calculus Integration',
        content: 'I am having trouble understanding integration by parts. Can someone explain the process step by step?',
        author: 'Student A',
        date: '12/08/2025',
        replies: 3,
        isAnswered: true,
        priority: 'high',
      },
      {
        id: '2',
        title: 'Geometry Theorem Clarification',
        content: 'Could you please clarify the Pythagorean theorem application in 3D space?',
        author: 'Student B',
        date: '11/08/2025',
        replies: 1,
        isAnswered: false,
        priority: 'normal',
      },
      {
        id: '3',
        title: 'Statistics Help Needed',
        content: 'I need help with understanding standard deviation calculations. The formula is confusing.',
        author: 'Student C',
        date: '10/08/2025',
        replies: 0,
        isAnswered: false,
        priority: 'urgent',
      },
    ]);
  }, []);

  const pendingSubmissionsCount = useMemo(() => 
    submissions.filter(sub => sub.status === 'Pending').length, 
    [submissions]
  );

  const addAnnouncement = useCallback((announcement: Omit<Announcement, 'id' | 'date' | 'likes' | 'comments'>) => {
    const newAnnouncement: Announcement = {
      ...announcement,
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-GB'),
      likes: 0,
      comments: 0,
    };
    setAnnouncements(prev => [newAnnouncement, ...prev]);
    Alert.alert('Success', 'Announcement created successfully!');
  }, []);

  const updateSubmission = useCallback((id: string, updates: Partial<Submission>) => {
    setSubmissions(prev => prev.map(sub => 
      sub.id === id ? { ...sub, ...updates } : sub
    ));
  }, []);

  const likeAnnouncement = useCallback((id: string) => {
    setAnnouncements(prev => prev.map(ann => 
      ann.id === id ? { ...ann, likes: ann.likes + 1 } : ann
    ));
  }, []);

  const addComment = useCallback((id: string) => {
    setAnnouncements(prev => prev.map(ann => 
      ann.id === id ? { ...ann, comments: ann.comments + 1 } : ann
    ));
  }, []);

  const addQAQuestion = useCallback((question: Omit<QAQuestion, 'id' | 'date' | 'replies' | 'isAnswered'>) => {
    const newQuestion: QAQuestion = {
      ...question,
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-GB'),
      replies: 0,
      isAnswered: false,
    };
    setQAQuestions(prev => [newQuestion, ...prev]);
    Alert.alert('Success', 'Question posted successfully!');
  }, []);

  const answerQAQuestion = useCallback((id: string) => {
    setQAQuestions(prev => prev.map(q => 
      q.id === id ? { ...q, isAnswered: true, replies: q.replies + 1 } : q
    ));
  }, []);

  const uploadLectureNote = useCallback(async (title: string, grade?: string, subject?: string) => {
    try {
      console.log('Starting file upload process...', { title, grade, subject });
      
      if (Platform.OS === 'web') {
        // Web file picker
        console.log('Using web file picker');
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.doc,.docx,.ppt,.pptx,.txt,.xls,.xlsx';
        input.style.display = 'none';
        
        return new Promise<void>((resolve, reject) => {
          const handleFileSelect = (e: Event) => {
            console.log('File selection event triggered');
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            
            if (file) {
              console.log('File selected:', { name: file.name, size: file.size, type: file.type });
              
              const newNote: LectureNote = {
                id: Date.now().toString(),
                title,
                fileName: file.name,
                fileUri: URL.createObjectURL(file),
                fileType: file.type || 'application/octet-stream',
                uploadDate: new Date().toISOString(),
                grade,
                subject
              };
              
              setLectureNotes(prev => {
                console.log('Adding new lecture note to state');
                return [...prev, newNote];
              });
              
              Alert.alert('Success', `Lecture note "${file.name}" uploaded successfully!`);
              resolve();
            } else {
              console.log('No file selected');
              reject(new Error('No file selected'));
            }
            
            // Clean up
            document.body.removeChild(input);
          };
          
          const handleCancel = () => {
            console.log('File selection cancelled');
            document.body.removeChild(input);
            reject(new Error('File selection cancelled'));
          };
          
          input.addEventListener('change', handleFileSelect);
          input.addEventListener('cancel', handleCancel);
          
          // Add to DOM and trigger click
          document.body.appendChild(input);
          console.log('Triggering file picker...');
          input.click();
        });
      } else {
        // Mobile file picker
        console.log('Using mobile file picker');
        const result = await DocumentPicker.getDocumentAsync({
          type: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          ],
          copyToCacheDirectory: true,
        });
        
        console.log('Document picker result:', result);
        
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const file = result.assets[0];
          console.log('File selected on mobile:', file);
          
          const newNote: LectureNote = {
            id: Date.now().toString(),
            title,
            fileName: file.name,
            fileUri: file.uri,
            fileType: file.mimeType || 'application/octet-stream',
            uploadDate: new Date().toISOString(),
            grade,
            subject
          };
          
          setLectureNotes(prev => [...prev, newNote]);
          Alert.alert('Success', `Lecture note "${file.name}" uploaded successfully!`);
        } else {
          console.log('File selection cancelled on mobile');
          throw new Error('File selection cancelled');
        }
      }
    } catch (error) {
      console.error('Error uploading lecture note:', error);
      if (error instanceof Error && error.message !== 'File selection cancelled') {
        Alert.alert('Error', 'Failed to upload lecture note. Please try again.');
      }
      throw error;
    }
  }, []);

  const deleteLectureNote = useCallback((id: string) => {
    setLectureNotes(prev => prev.filter(note => note.id !== id));
    Alert.alert('Success', 'Lecture note deleted successfully!');
  }, []);

  const saveExamReport = useCallback(async (studentId: string, studentName: string, examId: string, examTitle: string) => {
    try {
      console.log('Starting exam report save process...', { studentId, studentName, examId, examTitle });
      
      if (Platform.OS === 'web') {
        // Web file picker
        console.log('Using web file picker for exam report');
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.txt';
        input.style.display = 'none';
        
        return new Promise<void>((resolve, reject) => {
          const handleFileSelect = (e: Event) => {
            console.log('Exam report file selection event triggered');
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            
            if (file) {
              console.log('Exam report file selected:', { name: file.name, size: file.size, type: file.type });
              
              const newReport: ExamReport = {
                id: Date.now().toString(),
                studentId,
                studentName,
                examId,
                examTitle,
                fileName: file.name,
                fileUri: URL.createObjectURL(file),
                fileType: file.type || 'application/octet-stream',
                uploadDate: new Date().toISOString(),
                status: 'pending'
              };
              
              setExamReports(prev => {
                console.log('Adding new exam report to state');
                return [...prev, newReport];
              });
              
              Alert.alert('Success', `Exam report "${file.name}" saved successfully!`);
              resolve();
            } else {
              console.log('No exam report file selected');
              reject(new Error('No file selected'));
            }
            
            // Clean up
            document.body.removeChild(input);
          };
          
          const handleCancel = () => {
            console.log('Exam report file selection cancelled');
            document.body.removeChild(input);
            reject(new Error('File selection cancelled'));
          };
          
          input.addEventListener('change', handleFileSelect);
          input.addEventListener('cancel', handleCancel);
          
          // Add to DOM and trigger click
          document.body.appendChild(input);
          console.log('Triggering exam report file picker...');
          input.click();
        });
      } else {
        // Mobile file picker
        console.log('Using mobile file picker for exam report');
        const result = await DocumentPicker.getDocumentAsync({
          type: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/*',
            'text/plain'
          ],
          copyToCacheDirectory: true,
        });
        
        console.log('Exam report document picker result:', result);
        
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const file = result.assets[0];
          console.log('Exam report file selected on mobile:', file);
          
          const newReport: ExamReport = {
            id: Date.now().toString(),
            studentId,
            studentName,
            examId,
            examTitle,
            fileName: file.name,
            fileUri: file.uri,
            fileType: file.mimeType || 'application/octet-stream',
            uploadDate: new Date().toISOString(),
            status: 'pending'
          };
          
          setExamReports(prev => [...prev, newReport]);
          Alert.alert('Success', `Exam report "${file.name}" saved successfully!`);
        } else {
          console.log('Exam report file selection cancelled on mobile');
          throw new Error('File selection cancelled');
        }
      }
    } catch (error) {
      console.error('Error saving exam report:', error);
      if (error instanceof Error && error.message !== 'File selection cancelled') {
        Alert.alert('Error', 'Failed to save exam report. Please try again.');
      }
      throw error;
    }
  }, []);

  const updateExamReport = useCallback((id: string, updates: Partial<ExamReport>) => {
    setExamReports(prev => prev.map(report => 
      report.id === id ? { ...report, ...updates } : report
    ));
  }, []);

  const deleteExamReport = useCallback((id: string) => {
    setExamReports(prev => prev.filter(report => report.id !== id));
    Alert.alert('Success', 'Exam report deleted successfully!');
  }, []);

  return useMemo(() => ({
    submissions,
    announcements,
    qaQuestions,
    lectureNotes,
    examReports,
    pendingSubmissionsCount,
    addAnnouncement,
    updateSubmission,
    likeAnnouncement,
    addComment,
    addQAQuestion,
    answerQAQuestion,
    uploadLectureNote,
    deleteLectureNote,
    saveExamReport,
    updateExamReport,
    deleteExamReport,
  }), [
    submissions,
    announcements,
    qaQuestions,
    lectureNotes,
    examReports,
    pendingSubmissionsCount,
    addAnnouncement,
    updateSubmission,
    likeAnnouncement,
    addComment,
    addQAQuestion,
    answerQAQuestion,
    uploadLectureNote,
    deleteLectureNote,
    saveExamReport,
    updateExamReport,
    deleteExamReport,
  ]);
});