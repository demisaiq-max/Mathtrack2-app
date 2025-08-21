export type Language = 'en' | 'ko';

export interface Translations {
  // Common
  loading: string;
  error: string;
  success: string;
  cancel: string;
  confirm: string;
  save: string;
  delete: string;
  edit: string;
  back: string;
  next: string;
  submit: string;
  retry: string;
  
  // Navigation
  home: string;
  board: string;
  scores: string;
  profile: string;
  settings: string;
  
  // Auth
  login: string;
  signup: string;
  logout: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  gradeAuth: string;
  forgotPassword: string;
  createAccount: string;
  alreadyHaveAccount: string;
  dontHaveAccount: string;
  
  // Settings
  preferences: string;
  pushNotifications: string;
  pushNotificationsDesc: string;
  darkMode: string;
  darkModeDesc: string;
  language: string;
  privacySecurity: string;
  privacySettings: string;
  privacySettingsDesc: string;
  support: string;
  helpSupport: string;
  helpSupportDesc: string;
  termsOfService: string;
  privacyPolicy: string;
  account: string;
  deleteAccount: string;
  deleteAccountDesc: string;
  
  // Board
  askQuestionBoard: string;
  questionTitleBoard: string;
  questionBody: string;
  postQuestionBoard: string;
  recentQuestions: string;
  noQuestions: string;
  
  // Profile
  editProfile: string;
  achievements: string;
  viewAchievements: string;
  
  // Exam
  upcomingExams: string;
  recentScores: string;
  takeExam: string;
  examResults: string;
  
  // Admin
  dashboard: string;
  students: string;
  exams: string;
  submissions: string;
  createExam: string;
  scheduleExam: string;
  examManagement: string;
  administrator: string;
  duration: string;
  questions: string;
  gradeAndSubject: string;
  
  // Admin Dashboard
  mathTrackAdmin: string;
  administrationDashboard: string;
  adminRole: string;
  filters: string;
  allGrades: string;
  allSubjects: string;
  totalStudents: string;
  activeExams: string;
  avgScore: string;
  pendingReviews: string;
  quickActions: string;
  importData: string;
  exportReports: string;
  reviewSubmissions: string;
  recentSubmissions: string;
  todaysSchedule: string;
  manageSchedule: string;
  performanceOverview: string;
  thisWeek: string;
  thisMonth: string;
  activeStudents: string;
  examCompletionRate: string;
  currentlyEnrolled: string;
  
  // Admin Submissions
  answerSheetSubmissions: string;
  filter: string;
  search: string;
  studentCol: string;
  examCol: string;
  file: string;
  submitted: string;
  status: string;
  gradeCol: string;
  actions: string;
  viewSubmission: string;
  gradeSubmission: string;
  filePreview: string;
  pdfPreviewNotAvailable: string;
  clickDownloadToView: string;
  feedback: string;
  saveGrade: string;
  enterGradeSubmission: string;
  enterFeedback: string;
  gradeSaved: string;
  
  // Status
  graded: string;
  reviewed: string;
  
  // Subjects
  mathematics: string;
  science: string;
  englishSubject: string;
  history: string;
  geography: string;
  physics: string;
  chemistry: string;
  biology: string;
  
  // Messages
  loginSuccess: string;
  loginError: string;
  signupSuccess: string;
  signupError: string;
  questionPosted: string;
  questionError: string;
  mustBeLoggedIn: string;
  profileUpdated: string;
  profileError: string;
  
  // Alerts
  deleteAccountTitle: string;
  deleteAccountMessage: string;
  accountDeleted: string;
  accountDeletedMessage: string;
  deleteAccountConfirm: string;
  deleteAccountFinalWarning: string;
  deleteAccountSuccess: string;
  deleteAccountError: string;
  
  // Support & Privacy
  privacyPolicyContent: string;
  termsOfServiceContent: string;
  helpSupportContent: string;
  contactSupport: string;
  reportIssue: string;
  faq: string;
  
  // Language Selection
  selectLanguage: string;
  englishLang: string;
  korean: string;
  
