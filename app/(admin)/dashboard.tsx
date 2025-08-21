import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Platform,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, BookOpen, TrendingUp, AlertCircle, Plus, FileText, Upload, BarChart3, X, ChevronDown, Bell, MessageSquare, Heart } from 'lucide-react-native';
import { useAdmin } from '@/hooks/admin-context';
import { useTheme } from '@/hooks/theme-context';
import { useLanguage } from '@/hooks/language-context';
import { useAuth } from '@/hooks/auth-context';
import { supabase } from '@/config/supabase';

// These will be translated dynamically
const getGrades = (t: any) => [t('allGrades'), 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];
const getSubjects = (t: any) => [t('allSubjects'), t('mathematics'), t('science'), t('englishSubject'), t('history'), t('geography'), t('physics'), t('chemistry'), t('biology')];

// Mock data for different grades and subjects
const GRADE_SUBJECT_DATA = {
  'Grade 5': {
    'Mathematics': { students: 245, activeExams: 12, avgScore: 82.5, pendingReviews: 3 },
    'Science': { students: 245, activeExams: 8, avgScore: 79.2, pendingReviews: 1 },
    'English': { students: 245, activeExams: 15, avgScore: 85.1, pendingReviews: 2 },
    'History': { students: 245, activeExams: 6, avgScore: 77.8, pendingReviews: 0 },
    'Geography': { students: 245, activeExams: 4, avgScore: 81.3, pendingReviews: 1 },
  },
  'Grade 6': {
    'Mathematics': { students: 298, activeExams: 18, avgScore: 84.7, pendingReviews: 5 },
    'Science': { students: 298, activeExams: 14, avgScore: 81.9, pendingReviews: 2 },
    'English': { students: 298, activeExams: 22, avgScore: 87.3, pendingReviews: 4 },
    'History': { students: 298, activeExams: 9, avgScore: 79.5, pendingReviews: 1 },
    'Geography': { students: 298, activeExams: 7, avgScore: 83.2, pendingReviews: 0 },
  },
  'Grade 7': {
    'Mathematics': { students: 312, activeExams: 25, avgScore: 86.2, pendingReviews: 8 },
    'Science': { students: 312, activeExams: 19, avgScore: 83.4, pendingReviews: 3 },
    'English': { students: 312, activeExams: 28, avgScore: 89.1, pendingReviews: 6 },
    'History': { students: 312, activeExams: 12, avgScore: 81.7, pendingReviews: 2 },
    'Geography': { students: 312, activeExams: 10, avgScore: 85.0, pendingReviews: 1 },
  },
  'Grade 8': {
    'Mathematics': { students: 387, activeExams: 32, avgScore: 88.1, pendingReviews: 12 },
    'Science': { students: 387, activeExams: 24, avgScore: 85.6, pendingReviews: 7 },
    'English': { students: 387, activeExams: 35, avgScore: 90.4, pendingReviews: 9 },
    'History': { students: 387, activeExams: 15, avgScore: 83.9, pendingReviews: 3 },
    'Geography': { students: 387, activeExams: 13, avgScore: 86.7, pendingReviews: 2 },
  },
  'Grade 9': {
    'Mathematics': { students: 425, activeExams: 28, avgScore: 87.3, pendingReviews: 15 },
    'Science': { students: 425, activeExams: 31, avgScore: 84.8, pendingReviews: 11 },
    'English': { students: 425, activeExams: 26, avgScore: 91.2, pendingReviews: 8 },
    'Physics': { students: 425, activeExams: 18, avgScore: 82.5, pendingReviews: 6 },
    'Chemistry': { students: 425, activeExams: 22, avgScore: 80.9, pendingReviews: 9 },
    'Biology': { students: 425, activeExams: 20, avgScore: 86.3, pendingReviews: 4 },
    'History': { students: 425, activeExams: 14, avgScore: 85.1, pendingReviews: 2 },
  },
  'Grade 10': {
    'Mathematics': { students: 398, activeExams: 35, avgScore: 89.7, pendingReviews: 18 },
    'Science': { students: 398, activeExams: 29, avgScore: 87.2, pendingReviews: 14 },
    'English': { students: 398, activeExams: 31, avgScore: 92.8, pendingReviews: 12 },
    'Physics': { students: 398, activeExams: 25, avgScore: 85.4, pendingReviews: 10 },
    'Chemistry': { students: 398, activeExams: 27, avgScore: 83.7, pendingReviews: 13 },
    'Biology': { students: 398, activeExams: 23, avgScore: 88.9, pendingReviews: 7 },
    'History': { students: 398, activeExams: 16, avgScore: 87.6, pendingReviews: 3 },
  },
};

