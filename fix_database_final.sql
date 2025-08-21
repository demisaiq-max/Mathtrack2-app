-- COMPREHENSIVE DATABASE FIX
-- This script fixes all RLS policies and database connection issues

-- First, drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "profiles_self_read_admin_read_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "subjects_admin_manage" ON public.subjects;
DROP POLICY IF EXISTS "subjects_admin_full_access" ON public.subjects;
DROP POLICY IF EXISTS "subjects_students_read_via_exams" ON public.subjects;
DROP POLICY IF EXISTS "subjects_student_read" ON public.subjects;
DROP POLICY IF EXISTS "exams_admin_manage_own" ON public.exams;
DROP POLICY IF EXISTS "exams_admin_full_access" ON public.exams;
DROP POLICY IF EXISTS "exams_students_read_grade" ON public.exams;
DROP POLICY IF EXISTS "exams_student_read" ON public.exams;
DROP POLICY IF EXISTS "questions_admin_manage_via_exam" ON public.exam_questions;
DROP POLICY IF EXISTS "exam_questions_admin_full_access" ON public.exam_questions;
DROP POLICY IF EXISTS "questions_students_read_grade" ON public.exam_questions;
DROP POLICY IF EXISTS "exam_questions_student_read" ON public.exam_questions;
DROP POLICY IF EXISTS "submissions_student_manage_own" ON public.exam_submissions;
DROP POLICY IF EXISTS "exam_submissions_student_own" ON public.exam_submissions;
DROP POLICY IF EXISTS "submissions_admin_read_own_exam" ON public.exam_submissions;
DROP POLICY IF EXISTS "exam_submissions_admin_read" ON public.exam_submissions;
DROP POLICY IF EXISTS "answers_student_manage_own" ON public.submission_answers;
DROP POLICY IF EXISTS "submission_answers_student_own" ON public.submission_answers;
DROP POLICY IF EXISTS "answers_admin_read_via_exam" ON public.submission_answers;
DROP POLICY IF EXISTS "submission_answers_admin_read" ON public.submission_answers;
DROP POLICY IF EXISTS "stats_student_read_own" ON public.student_exam_stats;
DROP POLICY IF EXISTS "student_exam_stats_own" ON public.student_exam_stats;
DROP POLICY IF EXISTS "stats_admin_read_all" ON public.student_exam_stats;
DROP POLICY IF EXISTS "student_exam_stats_admin_read" ON public.student_exam_stats;
DROP POLICY IF EXISTS "announcements_admin_manage" ON public.announcements;
DROP POLICY IF EXISTS "announcements_student_read" ON public.announcements;
DROP POLICY IF EXISTS "announcements_students_read_grade" ON public.announcements;
DROP POLICY IF EXISTS "announcement_interact_read_grade" ON public.announcement_likes;
DROP POLICY IF EXISTS "announcement_likes_read" ON public.announcement_likes;
DROP POLICY IF EXISTS "announcement_interact_insert_self" ON public.announcement_likes;
DROP POLICY IF EXISTS "announcement_likes_insert" ON public.announcement_likes;
DROP POLICY IF EXISTS "announcement_interact_read_grade_comments" ON public.announcement_comments;
DROP POLICY IF EXISTS "announcement_comments_read" ON public.announcement_comments;
DROP POLICY IF EXISTS "announcement_interact_insert_self_comments" ON public.announcement_comments;
DROP POLICY IF EXISTS "announcement_comments_insert" ON public.announcement_comments;
DROP POLICY IF EXISTS "forum_question_insert_own_grade" ON public.questions;
DROP POLICY IF EXISTS "questions_insert_own_grade" ON public.questions;
DROP POLICY IF EXISTS "forum_question_read_same_grade" ON public.questions;
DROP POLICY IF EXISTS "questions_read_same_grade" ON public.questions;
DROP POLICY IF EXISTS "forum_question_manage_own" ON public.questions;
DROP POLICY IF EXISTS "questions_update_own" ON public.questions;
DROP POLICY IF EXISTS "forum_question_delete_own" ON public.questions;
DROP POLICY IF EXISTS "questions_delete_own" ON public.questions;
DROP POLICY IF EXISTS "forum_question_admin_manage" ON public.questions;
DROP POLICY IF EXISTS "questions_admin_manage" ON public.questions;
DROP POLICY IF EXISTS "forum_interact_read_grade" ON public.question_likes;
DROP POLICY IF EXISTS "question_likes_read" ON public.question_likes;
DROP POLICY IF EXISTS "forum_interact_insert_self" ON public.question_likes;
DROP POLICY IF EXISTS "question_likes_insert" ON public.question_likes;
DROP POLICY IF EXISTS "forum_interact_delete_self" ON public.question_likes;
DROP POLICY IF EXISTS "question_likes_delete" ON public.question_likes;
DROP POLICY IF EXISTS "forum_interact_read_grade_comments" ON public.question_comments;
DROP POLICY IF EXISTS "question_comments_read" ON public.question_comments;
DROP POLICY IF EXISTS "forum_interact_insert_self_comments" ON public.question_comments;
DROP POLICY IF EXISTS "question_comments_insert" ON public.question_comments;
DROP POLICY IF EXISTS "schedules_admin_manage_own" ON public.schedules;
DROP POLICY IF EXISTS "schedules_admin_manage" ON public.schedules;
DROP POLICY IF EXISTS "schedules_students_read_grade" ON public.schedules;
DROP POLICY IF EXISTS "schedules_student_read" ON public.schedules;
DROP POLICY IF EXISTS "achievement_defs_admin_manage" ON public.achievement_definitions;
DROP POLICY IF EXISTS "achievement_definitions_admin_manage" ON public.achievement_definitions;
DROP POLICY IF EXISTS "achievement_defs_read_all" ON public.achievement_definitions;
DROP POLICY IF EXISTS "achievement_definitions_read_all" ON public.achievement_definitions;
DROP POLICY IF EXISTS "student_achievements_student_manage_own" ON public.student_achievements;
DROP POLICY IF EXISTS "student_achievements_own" ON public.student_achievements;
DROP POLICY IF EXISTS "student_achievements_admin_read" ON public.student_achievements;
DROP POLICY IF EXISTS "metrics_read_all" ON public.metrics_daily;
DROP POLICY IF EXISTS "metrics_daily_read_all" ON public.metrics_daily;
DROP POLICY IF EXISTS "metrics_admin_write" ON public.metrics_daily;
DROP POLICY IF EXISTS "metrics_daily_admin_write" ON public.metrics_daily;