  // Home Screen
  welcomeBack: string;
  readyToCheck: string;
  latest: string;
  average: string;
  lastExamScore: string;
  overallAverage: string;
  performanceTrend: string;
  improvingPerformance: string;
  recentExams: string;
  viewAll: string;
  gradeDisplay: string;
  nextExam: string;
  checkSchedule: string;
  remindMe: string;
  boardUpdates: string;
  viewBoard: string;
  
  // Scores Screen
  scoreManager: string;
  trackPerformance: string;
  highestScore: string;
  lowestScore: string;
  totalExams: string;
  completedExams: string;
  pending: string;
  
  // Profile Screen
  studentRole: string;
  administratorRole: string;
  accountInformation: string;
  gradeLevel: string;
  memberSince: string;
  totalExamsCount: string;
  averageScore: string;
  bestSubject: string;
  logOut: string;
  notSpecified: string;
  
  // Admin Profile
  schedule: string;
  avgPerformance: string;
  accountSettings: string;
  updatePersonalInfo: string;
  notifications: string;
  manageNotificationPrefs: string;
  privacySecurityTitle: string;
  controlPrivacySettings: string;
  helpSupportTitle: string;
  getHelpContactSupport: string;
  scheduleManagement: string;
  addSchedule: string;
  editSchedule: string;
  deleteScheduleItem: string;
  deleteScheduleConfirm: string;
  scheduleItemDeleted: string;
  scheduleItemUpdated: string;
  scheduleItemAdded: string;
  fillRequiredFields: string;
  title: string;
  subject: string;
  grade: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  type: string;
  class: string;
  exam: string;
  meeting: string;
  other: string;
  updateSchedule: string;
  enterTitle: string;
  enterSubject: string;
  enterGrade: string;
  enterLocation: string;
  
  // Admin Students
  mathTrackAdminTitle: string;
  administrationDashboardTitle: string;
  administratorTitle: string;
  studentManagement: string;
  newAnnouncement: string;
  askQuestionAdmin: string;
  announcements: string;
  qaForum: string;
  studentAccounts: string;
  filterByGrade: string;
  allGradesFilter: string;
  grade5: string;
  grade6: string;
  grade7: string;
  grade8: string;
  grade9: string;
  grade10: string;
  high: string;
  normal: string;
  urgent: string;
  by: string;
  replies: string;
  answer: string;
  answered: string;
  newAnnouncementTitle: string;
  askQuestionTitle: string;
  priority: string;
  content: string;
  questionTitleAdmin: string;
  questionDetails: string;
  enterAnnouncementTitle: string;
  enterAnnouncementContent: string;
  enterQuestionTitle: string;
  describeQuestion: string;
  createAnnouncement: string;
  postQuestionAdmin: string;
  commentAdded: string;
  commentAddedMessage: string;
  answerAdded: string;
  answerAddedMessage: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    next: 'Next',
    submit: 'Submit',
    retry: 'Retry',
    
    // Navigation
    home: 'Home',
    board: 'Board',
    scores: 'Scores',
    profile: 'Profile',
    settings: 'Settings',
    
    // Auth
    login: 'Login',
    signup: 'Sign Up',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    firstName: 'First Name',
    lastName: 'Last Name',
    gradeAuth: 'Grade',
    forgotPassword: 'Forgot Password?',
    createAccount: 'Create Account',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    
    // Settings
    preferences: 'Preferences',
    pushNotifications: 'Push Notifications',
    pushNotificationsDesc: 'Receive notifications about exams and announcements',
    darkMode: 'Dark Mode',
    darkModeDesc: 'Use dark theme throughout the app',
    language: 'Language',
    privacySecurity: 'Privacy & Security',
    privacySettings: 'Privacy Settings',
    privacySettingsDesc: 'Manage your privacy preferences',
    support: 'Support',
    helpSupport: 'Help & Support',
    helpSupportDesc: 'Get help and contact support',
    termsOfService: 'Terms of Service',
    privacyPolicy: 'Privacy Policy',
    account: 'Account',
    deleteAccount: 'Delete Account',
    deleteAccountDesc: 'Permanently delete your account and data',
    