export default function AdminDashboard() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { uploadLectureNote, saveExamReport, lectureNotes, examReports, pendingSubmissionsCount, submissions } = useAdmin();
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureGrade, setLectureGrade] = useState('');
  const [lectureSubject, setLectureSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState(t('allGrades'));
  const [selectedSubject, setSelectedSubject] = useState(t('allSubjects'));
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [announcementGrade, setAnnouncementGrade] = useState('5');
  const [announcementPriority, setAnnouncementPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleCreateExam = () => {
    router.push('/create-exam');
  };

  const handleImportData = () => {
    setShowImportModal(true);
  };

  const handleUploadLecture = async () => {
    if (!lectureTitle.trim()) {
      Alert.alert('Error', 'Please enter a lecture title');
      return;
    }
    
    try {
      console.log('Starting lecture upload process...');
      await uploadLectureNote(lectureTitle, lectureGrade || undefined, lectureSubject || undefined);
      console.log('Lecture uploaded successfully');
      setLectureTitle('');
      setLectureGrade('');
      setLectureSubject('');
      setShowImportModal(false);
    } catch (error) {
      console.error('Error uploading lecture:', error);
      if (error instanceof Error && error.message !== 'File selection cancelled') {
        Alert.alert('Error', 'Failed to upload lecture note. Please try again.');
      }
    }
  };

  const handleExportReports = () => {
    setShowExportModal(true);
  };

  const handleSaveExamReport = async () => {
    try {
      console.log('Starting exam report save process...');
      await saveExamReport('student1', 'Sample Student', 'exam1', 'Sample Exam');
      console.log('Exam report saved successfully');
      setShowExportModal(false);
    } catch (error) {
      console.error('Error saving exam report:', error);
      if (error instanceof Error && error.message !== 'File selection cancelled') {
        Alert.alert('Error', 'Failed to save exam report. Please try again.');
      }
    }
  };

  const exportData = (type: string) => {
    let data = '';
    let filename = '';
    
    switch (type) {
      case 'lectures':
        if (lectureNotes.length === 0) {
          Alert.alert('No Data', 'No lecture notes available to export.');
          return;
        }
        data = JSON.stringify(lectureNotes, null, 2);
        filename = `lecture_notes_${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'reports':
        if (examReports.length === 0) {
          Alert.alert('No Data', 'No exam reports available to export.');
          return;
        }
        data = JSON.stringify(examReports, null, 2);
        filename = `exam_reports_${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'all':
        if (lectureNotes.length === 0 && examReports.length === 0) {
          Alert.alert('No Data', 'No data available to export.');
          return;
        }
        data = JSON.stringify({ 
          lectureNotes, 
          examReports,
          exportDate: new Date().toISOString(),
          totalLectures: lectureNotes.length,
          totalReports: examReports.length
        }, null, 2);
        filename = `all_data_${new Date().toISOString().split('T')[0]}.json`;
        break;
    }
    
    if (data) {
      console.log(`Exporting ${type} data:`, { filename, dataLength: data.length });
      
      if (Platform.OS === 'web') {
        try {
          const blob = new Blob([data], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          Alert.alert('Success', `${filename} has been downloaded successfully!`);
          console.log('Export completed successfully');
        } catch (error) {
          console.error('Export error:', error);
          Alert.alert('Error', 'Failed to export data. Please try again.');
        }
      } else {
        // On mobile, show a preview and save info
        const preview = data.length > 300 ? data.substring(0, 300) + '...' : data;
        Alert.alert(
          'Export Data', 
          `File: ${filename}\n\nPreview:\n${preview}`,
          [
            { text: 'OK', onPress: () => console.log('Data exported:', filename) }
          ]
        );
      }
    }
    
    setShowExportModal(false);
  };

  const handleReviewSubmissions = () => {
    router.push('/(admin)/submissions');
  };

  const handleNavigateToSubmissions = () => {
    router.push('/(admin)/submissions');
  };

  const handleNavigateToExams = () => {
    router.push('/(admin)/exams');
  };

  const handleNavigateToStudents = () => {
    router.push('/(admin)/students');
  };

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          profiles!announcements_admin_id_fkey(full_name),
          announcement_likes(id, user_id),
          announcement_comments(id, comment, user_id, profiles!announcement_comments_user_id_fkey(full_name))
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading announcements:', error);
        return;
      }

      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementBody.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          admin_id: user.id,
          title: announcementTitle.trim(),
          body: announcementBody.trim(),
          grade_level: parseInt(announcementGrade),
          priority: announcementPriority
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating announcement:', error);
        Alert.alert('Error', 'Failed to create announcement');
        return;
      }

      Alert.alert('Success', 'Announcement created successfully!');
      setAnnouncementTitle('');
      setAnnouncementBody('');
      setAnnouncementGrade('5');
      setAnnouncementPriority('normal');
      setShowAnnouncementModal(false);
      loadAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      Alert.alert('Error', 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeAnnouncement = async (announcementId: number) => {
    if (!user?.id) return;

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('announcement_likes')
        .select('id')
        .eq('announcement_id', announcementId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('announcement_likes')
          .delete()
          .eq('announcement_id', announcementId)
          .eq('user_id', user.id);
      } else {
        // Like
        await supabase
          .from('announcement_likes')
          .insert({
            announcement_id: announcementId,
            user_id: user.id
          });
      }

      loadAnnouncements();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleAddComment = async (announcementId: number, comment: string) => {
    if (!user?.id || !comment.trim()) return;

    try {
      await supabase
        .from('announcement_comments')
        .insert({
          announcement_id: announcementId,
          user_id: user.id,
          comment: comment.trim()
        });

      loadAnnouncements();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  // Calculate performance metrics based on actual data
  const performanceMetrics = useMemo(() => {
    const currentDate = new Date();
    const oneWeekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Calculate exam completion rate for this week
    const thisWeekSubmissions = submissions.filter(sub => {
      const submissionDate = new Date(sub.submittedDate.split('/').reverse().join('-'));
      return submissionDate >= oneWeekAgo;
    });
    
    const lastWeekSubmissions = submissions.filter(sub => {
      const submissionDate = new Date(sub.submittedDate.split('/').reverse().join('-'));
      const twoWeeksAgo = new Date(currentDate.getTime() - 14 * 24 * 60 * 60 * 1000);
      return submissionDate >= twoWeeksAgo && submissionDate < oneWeekAgo;
    });
    
    const completionRateChange = lastWeekSubmissions.length > 0 
      ? ((thisWeekSubmissions.length - lastWeekSubmissions.length) / lastWeekSubmissions.length * 100)
      : 15; // Default to +15% if no previous data
    
    // Calculate average score for this month
    const thisMonthGradedSubmissions = submissions.filter(sub => {
      const submissionDate = new Date(sub.submittedDate.split('/').reverse().join('-'));
      return submissionDate >= oneMonthAgo && sub.grade && sub.status === 'Graded';
    });
    
    const averageScore = thisMonthGradedSubmissions.length > 0
      ? thisMonthGradedSubmissions.reduce((sum, sub) => {
          const grade = parseFloat(sub.grade?.replace('%', '') || '0');
          return sum + grade;
        }, 0) / thisMonthGradedSubmissions.length
      : 89.2; // Default value
    
    // Calculate active students (unique students from submissions)
    const activeStudents = new Set(submissions.map(sub => sub.studentName)).size;
    const totalActiveStudents = activeStudents > 0 ? activeStudents * 142 : 2847; // Scale up for demo
    
    return {
      completionRateChange: completionRateChange > 0 ? `+${completionRateChange.toFixed(0)}%` : `${completionRateChange.toFixed(0)}%`,
      averageScore: averageScore.toFixed(1),
      activeStudents: totalActiveStudents.toLocaleString()
    };
  }, [submissions.length]);

  // Calculate filtered statistics based on selected grade and subject
  const filteredStats = useMemo(() => {
    const allGradesText = t('allGrades');
    const allSubjectsText = t('allSubjects');
    const subjects = getSubjects(t);
    
    if (selectedGrade === allGradesText && selectedSubject === allSubjectsText) {
      // Show overall statistics
      const totalStudents = Object.values(GRADE_SUBJECT_DATA).reduce((total, gradeData) => {
        return total + Object.values(gradeData).reduce((gradeTotal, subjectData) => gradeTotal + subjectData.students, 0);
      }, 0) / subjects.length; // Avoid double counting students
      
      const totalActiveExams = Object.values(GRADE_SUBJECT_DATA).reduce((total, gradeData) => {
        return total + Object.values(gradeData).reduce((gradeTotal, subjectData) => gradeTotal + subjectData.activeExams, 0);
      }, 0);
      
      const avgScore = Object.values(GRADE_SUBJECT_DATA).reduce((total, gradeData) => {
        const gradeAvg = Object.values(gradeData).reduce((gradeTotal, subjectData) => gradeTotal + subjectData.avgScore, 0) / Object.values(gradeData).length;
        return total + gradeAvg;
      }, 0) / Object.keys(GRADE_SUBJECT_DATA).length;
      
      const totalPendingReviews = Object.values(GRADE_SUBJECT_DATA).reduce((total, gradeData) => {
        return total + Object.values(gradeData).reduce((gradeTotal, subjectData) => gradeTotal + subjectData.pendingReviews, 0);
      }, 0);
      
      return {
        students: Math.round(totalStudents),
        activeExams: totalActiveExams,
        avgScore: avgScore.toFixed(1),
        pendingReviews: totalPendingReviews
      };
    }
    
    if (selectedGrade !== allGradesText && selectedSubject === allSubjectsText) {
      // Show statistics for selected grade across all subjects
      const gradeData = GRADE_SUBJECT_DATA[selectedGrade as keyof typeof GRADE_SUBJECT_DATA];
      if (!gradeData) return { students: 0, activeExams: 0, avgScore: '0.0', pendingReviews: 0 };
      
      const subjects = Object.values(gradeData);
      const totalActiveExams = subjects.reduce((total, subject) => total + subject.activeExams, 0);
      const avgScore = subjects.reduce((total, subject) => total + subject.avgScore, 0) / subjects.length;
      const totalPendingReviews = subjects.reduce((total, subject) => total + subject.pendingReviews, 0);
      
      return {
        students: subjects[0]?.students || 0,
        activeExams: totalActiveExams,
        avgScore: avgScore.toFixed(1),
        pendingReviews: totalPendingReviews
      };
    }
    
    if (selectedGrade === allGradesText && selectedSubject !== allSubjectsText) {
      // Show statistics for selected subject across all grades
      const subjectStats = Object.values(GRADE_SUBJECT_DATA).reduce((acc, gradeData) => {
        const subjectData = gradeData[selectedSubject as keyof typeof gradeData];
        if (subjectData) {
          acc.students += subjectData.students;
          acc.activeExams += subjectData.activeExams;
          acc.avgScores.push(subjectData.avgScore);
          acc.pendingReviews += subjectData.pendingReviews;
        }
        return acc;
      }, { students: 0, activeExams: 0, avgScores: [] as number[], pendingReviews: 0 });
      
      const avgScore = subjectStats.avgScores.length > 0 
        ? subjectStats.avgScores.reduce((a, b) => a + b, 0) / subjectStats.avgScores.length 
        : 0;
      
      return {
        students: subjectStats.students,
        activeExams: subjectStats.activeExams,
        avgScore: avgScore.toFixed(1),
        pendingReviews: subjectStats.pendingReviews
      };
    }
    
    // Show statistics for specific grade and subject
    const gradeData = GRADE_SUBJECT_DATA[selectedGrade as keyof typeof GRADE_SUBJECT_DATA];
    const subjectData = gradeData?.[selectedSubject as keyof typeof gradeData];
    
    if (!subjectData) return { students: 0, activeExams: 0, avgScore: '0.0', pendingReviews: 0 };
    
    return {
      students: subjectData.students,
      activeExams: subjectData.activeExams,
      avgScore: subjectData.avgScore.toFixed(1),
      pendingReviews: subjectData.pendingReviews
    };
  }, [selectedGrade, selectedSubject, t]);

  const stats = [
    {
      title: t('totalStudents'),
      value: filteredStats.students.toLocaleString(),
      change: selectedGrade === t('allGrades') && selectedSubject === t('allSubjects') ? '+12% from last month' : `${selectedGrade} ${selectedSubject !== t('allSubjects') ? selectedSubject : ''}`,
      icon: Users,
      color: '#4F46E5',
      bgColor: '#EEF2FF',
    },
    {
      title: t('activeExams'),
      value: filteredStats.activeExams.toString(),
      change: selectedGrade === t('allGrades') && selectedSubject === t('allSubjects') ? '8 scheduled today' : 'Currently active',
      icon: BookOpen,
      color: '#059669',
      bgColor: '#ECFDF5',
    },
    {
      title: t('avgScore'),
      value: `${filteredStats.avgScore}%`,
      change: selectedGrade === t('allGrades') && selectedSubject === t('allSubjects') ? '+2.1% improvement' : 'Current average',
      icon: TrendingUp,
      color: '#DC2626',
      bgColor: '#FEF2F2',
    },
    {
      title: t('pendingReviews'),
      value: filteredStats.pendingReviews.toString(),
      change: filteredStats.pendingReviews > 0 ? 'Needs attention' : 'All caught up',
      icon: AlertCircle,
      color: '#D97706',
      bgColor: '#FFFBEB',
    },
  ];

  const recentSubmissions = [
    {
      id: '1',
      studentName: 'John Smith',
      examName: 'Algebra II - Final Exam',
      status: 'Pending',
      date: '15/01/2025',
    },
    {
      id: '2',
      studentName: 'Sarah Johnson',
      examName: 'Geometry - Chapter 8 Quiz',
      status: 'Graded',
      date: '15/01/2025',
    },
    {
      id: '3',
      studentName: 'Mike Davis',
      examName: 'Calculus I - Midterm',
      status: 'Reviewed',
      date: '14/01/2025',
    },
  ];

  const todaySchedule = [
    {
      id: '1',
      title: 'Calculus Quiz',
      time: '2:00 PM - Grade 12',
    },
    {
      id: '2',
      title: 'Physics Lab Test',
      time: '3:30 PM - Grade 11',
    },
    {
      id: '3',
      title: 'Staff Meeting',
      time: '4:00 PM - Conference Room',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return { bg: '#FEF3C7', text: '#D97706' };
      case 'Graded':
        return { bg: '#D1FAE5', text: '#059669' };
      case 'Reviewed':
        return { bg: '#E5E7EB', text: '#6B7280' };
      default:
        return { bg: '#E5E7EB', text: '#6B7280' };
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>{t('mathTrackAdmin')}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('administrationDashboard')}</Text>
          </View>
          <View style={styles.adminInfo}>
            <Text style={[styles.adminRole, { color: colors.text }]}>{t('adminRole')}</Text>
            <Text style={[styles.adminEmail, { color: colors.textSecondary }]}>alijawad12@gmail.com</Text>
          </View>
        </View>

        {/* Navigation Tabs */}
        <View style={[styles.navTabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={[styles.navTab, styles.activeNavTab, { borderBottomColor: colors.primary }]}>
            <Text style={[styles.navTabText, styles.activeNavTabText, { color: colors.primary }]}>{t('dashboard')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navTab} onPress={handleNavigateToSubmissions}>
            <Text style={[styles.navTabText, { color: colors.textSecondary }]}>{t('submissions')} ({pendingSubmissionsCount})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navTab} onPress={handleNavigateToExams}>
            <Text style={[styles.navTabText, { color: colors.textSecondary }]}>{t('exams')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navTab} onPress={handleNavigateToStudents}>
            <Text style={[styles.navTabText, { color: colors.textSecondary }]}>{t('students')}</Text>
          </TouchableOpacity>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <View key={index} style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <View style={styles.statHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: stat.bgColor }]}>
                    <IconComponent size={20} color={stat.color} />
                  </View>
                  <Text style={[styles.statTitle, { color: colors.text }]}>{stat.title}</Text>
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
                <Text style={[styles.statChange, { color: colors.textSecondary }]}>{stat.change}</Text>
              </View>
            );
          })}
        </View>

        {/* Filters */}
        <View style={[styles.filtersSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.filtersTitle, { color: colors.text }]}>{t('filters')}:</Text>
          <View style={styles.filtersRow}>
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>{t('gradeDisplay')}:</Text>
              <TouchableOpacity 
                style={[styles.filterDropdown, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => {
                  setShowGradeDropdown(!showGradeDropdown);
                  setShowSubjectDropdown(false);
                }}
              >
                <Text style={[styles.filterValue, { color: colors.text }]}>{selectedGrade}</Text>
                <ChevronDown size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              {showGradeDropdown && (
                <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {getGrades(t).map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.dropdownItem,
                        { borderBottomColor: colors.border },
                        selectedGrade === item && { backgroundColor: isDark ? colors.card : '#EEF2FF' }
                      ]}
                      onPress={() => {
                        setSelectedGrade(item);
                        setShowGradeDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        { color: colors.text },
                        selectedGrade === item && { color: colors.primary, fontWeight: '600' }
                      ]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>Subject:</Text>
              <TouchableOpacity 
                style={[styles.filterDropdown, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => {
                  setShowSubjectDropdown(!showSubjectDropdown);
                  setShowGradeDropdown(false);
                }}
              >
                <Text style={[styles.filterValue, { color: colors.text }]}>{selectedSubject}</Text>
                <ChevronDown size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              {showSubjectDropdown && (
                <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {getSubjects(t).map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.dropdownItem,
                        { borderBottomColor: colors.border },
                        selectedSubject === item && { backgroundColor: isDark ? colors.card : '#EEF2FF' }
                      ]}
                      onPress={() => {
                        setSelectedSubject(item);
                        setShowSubjectDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        { color: colors.text },
                        selectedSubject === item && { color: colors.primary, fontWeight: '600' }
                      ]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>



        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('quickActions')}</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={[styles.quickActionCard, { backgroundColor: colors.surface }]} onPress={handleCreateExam}>
              <Plus size={24} color="#4F46E5" />
              <Text style={[styles.quickActionText, { color: colors.text }]}>{t('createExam')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickActionCard, { backgroundColor: colors.surface }]} onPress={handleImportData}>
              <Upload size={24} color="#4F46E5" />
              <Text style={[styles.quickActionText, { color: colors.text }]}>{t('importData')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickActionCard, { backgroundColor: colors.surface }]} onPress={handleExportReports}>
              <BarChart3 size={24} color="#4F46E5" />
              <Text style={[styles.quickActionText, { color: colors.text }]}>{t('exportReports')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickActionCard, { backgroundColor: colors.surface }]} onPress={handleReviewSubmissions}>
              <FileText size={24} color="#4F46E5" />
              <Text style={[styles.quickActionText, { color: colors.text }]}>{t('reviewSubmissions')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Submissions */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderWithAction}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('recentSubmissions')}</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={handleNavigateToSubmissions}
            >
              <Text style={styles.viewAllText}>{t('viewAll')}</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.submissionsContainer, { backgroundColor: colors.surface }]}>
            {recentSubmissions.map((submission) => {
              const statusColors = getStatusColor(submission.status);
              return (
                <TouchableOpacity 
                  key={submission.id} 
                  style={styles.submissionItem}
                  onPress={handleNavigateToSubmissions}
                >
                  <View style={styles.submissionInfo}>
                    <Text style={[styles.submissionStudent, { color: colors.text }]}>{submission.studentName}</Text>
                    <Text style={[styles.submissionExam, { color: colors.textSecondary }]}>{submission.examName}</Text>
                  </View>
                  <View style={styles.submissionMeta}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                      <Text style={[styles.statusText, { color: statusColors.text }]}>
                        {submission.status}
                      </Text>
                    </View>
                    <Text style={[styles.submissionDate, { color: colors.textSecondary }]}>{submission.date}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Today's Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderWithAction}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('todaysSchedule')}</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/(admin)/profile')}
            >
              <Text style={styles.viewAllText}>{t('manageSchedule')}</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.scheduleContainer, { backgroundColor: colors.surface }]}>
            {todaySchedule.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.scheduleItem}
                onPress={() => router.push('/(admin)/profile')}
              >
                <View style={styles.scheduleDot} />
                <View style={styles.scheduleContent}>
                  <Text style={[styles.scheduleTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.scheduleTime, { color: colors.textSecondary }]}>{item.time}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>



        {/* Performance Overview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('performanceOverview')}</Text>
          <View style={[styles.performanceContainer, { backgroundColor: colors.surface }]}>
            <TouchableOpacity 
              style={styles.performanceItem}
              onPress={() => router.push('/(admin)/submissions')}
            >
              <Text style={[styles.performanceLabel, { color: colors.textSecondary }]}>{t('thisWeek')}</Text>
              <Text style={[styles.performanceValue, { color: performanceMetrics.completionRateChange.startsWith('+') ? '#059669' : '#DC2626' }]}>
                {performanceMetrics.completionRateChange}
              </Text>
              <Text style={[styles.performanceSubtext, { color: colors.textSecondary }]}>{t('examCompletionRate')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.performanceItem}
              onPress={() => router.push('/(admin)/submissions')}
            >
              <Text style={[styles.performanceLabel, { color: colors.textSecondary }]}>{t('thisMonth')}</Text>
              <Text style={[styles.performanceValue, { color: '#4F46E5' }]}>
                {performanceMetrics.averageScore}%
              </Text>
              <Text style={[styles.performanceSubtext, { color: colors.textSecondary }]}>{t('averageScore')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.performanceItem}
              onPress={() => router.push('/(admin)/students')}
            >
              <Text style={[styles.performanceLabel, { color: colors.textSecondary }]}>{t('activeStudents')}</Text>
              <Text style={[styles.performanceValue, { color: '#059669' }]}>
                {performanceMetrics.activeStudents}
              </Text>
              <Text style={[styles.performanceSubtext, { color: colors.textSecondary }]}>{t('currentlyEnrolled')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Import Data Modal */}
      <Modal
        visible={showImportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Upload Lecture Notes</Text>
              <TouchableOpacity onPress={() => setShowImportModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Lecture Title *</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={lectureTitle}
                  onChangeText={setLectureTitle}
                  placeholder="Enter lecture title"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Grade (Optional)</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={lectureGrade}
                  onChangeText={setLectureGrade}
                  placeholder="e.g., Grade 12"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Subject (Optional)</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={lectureSubject}
                  onChangeText={setLectureSubject}
                  placeholder="e.g., Mathematics"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setShowImportModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => {
                  console.log('Upload button pressed with data:', { lectureTitle, lectureGrade, lectureSubject });
                  handleUploadLecture();
                }}
              >
                <Upload size={16} color="#FFFFFF" />
                <Text style={styles.uploadButtonText}>Browse & Upload</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Export Reports Modal */}
      <Modal
        visible={showExportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Export & Save Reports</Text>
              <TouchableOpacity onPress={() => setShowExportModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                Choose what you want to export or save:
              </Text>
              
              <TouchableOpacity
                style={[styles.exportOption, { backgroundColor: isDark ? colors.card : '#F9FAFB' }]}
                onPress={() => {
                  console.log('Exporting lecture notes...');
                  exportData('lectures');
                }}
              >
                <FileText size={20} color={colors.primary} />
                <Text style={[styles.exportOptionText, { color: colors.text }]}>Export Lecture Notes ({lectureNotes.length})</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.exportOption, { backgroundColor: isDark ? colors.card : '#F9FAFB' }]}
                onPress={() => {
                  console.log('Exporting exam reports...');
                  exportData('reports');
                }}
              >
                <BarChart3 size={20} color={colors.primary} />
                <Text style={[styles.exportOptionText, { color: colors.text }]}>Export Exam Reports ({examReports.length})</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.exportOption, { backgroundColor: isDark ? colors.card : '#F9FAFB' }]}
                onPress={() => {
                  console.log('Exporting all data...');
                  exportData('all');
                }}
              >
                <Upload size={20} color={colors.primary} />
                <Text style={[styles.exportOptionText, { color: colors.text }]}>Export All Data</Text>
              </TouchableOpacity>
              
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              
              <TouchableOpacity
                style={[styles.exportOption, { backgroundColor: isDark ? colors.card : '#F9FAFB' }]}
                onPress={() => {
                  console.log('Saving new exam report...');
                  handleSaveExamReport();
                }}
              >
                <Plus size={20} color={colors.success} />
                <Text style={[styles.exportOptionText, { color: colors.success }]}>
                  Save New Exam Report
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setShowExportModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* New Announcement Modal */}
      <Modal
        visible={showAnnouncementModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAnnouncementModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Create New Announcement</Text>
              <TouchableOpacity onPress={() => setShowAnnouncementModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Title *</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  value={announcementTitle}
                  onChangeText={setAnnouncementTitle}
                  placeholder="Enter announcement title"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Message *</Text>
                <TextInput
                  style={[styles.textAreaInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  value={announcementBody}
                  onChangeText={setAnnouncementBody}
                  placeholder="Enter announcement message"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
              
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Grade *</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={styles.horizontalPicker}>
                      {['5', '6', '7', '8', '9', '10'].map((item) => (
                        <TouchableOpacity
                          key={item}
                          style={[
                            styles.gradeOption,
                            { backgroundColor: announcementGrade === item ? colors.primary : colors.background }
                          ]}
                          onPress={() => setAnnouncementGrade(item)}
                        >
                          <Text style={[
                            styles.gradeOptionText,
                            { color: announcementGrade === item ? '#FFFFFF' : colors.text }
                          ]}>
                            {item}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
                
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Priority</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={styles.horizontalPicker}>
                      {[{ key: 'normal', label: 'Normal' }, { key: 'high', label: 'High' }, { key: 'urgent', label: 'Urgent' }].map((item) => (
                        <TouchableOpacity
                          key={item.key}
                          style={[
                            styles.priorityOption,
                            { backgroundColor: announcementPriority === item.key ? 
                              (item.key === 'urgent' ? '#DC2626' : item.key === 'high' ? '#D97706' : colors.primary) : 
                              colors.background 
                            }
                          ]}
                          onPress={() => setAnnouncementPriority(item.key as 'normal' | 'high' | 'urgent')}
                        >
                          <Text style={[
                            styles.priorityOptionText,
                            { color: announcementPriority === item.key ? '#FFFFFF' : colors.text }
                          ]}>
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setShowAnnouncementModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateAnnouncement}
                disabled={loading}
              >
                <Text style={styles.createButtonText}>
                  {loading ? 'Creating...' : 'Create Announcement'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    flex: 1,
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    flexShrink: 1,
  },
  adminInfo: {
    alignItems: 'flex-end',
    flexShrink: 0,
    maxWidth: '40%',
  },
  adminRole: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  adminEmail: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'right',
    flexShrink: 1,
  },
  navTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  navTab: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginRight: 12,
    flex: 1,
    alignItems: 'center',
  },
  activeNavTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
  },
  navTabText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 1,
  },
  activeNavTabText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  filtersSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 9999,
    position: 'relative',
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },

  filterLabel: {
    fontSize: 12,
    color: '#374151',
    marginRight: 6,
    flexShrink: 0,
  },
  filterDropdown: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 100,
    maxWidth: 140,
  },
  filterValue: {
    fontSize: 12,
    color: '#111827',
    marginRight: 4,
    flexShrink: 1,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 10001,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedDropdownItem: {
    backgroundColor: '#EEF2FF',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#111827',
  },
  selectedDropdownItemText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    zIndex: 10000,
    flex: 1,
    minWidth: 0,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 20,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  statCard: {
    width: '48.5%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  statChange: {
    fontSize: 12,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },

  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionCard: {
    width: '48%',
    minWidth: 120,
    maxWidth: 180,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    gap: 8,
    aspectRatio: 1.2,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
    flexShrink: 1,
  },
  submissionsContainer: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  submissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  submissionInfo: {
    flex: 1,
  },
  submissionStudent: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  submissionExam: {
    fontSize: 12,
  },
  submissionMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  submissionDate: {
    fontSize: 12,
  },
  scheduleContainer: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  scheduleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  scheduleTime: {
    fontSize: 12,
  },
  performanceContainer: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  performanceItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  performanceLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  performanceSubtext: {
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    gap: 12,
  },
  exportOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  sectionHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  newAnnouncementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  newAnnouncementButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gradeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
  },
  gradeFilterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  announcementsContainer: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  announcementCard: {
    borderLeftWidth: 4,
    paddingLeft: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  announcementBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  announcementMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  announcementAuthor: {
    fontSize: 12,
    fontWeight: '500',
  },
  announcementDate: {
    fontSize: 12,
  },
  announcementActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  commentsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  commentItem: {
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 12,
    lineHeight: 16,
  },
  moreComments: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  textAreaInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 80,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  gradeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  gradeOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priorityOption: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginHorizontal: 1,
  },
  priorityOptionText: {
    fontSize: 10,
    fontWeight: '600',
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  horizontalPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
});