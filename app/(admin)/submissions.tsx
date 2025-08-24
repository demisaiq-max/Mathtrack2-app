import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Eye, Download, Edit, X, Save, FileText, ChevronDown, RefreshCw, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAdmin } from '@/hooks/admin-context';
import { useTheme } from '@/hooks/theme-context';
import { useLanguage } from '@/hooks/language-context';

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

interface GradingData {
  grade: string;
  feedback: string;
}

export default function SubmissionsScreen() {
  const { submissions, updateSubmission, deleteSubmission, pendingSubmissionsCount, isLoading, fetchSubmissions } = useAdmin();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState(t('allGradesFilter'));
  const [selectedSubject, setSelectedSubject] = useState(t('allSubjects'));
  const [isGradeDropdownOpen, setIsGradeDropdownOpen] = useState(false);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);

  const handleGradeDropdownToggle = () => {
    setIsSubjectDropdownOpen(false);
    setIsGradeDropdownOpen(!isGradeDropdownOpen);
  };

  const handleSubjectDropdownToggle = () => {
    setIsGradeDropdownOpen(false);
    setIsSubjectDropdownOpen(!isSubjectDropdownOpen);
  };
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [isGradingModalVisible, setIsGradingModalVisible] = useState(false);
  const [gradingData, setGradingData] = useState<GradingData>({ grade: '', feedback: '' });
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchSubmissions();
    } catch (error) {
      console.error('Error refreshing submissions:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const gradeOptions = [
    t('allGradesFilter'),
    t('grade5'),
    t('grade6'),
    t('grade7'),
    t('grade8'),
    t('grade9'),
    t('grade10'),
  ];

  const subjectOptions = [
    t('allSubjects'),
    t('mathematics'),
    t('science'),
    t('englishSubject'),
    t('physics'),
    t('chemistry'),
    t('biology'),
    t('history'),
    t('geography'),
  ];

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(submission => {
      const matchesSearch = searchQuery === '' || 
        submission.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.examName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.fileName.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Extract grade number from exam name (e.g., "Grade 5" -> "5")
      const examGradeMatch = submission.examName.match(/Grade (\d+)/);
      const examGrade = examGradeMatch ? examGradeMatch[1] : null;
      
      // Extract grade number from selected filter (e.g., "Grade 5" or "5학년" -> "5")
      const selectedGradeNumber = selectedGrade === t('allGradesFilter') ? null : 
        selectedGrade.replace(/Grade |학년/g, '').trim();
      
      const matchesGrade = selectedGrade === t('allGradesFilter') || 
        (examGrade && selectedGradeNumber && examGrade === selectedGradeNumber);
      
      // Extract subject from exam name (everything after the grade and dash)
      const subjectMatch = submission.examName.match(/Grade \d+ (\w+)/);
      const examSubject = subjectMatch ? subjectMatch[1].toLowerCase() : '';
      
      const matchesSubject = selectedSubject === t('allSubjects') || 
        examSubject.includes(selectedSubject.toLowerCase()) ||
        submission.examName.toLowerCase().includes(selectedSubject.toLowerCase());
      
      return matchesSearch && matchesGrade && matchesSubject;
    });
  }, [submissions, searchQuery, selectedGrade, selectedSubject, t]);



  const handleViewSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsViewModalVisible(true);
  };

  const handleDownloadSubmission = async (submission: Submission) => {
    try {
      if (!submission.fileUrl) {
        Alert.alert('Error', 'File URL not available for download');
        return;
      }

      if (Platform.OS === 'web') {
        // Web download
        const link = document.createElement('a');
        link.href = submission.fileUrl;
        link.download = submission.fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Alert.alert('Success', `${submission.fileName} download started`);
      } else {
        // Mobile - open in browser or external app
        const supported = await Linking.canOpenURL(submission.fileUrl);
        
        if (supported) {
          await Linking.openURL(submission.fileUrl);
          Alert.alert('Success', `Opening ${submission.fileName}`);
        } else {
          Alert.alert('Error', 'Cannot open this file type on this device');
        }
      }
    } catch (error) {
      console.error('Error downloading submission:', error);
      Alert.alert('Error', 'Failed to download file. Please try again.');
    }
  };

  const handleGradeSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGradingData({
      grade: submission.grade || '',
      feedback: submission.feedback || ''
    });
    setIsGradingModalVisible(true);
  };

  const handleSaveGrade = () => {
    if (!selectedSubmission) return;
    
    if (!gradingData.grade.trim()) {
      Alert.alert('Error', 'Please enter a grade');
      return;
    }

    updateSubmission(selectedSubmission.id, {
      grade: gradingData.grade,
      feedback: gradingData.feedback,
      status: 'Graded' as const
    });
    
    setIsGradingModalVisible(false);
    setSelectedSubmission(null);
    setGradingData({ grade: '', feedback: '' });
    
    Alert.alert(t('success'), t('gradeSaved'));
  };

  const handleDeleteSubmission = (submission: Submission) => {
    Alert.alert(
      'Delete Submission',
      `Are you sure you want to delete ${submission.studentName}'s submission for ${submission.examName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSubmission(submission.id);
            } catch (error) {
              console.error('Error deleting submission:', error);
            }
          },
        },
      ]
    );
  };

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
          <TouchableOpacity 
            style={styles.navTab}
            onPress={() => router.push('/(admin)/dashboard')}
          >
            <Text style={[styles.navTabText, { color: colors.textSecondary }]}>{t('dashboard')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navTab, styles.activeNavTab]}>
            <Text style={[styles.navTabText, styles.activeNavTabText, { color: colors.primary }]}>{t('submissions')} ({pendingSubmissionsCount})</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navTab}
            onPress={() => router.push('/(admin)/exams')}
          >
            <Text style={[styles.navTabText, { color: colors.textSecondary }]}>{t('exams')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navTab}
            onPress={() => router.push('/(admin)/students')}
          >
            <Text style={[styles.navTabText, { color: colors.textSecondary }]}>{t('students')}</Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={[styles.filtersSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.filtersTitle, { color: colors.text }]}>{t('filters')}:</Text>
          <View style={styles.filtersRow}>
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>{t('gradeDisplay')}:</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={[styles.filterDropdown, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={handleGradeDropdownToggle}
                >
                  <Text style={[styles.filterValue, { color: colors.text }]}>{selectedGrade}</Text>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                {isGradeDropdownOpen && (
                  <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                      {gradeOptions.map((grade) => (
                        <TouchableOpacity
                          key={grade}
                          style={[styles.dropdownItem, selectedGrade === grade && { backgroundColor: colors.primary + '20' }]}
                          onPress={() => {
                            setSelectedGrade(grade);
                            setIsGradeDropdownOpen(false);
                          }}
                        >
                          <Text style={[styles.dropdownItemText, { color: colors.text }]}>{grade}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>{t('subject')}:</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={[styles.filterDropdown, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={handleSubjectDropdownToggle}
                >
                  <Text style={[styles.filterValue, { color: colors.text }]}>{selectedSubject}</Text>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                {isSubjectDropdownOpen && (
                  <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                      {subjectOptions.map((subject) => (
                        <TouchableOpacity
                          key={subject}
                          style={[styles.dropdownItem, selectedSubject === subject && { backgroundColor: colors.primary + '20' }]}
                          onPress={() => {
                            setSelectedSubject(subject);
                            setIsSubjectDropdownOpen(false);
                          }}
                        >
                          <Text style={[styles.dropdownItemText, { color: colors.text }]}>{subject}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Answer Sheet Submissions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('answerSheetSubmissions')}</Text>
            <View style={styles.sectionActions}>
              <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Search size={16} color={colors.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder={`${t('search')} ${t('studentCol').toLowerCase()}, ${t('examCol').toLowerCase()}, ${t('file').toLowerCase()}...`}
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <TouchableOpacity
                style={[styles.refreshButton, { backgroundColor: colors.primary }]}
                onPress={handleRefresh}
                disabled={isLoading || refreshing}
              >
                <RefreshCw size={16} color={colors.primaryText} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Loading State */}
          {isLoading && (
            <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading submissions...</Text>
            </View>
          )}

          {/* Empty State */}
          {!isLoading && filteredSubmissions.length === 0 && (
            <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
              <FileText size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Submissions Found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>There are no exam submissions to display at this time.</Text>
            </View>
          )}

          {/* Table Container with Horizontal Scroll */}
          {!isLoading && filteredSubmissions.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={true} 
              style={styles.tableContainer}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
            >
              <View style={styles.table}>
              {/* Table Header */}
              <View style={[styles.tableHeader, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.tableHeaderText, styles.studentColumn, { color: colors.textSecondary }]}>{t('studentCol')}</Text>
                <Text style={[styles.tableHeaderText, styles.examColumn, { color: colors.textSecondary }]}>{t('examCol')}</Text>
                <Text style={[styles.tableHeaderText, styles.fileColumn, { color: colors.textSecondary }]}>{t('file')}</Text>
                <Text style={[styles.tableHeaderText, styles.dateColumn, { color: colors.textSecondary }]}>{t('submitted')}</Text>
                <Text style={[styles.tableHeaderText, styles.statusColumn, { color: colors.textSecondary }]}>{t('status')}</Text>
                <Text style={[styles.tableHeaderText, styles.gradeColumn, { color: colors.textSecondary }]}>{t('gradeCol')}</Text>
                <Text style={[styles.tableHeaderText, styles.actionsColumn, { color: colors.textSecondary }]}>{t('actions')}</Text>
              </View>

              {/* Table Rows */}
              {filteredSubmissions.map((submission) => {
                const statusColors = getStatusColor(submission.status);
                return (
                  <View key={submission.id} style={[styles.tableRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={[styles.tableCell, styles.studentColumn]}>
                      <View style={styles.studentInfo}>
                        <View style={styles.studentAvatar}>
                          <Text style={styles.studentInitial}>{submission.studentInitial}</Text>
                        </View>
                        <Text style={[styles.studentName, { color: colors.text }]} numberOfLines={2}>{submission.studentName}</Text>
                      </View>
                    </View>
                    <View style={[styles.tableCell, styles.examColumn]}>
                      <Text style={[styles.examName, { color: colors.text }]} numberOfLines={2}>{submission.examName}</Text>
                    </View>
                    <View style={[styles.tableCell, styles.fileColumn]}>
                      <View style={styles.fileInfo}>
                        <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={2}>{submission.fileName}</Text>
                        <Text style={[styles.fileSize, { color: colors.textSecondary }]}>{submission.fileSize}</Text>
                      </View>
                    </View>
                    <View style={[styles.tableCell, styles.dateColumn]}>
                      <Text style={[styles.submittedDate, { color: colors.text }]}>{submission.submittedDate}</Text>
                    </View>
                    <View style={[styles.tableCell, styles.statusColumn]}>
                      <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                        <Text style={[styles.statusText, { color: statusColors.text }]}>
                          {submission.status}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.tableCell, styles.gradeColumn]}>
                      <Text style={[styles.gradeText, { color: colors.success }]}>{submission.grade || '-'}</Text>
                    </View>
                    <View style={[styles.tableCell, styles.actionsColumn]}>
                      <View style={styles.actionsContainer}>
                        <TouchableOpacity 
                          style={styles.actionIcon}
                          onPress={() => handleViewSubmission(submission)}
                        >
                          <Eye size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.actionIcon}
                          onPress={() => handleDownloadSubmission(submission)}
                        >
                          <Download size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.actionIcon}
                          onPress={() => handleGradeSubmission(submission)}
                        >
                          <Edit size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.actionIcon}
                          onPress={() => handleDeleteSubmission(submission)}
                        >
                          <Trash2 size={16} color={colors.error || '#EF4444'} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* View Submission Modal */}
      <Modal
        visible={isViewModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsViewModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <View style={styles.modalHeaderLeft}>
              <FileText size={24} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('viewSubmission')}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsViewModalVisible(false)}
            >
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          {selectedSubmission && (
            <ScrollView style={styles.modalContent}>
              <View style={[styles.submissionDetails, { backgroundColor: colors.surface }]}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('studentCol')}:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selectedSubmission.studentName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('examCol')}:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selectedSubmission.examName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('file')}:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selectedSubmission.fileName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Size:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selectedSubmission.fileSize}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('submitted')}:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selectedSubmission.submittedDate}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('status')}:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedSubmission.status).bg }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(selectedSubmission.status).text }]}>
                      {selectedSubmission.status}
                    </Text>
                  </View>
                </View>
                {selectedSubmission.grade && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('gradeCol')}:</Text>
                    <Text style={[styles.detailValue, styles.gradeValue, { color: colors.success }]}>{selectedSubmission.grade}</Text>
                  </View>
                )}
                {selectedSubmission.feedback && (
                  <View style={styles.feedbackSection}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('feedback')}:</Text>
                    <Text style={[styles.feedbackText, { color: colors.text }]}>{selectedSubmission.feedback}</Text>
                  </View>
                )}
              </View>
              
              <View style={[styles.filePreview, { backgroundColor: colors.surface }]}>
                <View style={styles.previewHeader}>
                  <Text style={[styles.previewTitle, { color: colors.text }]}>{t('filePreview')}</Text>
                  {selectedSubmission.fileUrl && (
                    <TouchableOpacity 
                      style={[styles.downloadButton, { backgroundColor: colors.primary }]}
                      onPress={() => handleDownloadSubmission(selectedSubmission)}
                    >
                      <Download size={16} color={colors.primaryText} />
                      <Text style={[styles.downloadButtonText, { color: colors.primaryText }]}>Download</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={[styles.previewPlaceholder, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <FileText size={48} color={colors.textSecondary} />
                  <Text style={[styles.previewText, { color: colors.textSecondary }]}>{t('pdfPreviewNotAvailable')}</Text>
                  <Text style={[styles.previewSubtext, { color: colors.textSecondary }]}>{selectedSubmission.fileUrl ? 'Click download button above to view the file' : 'File not available for download'}</Text>
                </View>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Grading Modal */}
      <Modal
        visible={isGradingModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsGradingModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <View style={styles.modalHeaderLeft}>
              <Edit size={24} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('gradeSubmission')}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsGradingModalVisible(false)}
            >
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          {selectedSubmission && (
            <ScrollView style={styles.modalContent}>
              <View style={[styles.gradingForm, { backgroundColor: colors.surface }]}>
                <View style={styles.gradingStudentInfo}>
                  <Text style={[styles.studentInfoTitle, { color: colors.text }]}>{t('studentCol')}: {selectedSubmission.studentName}</Text>
                  <Text style={[styles.examInfoTitle, { color: colors.textSecondary }]}>{t('examCol')}: {selectedSubmission.examName}</Text>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>{t('gradeCol')} *</Text>
                  <TextInput
                    style={[styles.gradeInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    placeholder={t('enterGradeSubmission')}
                    placeholderTextColor={colors.textSecondary}
                    value={gradingData.grade}
                    onChangeText={(text) => setGradingData(prev => ({ ...prev, grade: text }))}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>{t('feedback')}</Text>
                  <TextInput
                    style={[styles.feedbackInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    placeholder={t('enterFeedback')}
                    placeholderTextColor={colors.textSecondary}
                    value={gradingData.feedback}
                    onChangeText={(text) => setGradingData(prev => ({ ...prev, feedback: text }))}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                </View>
                
                <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSaveGrade}>
                  <Save size={20} color={colors.primaryText} />
                  <Text style={[styles.saveButtonText, { color: colors.primaryText }]}>{t('saveGrade')}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Platform.OS === 'android' ? 16 : 24,
    paddingVertical: Platform.OS === 'android' ? 16 : 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: Platform.OS === 'android' ? 16 : 18,
    fontWeight: 'bold',
    marginBottom: 4,
    flexShrink: 1,
  },
  subtitle: {
    fontSize: Platform.OS === 'android' ? 12 : 14,
    flexShrink: 1,
  },
  adminInfo: {
    alignItems: 'flex-end',
    flexShrink: 0,
    maxWidth: Platform.OS === 'android' ? '45%' : '40%',
  },
  adminRole: {
    fontSize: Platform.OS === 'android' ? 11 : 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  adminEmail: {
    fontSize: Platform.OS === 'android' ? 9 : 10,
    flexShrink: 1,
  },
  navTabs: {
    flexDirection: 'row',
    paddingHorizontal: Platform.OS === 'android' ? 16 : 24,
    borderBottomWidth: 1,
  },
  navTab: {
    paddingVertical: Platform.OS === 'android' ? 12 : 16,
    paddingHorizontal: Platform.OS === 'android' ? 12 : 16,
    marginRight: Platform.OS === 'android' ? 16 : 24,
  },
  activeNavTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
  },
  navTabText: {
    fontSize: Platform.OS === 'android' ? 11 : 12,
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 1,
  },
  activeNavTabText: {
    fontWeight: '600',
  },
  filtersSection: {
    paddingHorizontal: Platform.OS === 'android' ? 16 : 24,
    paddingVertical: Platform.OS === 'android' ? 12 : 16,
    borderBottomWidth: 1,
    zIndex: 99999,
    elevation: 99,
  },
  filtersTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: Platform.OS === 'android' ? 'column' : 'row',
    gap: Platform.OS === 'android' ? 12 : 16,
    flexWrap: 'wrap',
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: Platform.OS === 'android' ? 0 : 1,
    minWidth: Platform.OS === 'android' ? '100%' : 150,
  },
  filterLabel: {
    fontSize: 12,
    marginRight: 6,
    flexShrink: 0,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 100000,
    flex: 1,
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: Platform.OS === 'android' ? 10 : 12,
    paddingVertical: Platform.OS === 'android' ? 6 : 8,
    minWidth: Platform.OS === 'android' ? 140 : 120,
    maxWidth: Platform.OS === 'android' ? 200 : 180,
  },
  filterValue: {
    fontSize: 12,
    flex: 1,
    flexShrink: 1,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 6,
    marginTop: 2,
    maxHeight: 200,
    zIndex: 100001,
    elevation: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 150,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  dropdownItemText: {
    fontSize: 12,
  },
  section: {
    paddingHorizontal: Platform.OS === 'android' ? 16 : 24,
    paddingVertical: Platform.OS === 'android' ? 16 : 20,
    paddingBottom: Platform.OS === 'android' ? 32 : 40,
    zIndex: 1,
  },
  sectionHeader: {
    flexDirection: Platform.OS === 'android' ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: Platform.OS === 'android' ? 'stretch' : 'center',
    marginBottom: Platform.OS === 'android' ? 16 : 20,
    gap: Platform.OS === 'android' ? 12 : 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Platform.OS === 'android' ? 8 : 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: Platform.OS === 'android' ? 10 : 12,
    paddingVertical: Platform.OS === 'android' ? 6 : 8,
    gap: 8,
    flex: Platform.OS === 'android' ? 1 : 0,
  },
  searchInput: {
    fontSize: Platform.OS === 'android' ? 11 : 12,
    minWidth: Platform.OS === 'android' ? 120 : 150,
    flex: 1,
  },
  tableContainer: {
    marginTop: 8,
  },
  table: {
    minWidth: Platform.OS === 'android' ? 650 : 700,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: Platform.OS === 'android' ? 10 : 12,
    paddingHorizontal: Platform.OS === 'android' ? 12 : 16,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1,
  },
  tableHeaderText: {
    fontSize: Platform.OS === 'android' ? 9 : 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: Platform.OS === 'android' ? 12 : 16,
    paddingHorizontal: Platform.OS === 'android' ? 12 : 16,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    minHeight: Platform.OS === 'android' ? 70 : 80,
  },
  tableCell: {
    justifyContent: 'center',
    paddingHorizontal: Platform.OS === 'android' ? 2 : 4,
  },
  studentColumn: {
    width: Platform.OS === 'android' ? 110 : 120,
  },
  examColumn: {
    width: Platform.OS === 'android' ? 140 : 150,
  },
  fileColumn: {
    width: Platform.OS === 'android' ? 120 : 130,
  },
  dateColumn: {
    width: Platform.OS === 'android' ? 75 : 80,
  },
  statusColumn: {
    width: Platform.OS === 'android' ? 75 : 80,
  },
  gradeColumn: {
    width: Platform.OS === 'android' ? 55 : 60,
  },
  actionsColumn: {
    width: Platform.OS === 'android' ? 120 : 110,
  },
  studentInfo: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
  },
  studentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentInitial: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  studentName: {
    fontSize: Platform.OS === 'android' ? 9 : 10,
    fontWeight: '500',
    lineHeight: Platform.OS === 'android' ? 12 : 14,
  },
  examName: {
    fontSize: Platform.OS === 'android' ? 9 : 10,
    lineHeight: Platform.OS === 'android' ? 12 : 14,
  },
  fileInfo: {
    gap: 2,
  },
  fileName: {
    fontSize: Platform.OS === 'android' ? 9 : 10,
    lineHeight: Platform.OS === 'android' ? 12 : 14,
  },
  fileSize: {
    fontSize: Platform.OS === 'android' ? 9 : 10,
  },
  submittedDate: {
    fontSize: Platform.OS === 'android' ? 9 : 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: Platform.OS === 'android' ? 9 : 10,
    fontWeight: '500',
  },
  gradeText: {
    fontSize: Platform.OS === 'android' ? 11 : 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Platform.OS === 'android' ? 2 : 4,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  actionIcon: {
    padding: Platform.OS === 'android' ? 3 : 4,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  submissionDetails: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
  },
  gradeValue: {
    fontWeight: '600',
  },
  feedbackSection: {
    paddingVertical: 12,
  },
  feedbackText: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  filePreview: {
    borderRadius: 12,
    padding: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  previewText: {
    fontSize: 16,
    marginTop: 12,
  },
  previewSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  gradingForm: {
    borderRadius: 12,
    padding: 20,
  },
  gradingStudentInfo: {
    marginBottom: 20,
  },
  studentInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  examInfoTitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  gradeInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 120,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 14,
    gap: 8,
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    borderRadius: 8,
    marginTop: 8,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    borderRadius: 8,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});