-- Drop helper function if exists
DROP FUNCTION IF EXISTS get_user_role(uuid);

-- PROFILES RLS (Fixed to avoid infinite recursion)
-- Use auth.uid() directly and avoid recursive lookups
-- Create a simple function to get user role from auth.users metadata
CREATE OR REPLACE FUNCTION get_user_role_from_jwt()
RETURNS TEXT AS $
BEGIN
  RETURN COALESCE(
    auth.jwt() ->> 'user_role',
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    'student'
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "profiles_read_access" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() OR 
    get_user_role_from_jwt() = 'admin'
  );

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- SUBJECTS RLS
CREATE POLICY "subjects_admin_access" ON public.subjects
  FOR ALL USING (admin_id = auth.uid()) WITH CHECK (admin_id = auth.uid());

CREATE POLICY "subjects_student_read" ON public.subjects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      INNER JOIN public.profiles p ON p.id = auth.uid()
      WHERE e.subject_id = subjects.id 
      AND e.grade_level = p.grade_level
      AND p.role = 'student'
    )
  );

-- EXAMS RLS
CREATE POLICY "exams_admin_access" ON public.exams
  FOR ALL USING (admin_id = auth.uid()) WITH CHECK (admin_id = auth.uid());

CREATE POLICY "exams_student_read" ON public.exams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'student' 
      AND p.grade_level = exams.grade_level
    )
  );

-- EXAM QUESTIONS RLS
CREATE POLICY "exam_questions_admin_access" ON public.exam_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.exams e 
      WHERE e.id = exam_questions.exam_id 
      AND e.admin_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exams e 
      WHERE e.id = exam_questions.exam_id 
      AND e.admin_id = auth.uid()
    )
  );

CREATE POLICY "exam_questions_student_read" ON public.exam_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      INNER JOIN public.profiles p ON p.id = auth.uid()
      WHERE e.id = exam_questions.exam_id
      AND p.role = 'student'
      AND p.grade_level = e.grade_level
    )
  );

-- EXAM SUBMISSIONS RLS
CREATE POLICY "exam_submissions_student_access" ON public.exam_submissions
  FOR ALL USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

CREATE POLICY "exam_submissions_admin_read" ON public.exam_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_submissions.exam_id 
      AND e.admin_id = auth.uid()
    )
  );

-- SUBMISSION ANSWERS RLS
CREATE POLICY "submission_answers_student_access" ON public.submission_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.exam_submissions s 
      WHERE s.id = submission_answers.submission_id 
      AND s.student_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exam_submissions s 
      WHERE s.id = submission_answers.submission_id 
      AND s.student_id = auth.uid()
    )
  );

CREATE POLICY "submission_answers_admin_read" ON public.submission_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.exam_submissions s
      INNER JOIN public.exams e ON e.id = s.exam_id
      WHERE s.id = submission_answers.submission_id 
      AND e.admin_id = auth.uid()
    )
  );

-- STUDENT EXAM STATS RLS
CREATE POLICY "student_exam_stats_student_read" ON public.student_exam_stats
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "student_exam_stats_admin_read" ON public.student_exam_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- ANNOUNCEMENTS RLS
CREATE POLICY "announcements_admin_access" ON public.announcements
  FOR ALL USING (admin_id = auth.uid()) WITH CHECK (admin_id = auth.uid());