    // Board
    askQuestionBoard: 'Ask a Question',
    questionTitleBoard: 'Question Title',
    questionBody: 'Question Body',
    postQuestionBoard: 'Post Question',
    recentQuestions: 'Recent Questions',
    noQuestions: 'No questions yet',
    
    // Profile
    editProfile: 'Edit Profile',
    achievements: 'Achievements',
    viewAchievements: 'View Achievements',
    
    // Exam
    upcomingExams: 'Upcoming Exams',
    recentScores: 'Recent Scores',
    takeExam: 'Take Exam',
    examResults: 'Exam Results',
    
    // Admin
    dashboard: 'Dashboard',
    students: 'Students',
    exams: 'Exams',
    submissions: 'Submissions',
    createExam: 'Create Exam',
    scheduleExam: 'Schedule Exam',
    examManagement: 'Exam Management',
    administrator: 'Administrator',
    duration: 'Duration',
    questions: 'Questions',
    gradeAndSubject: 'Grade & Subject',
    
    // Admin Dashboard
    mathTrackAdmin: 'MathTrack Admin',
    administrationDashboard: 'Administration Dashboard',
    adminRole: 'Administrator',
    filters: 'Filters',
    allGrades: 'All Grades',
    allSubjects: 'All Subjects',
    totalStudents: 'Total Students',
    activeExams: 'Active Exams',
    avgScore: 'Avg Score',
    pendingReviews: 'Pending Reviews',
    quickActions: 'Quick Actions',
    importData: 'Import Data',
    exportReports: 'Export Reports',
    reviewSubmissions: 'Review Submissions',
    recentSubmissions: 'Recent Submissions',
    todaysSchedule: "Today's Schedule",
    manageSchedule: 'Manage Schedule',
    performanceOverview: 'Performance Overview',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    activeStudents: 'Active Students',
    examCompletionRate: 'Exam completion rate',
    currentlyEnrolled: 'Currently enrolled',
    
    // Admin Submissions
    answerSheetSubmissions: 'Answer Sheet Submissions',
    filter: 'Filter',
    search: 'Search',
    studentCol: 'Student',
    examCol: 'Exam',
    file: 'File',
    submitted: 'Submitted',
    status: 'Status',
    gradeCol: 'Grade',
    actions: 'Actions',
    viewSubmission: 'View Submission',
    gradeSubmission: 'Grade Submission',
    filePreview: 'File Preview',
    pdfPreviewNotAvailable: 'PDF preview not available',
    clickDownloadToView: 'Click download to view the file',
    feedback: 'Feedback',
    saveGrade: 'Save Grade',
    enterGradeSubmission: 'Enter grade (e.g., 85%, A+, 8.5/10)',
    enterFeedback: 'Enter feedback for the student...',
    gradeSaved: 'Grade saved successfully!',
    
    // Status
    graded: 'Graded',
    reviewed: 'Reviewed',
    
    // Subjects
    mathematics: 'Mathematics',
    science: 'Science',
    englishSubject: 'English',
    history: 'History',
    geography: 'Geography',
    physics: 'Physics',
    chemistry: 'Chemistry',
    biology: 'Biology',
    
    // Messages
    loginSuccess: 'Login successful',
    loginError: 'Login failed',
    signupSuccess: 'Account created successfully',
    signupError: 'Failed to create account',
    questionPosted: 'Question posted successfully',
    questionError: 'Failed to post question',
    mustBeLoggedIn: 'You must be logged in',
    profileUpdated: 'Profile updated successfully',
    profileError: 'Failed to update profile',
    
    // Alerts
    deleteAccountTitle: 'Delete Account',
    deleteAccountMessage: 'Are you sure you want to delete your account? This action cannot be undone.',
    accountDeleted: 'Account Deleted',
    accountDeletedMessage: 'Your account has been deleted successfully.',
    deleteAccountConfirm: 'Type DELETE to confirm',
    deleteAccountFinalWarning: 'This will permanently delete your account and all associated data. This action cannot be undone.',
    deleteAccountSuccess: 'Account deleted successfully',
    deleteAccountError: 'Failed to delete account',
    
