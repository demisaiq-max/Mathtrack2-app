-- Comprehensive fix for infinite recursion in RLS policies
-- This script completely removes problematic policies and creates simple, non-recursive ones

-- Step 1: Disable RLS on all tables to avoid issues during policy changes
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_exam_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_definitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics_daily DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies to start fresh
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all policies on all tables
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_exam_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics_daily ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, non-recursive policies

-- PROFILES: Simple policies without recursion
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- SUBJECTS: Allow all authenticated users to read, admins to manage
CREATE POLICY "subjects_select_all" ON public.subjects
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "subjects_insert_admin" ON public.subjects
  FOR INSERT WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "subjects_update_admin" ON public.subjects
  FOR UPDATE USING (auth.uid() = admin_id)
  WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "subjects_delete_admin" ON public.subjects
  FOR DELETE USING (auth.uid() = admin_id);

-- EXAMS: Allow all authenticated users to read, admins to manage their own
CREATE POLICY "exams_select_all" ON public.exams
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "exams_insert_admin" ON public.exams
  FOR INSERT WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "exams_update_admin" ON public.exams
  FOR UPDATE USING (auth.uid() = admin_id)
  WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "exams_delete_admin" ON public.exams
  FOR DELETE USING (auth.uid() = admin_id);

-- EXAM QUESTIONS: Allow all authenticated users to read, admins to manage via exam ownership
CREATE POLICY "exam_questions_select_all" ON public.exam_questions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "exam_questions_insert_via_exam" ON public.exam_questions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_questions.exam_id AND e.admin_id = auth.uid())
  );

CREATE POLICY "exam_questions_update_via_exam" ON public.exam_questions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_questions.exam_id AND e.admin_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_questions.exam_id AND e.admin_id = auth.uid())
  );

CREATE POLICY "exam_questions_delete_via_exam" ON public.exam_questions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_questions.exam_id AND e.admin_id = auth.uid())
  );

-- EXAM SUBMISSIONS: Students manage their own, admins read their exam submissions
CREATE POLICY "exam_submissions_select_own_or_admin" ON public.exam_submissions
  FOR SELECT USING (
    student_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_submissions.exam_id AND e.admin_id = auth.uid())
  );

CREATE POLICY "exam_submissions_insert_student" ON public.exam_submissions
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "exam_submissions_update_student" ON public.exam_submissions
  FOR UPDATE USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- SUBMISSION ANSWERS: Students manage their own, admins read via exam ownership
CREATE POLICY "submission_answers_select_own_or_admin" ON public.submission_answers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.exam_submissions s WHERE s.id = submission_answers.submission_id AND s.student_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.exam_submissions s
      JOIN public.exams e ON e.id = s.exam_id
      WHERE s.id = submission_answers.submission_id AND e.admin_id = auth.uid()
    )
  );

CREATE POLICY "submission_answers_insert_student" ON public.submission_answers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.exam_submissions s WHERE s.id = submission_answers.submission_id AND s.student_id = auth.uid())
  );

CREATE POLICY "submission_answers_update_student" ON public.submission_answers
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.exam_submissions s WHERE s.id = submission_answers.submission_id AND s.student_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.exam_submissions s WHERE s.id = submission_answers.submission_id AND s.student_id = auth.uid())
  );

-- STUDENT EXAM STATS: Students read their own, admins read all
CREATE POLICY "student_exam_stats_select_own" ON public.student_exam_stats
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "student_exam_stats_insert_student" ON public.student_exam_stats
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "student_exam_stats_update_student" ON public.student_exam_stats
  FOR UPDATE USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- ANNOUNCEMENTS: All can read, admins manage their own
CREATE POLICY "announcements_select_all" ON public.announcements
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "announcements_insert_admin" ON public.announcements
  FOR INSERT WITH CHECK (admin_id = auth.uid());

CREATE POLICY "announcements_update_admin" ON public.announcements
  FOR UPDATE USING (admin_id = auth.uid())
  WITH CHECK (admin_id = auth.uid());

CREATE POLICY "announcements_delete_admin" ON public.announcements
  FOR DELETE USING (admin_id = auth.uid());

-- ANNOUNCEMENT LIKES: All can read and manage their own
CREATE POLICY "announcement_likes_select_all" ON public.announcement_likes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "announcement_likes_insert_own" ON public.announcement_likes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "announcement_likes_delete_own" ON public.announcement_likes
  FOR DELETE USING (user_id = auth.uid());

-- ANNOUNCEMENT COMMENTS: All can read and manage their own
CREATE POLICY "announcement_comments_select_all" ON public.announcement_comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "announcement_comments_insert_own" ON public.announcement_comments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "announcement_comments_update_own" ON public.announcement_comments
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "announcement_comments_delete_own" ON public.announcement_comments
  FOR DELETE USING (user_id = auth.uid());

-- QUESTIONS: All can read, users manage their own
CREATE POLICY "questions_select_all" ON public.questions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "questions_insert_own" ON public.questions
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "questions_update_own" ON public.questions
  FOR UPDATE USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "questions_delete_own" ON public.questions
  FOR DELETE USING (author_id = auth.uid());

-- QUESTION LIKES: All can read and manage their own
CREATE POLICY "question_likes_select_all" ON public.question_likes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "question_likes_insert_own" ON public.question_likes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "question_likes_delete_own" ON public.question_likes
  FOR DELETE USING (user_id = auth.uid());

-- QUESTION COMMENTS: All can read and manage their own
CREATE POLICY "question_comments_select_all" ON public.question_comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "question_comments_insert_own" ON public.question_comments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "question_comments_update_own" ON public.question_comments
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "question_comments_delete_own" ON public.question_comments
  FOR DELETE USING (user_id = auth.uid());

-- SCHEDULES: All can read, admins manage their own
CREATE POLICY "schedules_select_all" ON public.schedules
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "schedules_insert_admin" ON public.schedules
  FOR INSERT WITH CHECK (admin_id = auth.uid());

CREATE POLICY "schedules_update_admin" ON public.schedules
  FOR UPDATE USING (admin_id = auth.uid())
  WITH CHECK (admin_id = auth.uid());

CREATE POLICY "schedules_delete_admin" ON public.schedules
  FOR DELETE USING (admin_id = auth.uid());

-- ACHIEVEMENT DEFINITIONS: All can read, no restrictions on insert/update for now
CREATE POLICY "achievement_definitions_select_all" ON public.achievement_definitions
  FOR SELECT USING (true);

CREATE POLICY "achievement_definitions_insert_all" ON public.achievement_definitions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "achievement_definitions_update_all" ON public.achievement_definitions
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- STUDENT ACHIEVEMENTS: Students manage their own
CREATE POLICY "student_achievements_select_own" ON public.student_achievements
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "student_achievements_insert_own" ON public.student_achievements
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "student_achievements_update_own" ON public.student_achievements
  FOR UPDATE USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- METRICS DAILY: All can read
CREATE POLICY "metrics_daily_select_all" ON public.metrics_daily
  FOR SELECT USING (true);

CREATE POLICY "metrics_daily_insert_all" ON public.metrics_daily
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "metrics_daily_update_all" ON public.metrics_daily
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);