CREATE POLICY "announcements_student_read" ON public.announcements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.grade_level = announcements.grade_level
    )
  );

-- ANNOUNCEMENT LIKES RLS
CREATE POLICY "announcement_likes_read" ON public.announcement_likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.announcements a
      INNER JOIN public.profiles p ON p.id = auth.uid()
      WHERE a.id = announcement_likes.announcement_id 
      AND a.grade_level = p.grade_level
    )
  );

CREATE POLICY "announcement_likes_insert" ON public.announcement_likes
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.announcements a
      INNER JOIN public.profiles p ON p.id = auth.uid()
      WHERE a.id = announcement_likes.announcement_id 
      AND a.grade_level = p.grade_level
    )
  );

-- ANNOUNCEMENT COMMENTS RLS
CREATE POLICY "announcement_comments_read" ON public.announcement_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.announcements a
      INNER JOIN public.profiles p ON p.id = auth.uid()
      WHERE a.id = announcement_comments.announcement_id 
      AND a.grade_level = p.grade_level
    )
  );

CREATE POLICY "announcement_comments_insert" ON public.announcement_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.announcements a
      INNER JOIN public.profiles p ON p.id = auth.uid()
      WHERE a.id = announcement_comments.announcement_id 
      AND a.grade_level = p.grade_level
    )
  );

-- QUESTIONS (FORUM) RLS
CREATE POLICY "questions_insert_grade" ON public.questions
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.grade_level = questions.grade_level
    )
  );

CREATE POLICY "questions_read_grade" ON public.questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.grade_level = questions.grade_level
    )
  );

CREATE POLICY "questions_update_own" ON public.questions
  FOR UPDATE USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

CREATE POLICY "questions_delete_own" ON public.questions
  FOR DELETE USING (author_id = auth.uid());

CREATE POLICY "questions_admin_access" ON public.questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- QUESTION LIKES RLS
CREATE POLICY "question_likes_read" ON public.question_likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      INNER JOIN public.profiles p ON p.id = auth.uid()
      WHERE q.id = question_likes.question_id 
      AND q.grade_level = p.grade_level
    )
  );

CREATE POLICY "question_likes_insert" ON public.question_likes
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.questions q
      INNER JOIN public.profiles p ON p.id = auth.uid()
      WHERE q.id = question_likes.question_id 
      AND q.grade_level = p.grade_level
    )
  );

CREATE POLICY "question_likes_delete" ON public.question_likes
  FOR DELETE USING (user_id = auth.uid());

-- QUESTION COMMENTS RLS
CREATE POLICY "question_comments_read" ON public.question_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      INNER JOIN public.profiles p ON p.id = auth.uid()
      WHERE q.id = question_comments.question_id 
      AND q.grade_level = p.grade_level
    )
  );

CREATE POLICY "question_comments_insert" ON public.question_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.questions q
      INNER JOIN public.profiles p ON p.id = auth.uid()
      WHERE q.id = question_comments.question_id 
      AND q.grade_level = p.grade_level
    )
  );

-- SCHEDULES RLS
CREATE POLICY "schedules_admin_access" ON public.schedules
  FOR ALL USING (admin_id = auth.uid()) WITH CHECK (admin_id = auth.uid());

CREATE POLICY "schedules_student_read" ON public.schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.grade_level = schedules.grade_level
    )
  );

-- ACHIEVEMENTS RLS
CREATE POLICY "achievement_definitions_admin_access" ON public.achievement_definitions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

CREATE POLICY "achievement_definitions_read_all" ON public.achievement_definitions
  FOR SELECT USING (true);

CREATE POLICY "student_achievements_student_access" ON public.student_achievements
  FOR ALL USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

CREATE POLICY "student_achievements_admin_read" ON public.student_achievements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- METRICS RLS
CREATE POLICY "metrics_daily_read_all" ON public.metrics_daily 
  FOR SELECT USING (true);

CREATE POLICY "metrics_daily_admin_access" ON public.metrics_daily
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- Ensure validation function exists for MCQ questions
CREATE OR REPLACE FUNCTION validate_question_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate MCQ questions have options
  IF NEW.type = 'MCQ' AND (NEW.options IS NULL OR jsonb_array_length(NEW.options) = 0) THEN
    RAISE EXCEPTION 'Questions of type MCQ must have options';
  END IF;
  
  -- Validate TRUE_FALSE questions have exactly 2 options
  IF NEW.type = 'TRUE_FALSE' AND (NEW.options IS NULL OR jsonb_array_length(NEW.options) != 2) THEN
    RAISE EXCEPTION 'Questions of type TRUE_FALSE must have exactly 2 options';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for question validation
DROP TRIGGER IF EXISTS validate_question_trigger ON public.exam_questions;
CREATE TRIGGER validate_question_trigger
  BEFORE INSERT OR UPDATE ON public.exam_questions
  FOR EACH ROW EXECUTE FUNCTION validate_question_data();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Test the connection with a simple query
SELECT 'Database fix completed successfully' as status;