    // Support & Privacy
    privacyPolicyContent: 'We are committed to protecting your privacy. This policy explains how we collect, use, and protect your personal information.',
    termsOfServiceContent: 'By using this app, you agree to our terms of service. Please read these terms carefully.',
    helpSupportContent: 'Need help? Contact our support team or browse our frequently asked questions.',
    contactSupport: 'Contact Support',
    reportIssue: 'Report an Issue',
    faq: 'Frequently Asked Questions',
    
    // Language Selection
    selectLanguage: 'Select Language',
    englishLang: 'English',
    korean: '한국어',
    
    // Home Screen
    welcomeBack: 'Welcome back',
    readyToCheck: 'Ready to check your latest scores?',
    latest: 'Latest',
    average: 'Average',
    lastExamScore: 'Last Exam Score',
    overallAverage: 'Overall Average',
    performanceTrend: 'Performance Trend',
    improvingPerformance: 'Improving Performance',
    recentExams: 'Recent Exams',
    viewAll: 'View All',
    gradeDisplay: 'Grade',
    nextExam: 'Next Exam',
    checkSchedule: 'Check schedule for details',
    remindMe: 'Remind Me',
    boardUpdates: 'Board Updates',
    viewBoard: 'View Board',
    
    // Scores Screen
    scoreManager: 'Score Manager',
    trackPerformance: 'Track your academic performance',
    highestScore: 'Highest Score',
    lowestScore: 'Lowest Score',
    totalExams: 'Total Exams',
    completedExams: 'Completed Exams',
    pending: 'Pending',
    
    // Profile Screen
    studentRole: 'Student',
    administratorRole: 'Administrator',
    accountInformation: 'Account Information',
    gradeLevel: 'Grade Level',
    memberSince: 'Member Since',
    totalExamsCount: 'Total Exams',
    averageScore: 'Average Score',
    bestSubject: 'Best Subject',
    logOut: 'Log Out',
    notSpecified: 'Not specified',
    
    // Admin Profile
    schedule: 'Schedule',
    avgPerformance: 'Avg Performance',
    accountSettings: 'Account Settings',
    updatePersonalInfo: 'Update your personal information',
    notifications: 'Notifications',
    manageNotificationPrefs: 'Manage notification preferences',
    privacySecurityTitle: 'Privacy & Security',
    controlPrivacySettings: 'Control your privacy settings',
    helpSupportTitle: 'Help & Support',
    getHelpContactSupport: 'Get help and contact support',
    scheduleManagement: 'Schedule Management',
    addSchedule: 'Add Schedule',
    editSchedule: 'Edit Schedule',
    deleteScheduleItem: 'Delete Schedule Item',
    deleteScheduleConfirm: 'Are you sure you want to delete this schedule item?',
    scheduleItemDeleted: 'Schedule item deleted successfully!',
    scheduleItemUpdated: 'Schedule item updated successfully!',
    scheduleItemAdded: 'Schedule item added successfully!',
    fillRequiredFields: 'Please fill in all required fields',
    title: 'Title',
    subject: 'Subject',
    grade: 'Grade',
    date: 'Date',
    startTime: 'Start Time',
    endTime: 'End Time',
    location: 'Location',
    type: 'Type',
    class: 'Class',
    exam: 'Exam',
    meeting: 'Meeting',
    other: 'Other',
    updateSchedule: 'Update Schedule',
    enterTitle: 'Enter title',
    enterSubject: 'Enter subject',
    enterGrade: 'Enter grade',
    enterLocation: 'Enter location',
    
    // Admin Students
    mathTrackAdminTitle: 'MathTrack Admin',
    administrationDashboardTitle: 'Administration Dashboard',
    administratorTitle: 'Administrator',
    studentManagement: 'Student Management',
    newAnnouncement: 'New Announcement',
    askQuestionAdmin: 'Ask Question',
    announcements: 'Announcements',
    qaForum: 'Q&A Forum',
    studentAccounts: 'Student Accounts',
    filterByGrade: 'Filter by Grade:',
    allGradesFilter: 'All Grades',
    grade5: 'Grade 5',
    grade6: 'Grade 6',
    grade7: 'Grade 7',
    grade8: 'Grade 8',
    grade9: 'Grade 9',
    grade10: 'Grade 10',
    high: 'High',
    normal: 'Normal',
    urgent: 'Urgent',
    by: 'By',
    replies: 'replies',
    answer: 'Answer',
    answered: 'Answered',
    newAnnouncementTitle: 'New Announcement',
    askQuestionTitle: 'Ask Question',
    priority: 'Priority',
    content: 'Content',
    questionTitleAdmin: 'Question Title',
    questionDetails: 'Question Details',
    enterAnnouncementTitle: 'Enter announcement title',
    enterAnnouncementContent: 'Enter announcement content',
    enterQuestionTitle: 'Enter your question title',
    describeQuestion: 'Describe your question in detail',
    createAnnouncement: 'Create Announcement',
    postQuestionAdmin: 'Post Question',
    commentAdded: 'Comment Added',
    commentAddedMessage: 'Your comment has been added successfully!',
    answerAdded: 'Answer Added',
    answerAddedMessage: 'Your answer has been posted successfully!',
  },
  ko: {
    // Common
    loading: '로딩 중...',
    error: '오류',
    success: '성공',
    cancel: '취소',
    confirm: '확인',
    save: '저장',
    delete: '삭제',
    edit: '편집',
    back: '뒤로',
    next: '다음',
    submit: '제출',
    retry: '다시 시도',
    
    // Navigation
    home: '홈',
    board: '게시판',
    scores: '점수',
    profile: '프로필',
    settings: '설정',
    
    // Auth
    login: '로그인',
    signup: '회원가입',
    logout: '로그아웃',
    email: '이메일',
    password: '비밀번호',
    confirmPassword: '비밀번호 확인',
    firstName: '이름',
    lastName: '성',
    gradeAuth: '학년',
    forgotPassword: '비밀번호를 잊으셨나요?',
    createAccount: '계정 만들기',
    alreadyHaveAccount: '이미 계정이 있으신가요?',
    dontHaveAccount: '계정이 없으신가요?',
    
    // Settings
    preferences: '환경설정',
    pushNotifications: '푸시 알림',
    pushNotificationsDesc: '시험 및 공지사항에 대한 알림 받기',
    darkMode: '다크 모드',
    darkModeDesc: '앱 전체에 어두운 테마 사용',
    language: '언어',
    privacySecurity: '개인정보 및 보안',
    privacySettings: '개인정보 설정',
    privacySettingsDesc: '개인정보 기본 설정 관리',
    support: '지원',
    helpSupport: '도움말 및 지원',
    helpSupportDesc: '도움말 보기 및 지원팀 연락',
    termsOfService: '서비스 약관',
    privacyPolicy: '개인정보 처리방침',
    account: '계정',
    deleteAccount: '계정 삭제',
    deleteAccountDesc: '계정과 데이터를 영구적으로 삭제',
    
    // Board
    askQuestionBoard: '질문하기',
    questionTitleBoard: '질문 제목',
    questionBody: '질문 내용',
    postQuestionBoard: '질문 게시',
    recentQuestions: '최근 질문',
    noQuestions: '아직 질문이 없습니다',
    
    // Profile
    editProfile: '프로필 편집',
    achievements: '성취',
    viewAchievements: '성취 보기',
    
    // Exam
    upcomingExams: '예정된 시험',
    recentScores: '최근 점수',
    takeExam: '시험 응시',
    examResults: '시험 결과',
    
    // Admin
    dashboard: '대시보드',
    students: '학생',
    exams: '시험',
    submissions: '제출물',
    createExam: '시험 만들기',
    scheduleExam: '시험 일정',
    examManagement: '시험 관리',
    administrator: '관리자',
    duration: '기간',
    questions: '문제',
    gradeAndSubject: '학년 및 과목',
    
    // Admin Dashboard
    mathTrackAdmin: 'MathTrack 관리자',
    administrationDashboard: '관리 대시보드',
    adminRole: '관리자',
    filters: '필터',
    allGrades: '모든 학년',
    allSubjects: '모든 과목',
    totalStudents: '총 학생 수',
    activeExams: '활성 시험',
    avgScore: '평균 점수',
    pendingReviews: '검토 대기',
    quickActions: '빠른 작업',
    importData: '데이터 가져오기',
    exportReports: '보고서 내보내기',
    reviewSubmissions: '제출물 검토',
    recentSubmissions: '최근 제출물',
    todaysSchedule: '오늘의 일정',
    manageSchedule: '일정 관리',
    performanceOverview: '성과 개요',
    thisWeek: '이번 주',
    thisMonth: '이번 달',
    activeStudents: '활성 학생',
    examCompletionRate: '시험 완료율',
    currentlyEnrolled: '현재 등록됨',
    
    // Admin Submissions
    answerSheetSubmissions: '답안지 제출물',
    filter: '필터',
    search: '검색',
    studentCol: '학생',
    examCol: '시험',
    file: '파일',
    submitted: '제출됨',
    status: '상태',
    gradeCol: '학점',
    actions: '작업',
    viewSubmission: '제출물 보기',
    gradeSubmission: '제출물 채점',
    filePreview: '파일 미리보기',
    pdfPreviewNotAvailable: 'PDF 미리보기를 사용할 수 없습니다',
    clickDownloadToView: '파일을 보려면 다운로드를 클릭하세요',
    feedback: '피드백',
    saveGrade: '점수 저장',
    enterGradeSubmission: '점수 입력 (예: 85%, A+, 8.5/10)',
    enterFeedback: '학생을 위한 피드백을 입력하세요...',
    gradeSaved: '점수가 성공적으로 저장되었습니다!',
    
    // Status
    graded: '채점됨',
    reviewed: '검토됨',
    
    // Subjects
    mathematics: '수학',
    science: '과학',
    englishSubject: '영어',
    history: '역사',
    geography: '지리',
    physics: '물리',
    chemistry: '화학',
    biology: '생물',
    
    // Messages
    loginSuccess: '로그인 성공',
    loginError: '로그인 실패',
    signupSuccess: '계정이 성공적으로 생성되었습니다',
    signupError: '계정 생성에 실패했습니다',
    questionPosted: '질문이 성공적으로 게시되었습니다',
    questionError: '질문 게시에 실패했습니다',
    mustBeLoggedIn: '로그인이 필요합니다',
    profileUpdated: '프로필이 성공적으로 업데이트되었습니다',
    profileError: '프로필 업데이트에 실패했습니다',
    
    // Alerts
    deleteAccountTitle: '계정 삭제',
    deleteAccountMessage: '정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
    accountDeleted: '계정 삭제됨',
    accountDeletedMessage: '계정이 성공적으로 삭제되었습니다.',
    deleteAccountConfirm: '확인하려면 DELETE를 입력하세요',
    deleteAccountFinalWarning: '계정과 모든 관련 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.',
    deleteAccountSuccess: '계정이 성공적으로 삭제되었습니다',
    deleteAccountError: '계정 삭제에 실패했습니다',
    
    // Support & Privacy
    privacyPolicyContent: '우리는 귀하의 개인정보 보호에 최선을 다하고 있습니다. 이 정책은 개인정보를 수집, 사용 및 보호하는 방법을 설명합니다.',
    termsOfServiceContent: '이 앱을 사용함으로써 서비스 약관에 동의하게 됩니다. 이 약관을 주의 깊게 읽어주세요.',
    helpSupportContent: '도움이 필요하신가요? 지원팀에 문의하거나 자주 묻는 질문을 확인해보세요.',
    contactSupport: '지원팀 연락',
    reportIssue: '문제 신고',
    faq: '자주 묻는 질문',
    
    // Language Selection
    selectLanguage: '언어 선택',
    englishLang: 'English',
    korean: '한국어',
    
    // Home Screen
    welcomeBack: '다시 오신 것을 환영합니다',
    readyToCheck: '최신 점수를 확인할 준비가 되셨나요?',
    latest: '최신',
    average: '평균',
    lastExamScore: '마지막 시험 점수',
    overallAverage: '전체 평균',
    performanceTrend: '성과 추이',
    improvingPerformance: '성과 향상',
    recentExams: '최근 시험',
    viewAll: '모두 보기',
    gradeDisplay: '학점',
    nextExam: '다음 시험',
    checkSchedule: '자세한 일정은 확인하세요',
    remindMe: '알림 설정',
    boardUpdates: '게시판 업데이트',
    viewBoard: '게시판 보기',
    
    // Scores Screen
    scoreManager: '점수 관리자',
    trackPerformance: '학업 성과를 추적하세요',
    highestScore: '최고 점수',
    lowestScore: '최저 점수',
    totalExams: '총 시험 수',
    completedExams: '완료된 시험',
    pending: '대기 중',
    
    // Profile Screen
    studentRole: '학생',
    administratorRole: '관리자',
    accountInformation: '계정 정보',
    gradeLevel: '학년',
    memberSince: '가입일',
    totalExamsCount: '총 시험 수',
    averageScore: '평균 점수',
    bestSubject: '최고 과목',
    logOut: '로그아웃',
    notSpecified: '지정되지 않음',
    
    // Admin Profile
    schedule: '일정',
    avgPerformance: '평균 성과',
    accountSettings: '계정 설정',
    updatePersonalInfo: '개인 정보 업데이트',
    notifications: '알림',
    manageNotificationPrefs: '알림 기본 설정 관리',
    privacySecurityTitle: '개인정보 및 보안',
    controlPrivacySettings: '개인정보 설정 제어',
    helpSupportTitle: '도움말 및 지원',
    getHelpContactSupport: '도움말 보기 및 지원팀 연락',
    scheduleManagement: '일정 관리',
    addSchedule: '일정 추가',
    editSchedule: '일정 편집',
    deleteScheduleItem: '일정 항목 삭제',
    deleteScheduleConfirm: '이 일정 항목을 삭제하시겠습니까?',
    scheduleItemDeleted: '일정 항목이 성공적으로 삭제되었습니다!',
    scheduleItemUpdated: '일정 항목이 성공적으로 업데이트되었습니다!',
    scheduleItemAdded: '일정 항목이 성공적으로 추가되었습니다!',
    fillRequiredFields: '모든 필수 필드를 입력해주세요',
    title: '제목',
    subject: '과목',
    grade: '학년',
    date: '날짜',
    startTime: '시작 시간',
    endTime: '종료 시간',
    location: '위치',
    type: '유형',
    class: '수업',
    exam: '시험',
    meeting: '회의',
    other: '기타',
    updateSchedule: '일정 업데이트',
    enterTitle: '제목 입력',
    enterSubject: '과목 입력',
    enterGrade: '학년 입력',
    enterLocation: '위치 입력',
    
    // Admin Students
    mathTrackAdminTitle: 'MathTrack 관리자',
    administrationDashboardTitle: '관리 대시보드',
    administratorTitle: '관리자',
    studentManagement: '학생 관리',
    newAnnouncement: '새 공지사항',
    askQuestionAdmin: '질문하기',
    announcements: '공지사항',
    qaForum: 'Q&A 포럼',
    studentAccounts: '학생 계정',
    filterByGrade: '학년별 필터:',
    allGradesFilter: '모든 학년',
    grade5: '5학년',
    grade6: '6학년',
    grade7: '7학년',
    grade8: '8학년',
    grade9: '9학년',
    grade10: '10학년',
    high: '높음',
    normal: '보통',
    urgent: '긴급',
    by: '작성자',
    replies: '답변',
    answer: '답변',
    answered: '답변됨',
    newAnnouncementTitle: '새 공지사항',
    askQuestionTitle: '질문하기',
    priority: '우선순위',
    content: '내용',
    questionTitleAdmin: '질문 제목',
    questionDetails: '질문 세부사항',
    enterAnnouncementTitle: '공지사항 제목 입력',
    enterAnnouncementContent: '공지사항 내용 입력',
    enterQuestionTitle: '질문 제목 입력',
    describeQuestion: '질문을 자세히 설명해주세요',
    createAnnouncement: '공지사항 생성',
    postQuestionAdmin: '질문 게시',
    commentAdded: '댓글 추가됨',
    commentAddedMessage: '댓글이 성공적으로 추가되었습니다!',
    answerAdded: '답변 추가됨',
    answerAddedMessage: '답변이 성공적으로 게시되었습니다!',
  },
};