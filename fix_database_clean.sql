-- CLEAN DATABASE FIX
-- This script safely drops and recreates all RLS policies to fix infinite recursion and other issues

-- First, drop ALL existing policies safely
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on all tables
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Drop existing functions that might cause issues
DROP FUNCTION IF EXISTS get_user_role(uuid);
DROP FUNCTION IF EXISTS get_user_grade(uuid);
DROP FUNCTION IF EXISTS validate_question_data();

-- Create helper functions to avoid infinite recursion
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid) RETURNS text AS $$
BEGIN
  -- Get role from auth.users metadata or profiles table
  RETURN COALESCE(
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = user_id),
    (SELECT role::text FROM public.profiles WHERE id = user_id LIMIT 1)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_grade(user_id uuid) RETURNS int AS $$
BEGIN
  RETURN (SELECT grade_level FROM public.profiles WHERE id = user_id LIMIT 1);
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add validation function for MCQ questions
CREATE OR REPLACE FUNCTION validate_question_data() RETURNS TRIGGER AS $$
BEGIN
  -- Validate MCQ questions have options
  IF NEW.type = 'MCQ' AND (NEW.options IS NULL OR jsonb_array_length(NEW.options) = 0) THEN
    RAISE EXCEPTION 'Questions of type MCQ must have options';
  END IF;
  
  -- Validate TRUE_FALSE questions have correct structure
  IF NEW.type = 'TRUE_FALSE' AND (NEW.options IS NULL OR jsonb_array_length(NEW.options) != 2) THEN
    NEW.options := '[{"key":"T","text":"True"},{"key":"F","text":"False"}]'::jsonb;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS validate_question_trigger ON public.exam_questions;
CREATE TRIGGER validate_question_trigger
  BEFORE INSERT OR UPDATE ON public.exam_questions
  FOR EACH ROW EXECUTE FUNCTION validate_question_data();

-- PROFILES RLS (Simple, no recursion)
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() OR 
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid()) 
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_delete" ON public.profiles
  FOR DELETE USING (
    id = auth.uid() OR 
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

-- SUBJECTS RLS
CREATE POLICY "subjects_admin_full" ON public.subjects
  FOR ALL USING (admin_id = auth.uid()) 
  WITH CHECK (admin_id = auth.uid());

CREATE POLICY "subjects_student_read" ON public.subjects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE e.subject_id = subjects.id 
        AND e.grade_level = p.grade_level
        AND p.role = 'student'
    )
  );

-- EXAMS RLS
CREATE POLICY "exams_admin_full" ON public.exams
  FOR ALL USING (admin_id = auth.uid()) 
  WITH CHECK (admin_id = auth.uid());

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
CREATE POLICY "exam_questions_admin_full" ON public.exam_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.exams e 
      WHERE e.id = exam_questions.exam_id AND e.admin_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exams e 
      WHERE e.id = exam_questions.exam_id AND e.admin_id = auth.uid()
    )
  );

CREATE POLICY "exam_questions_student_read" ON public.exam_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE e.id = exam_questions.exam_id
        AND e.grade_level = p.grade_level
        AND p.role = 'student'
    )
  );

-- EXAM SUBMISSIONS RLS
CREATE POLICY "exam_submissions_student_full" ON public.exam_submissions
  FOR ALL USING (student_id = auth.uid()) 
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "exam_submissions_admin_read" ON public.exam_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_submissions.exam_id AND e.admin_id = auth.uid()
    )
  );

CREATE POLICY "exam_submissions_admin_update" ON public.exam_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_submissions.exam_id AND e.admin_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_submissions.exam_id AND e.admin_id = auth.uid()
    )
  );

-- SUBMISSION ANSWERS RLS
CREATE POLICY "submission_answers_student_full" ON public.submission_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.exam_submissions s 
      WHERE s.id = submission_answers.submission_id AND s.student_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exam_submissions s 
      WHERE s.id = submission_answers.submission_id 
        AND s.student_id = auth.uid() 
        AND s.status = 'Pending'
    )
  );

CREATE POLICY "submission_answers_admin_read" ON public.submission_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.exam_submissions s
      JOIN public.exams e ON e.id = s.exam_id
      WHERE s.id = submission_answers.submission_id AND e.admin_id = auth.uid()
    )
  );

-- STUDENT EXAM STATS RLS
CREATE POLICY "student_exam_stats_student_read" ON public.student_exam_stats
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "student_exam_stats_admin_read" ON public.student_exam_stats
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "student_exam_stats_system_write" ON public.student_exam_stats
  FOR ALL USING (true) WITH CHECK (true);

-- ANNOUNCEMENTS RLS
CREATE POLICY "announcements_admin_full" ON public.announcements
  FOR ALL USING (admin_id = auth.uid()) 
  WITH CHECK (admin_id = auth.uid());

CREATE POLICY "announcements_student_read" ON public.announcements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.grade_level = announcements.grade_level
    )
  );

-- ANNOUNCEMENT LIKES RLS
CREATE POLICY "announcement_likes_read" ON public.announcement_likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.announcements a
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE a.id = announcement_likes.announcement_id 
        AND a.grade_level = p.grade_level
    )
  );

CREATE POLICY "announcement_likes_insert" ON public.announcement_likes
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.announcements a
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE a.id = announcement_likes.announcement_id 
        AND a.grade_level = p.grade_level
    )
  );

CREATE POLICY "announcement_likes_delete" ON public.announcement_likes
  FOR DELETE USING (user_id = auth.uid());

-- ANNOUNCEMENT COMMENTS RLS
CREATE POLICY "announcement_comments_read" ON public.announcement_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.announcements a
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE a.id = announcement_comments.announcement_id 
        AND a.grade_level = p.grade_level
    )
  );

CREATE POLICY "announcement_comments_insert" ON public.announcement_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.announcements a
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE a.id = announcement_comments.announcement_id 
        AND a.grade_level = p.grade_level
    )
  );

CREATE POLICY "announcement_comments_update" ON public.announcement_comments
  FOR UPDATE USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "announcement_comments_delete" ON public.announcement_comments
  FOR DELETE USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

-- QUESTIONS (FORUM) RLS
CREATE POLICY "questions_insert" ON public.questions
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.grade_level = questions.grade_level
    )
  );

CREATE POLICY "questions_read" ON public.questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
        AND (p.grade_level = questions.grade_level OR p.role = 'admin')
    )
  );

CREATE POLICY "questions_update" ON public.questions
  FOR UPDATE USING (
    author_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  ) WITH CHECK (
    author_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "questions_delete" ON public.questions
  FOR DELETE USING (
    author_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

-- QUESTION LIKES RLS
CREATE POLICY "question_likes_read" ON public.question_likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE q.id = question_likes.question_id 
        AND (q.grade_level = p.grade_level OR p.role = 'admin')
    )
  );

CREATE POLICY "question_likes_insert" ON public.question_likes
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.profiles p ON p.id = auth.uid()
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
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE q.id = question_comments.question_id 
        AND (q.grade_level = p.grade_level OR p.role = 'admin')
    )
  );

CREATE POLICY "question_comments_insert" ON public.question_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE q.id = question_comments.question_id 
        AND q.grade_level = p.grade_level
    )
  );

CREATE POLICY "question_comments_update" ON public.question_comments
  FOR UPDATE USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "question_comments_delete" ON public.question_comments
  FOR DELETE USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

-- SCHEDULES RLS
CREATE POLICY "schedules_admin_full" ON public.schedules
  FOR ALL USING (admin_id = auth.uid()) 
  WITH CHECK (admin_id = auth.uid());

CREATE POLICY "schedules_student_read" ON public.schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
        AND (p.grade_level = schedules.grade_level OR schedules.grade_level IS NULL)
    )
  );

-- ACHIEVEMENT DEFINITIONS RLS
CREATE POLICY "achievement_definitions_admin_full" ON public.achievement_definitions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "achievement_definitions_read_all" ON public.achievement_definitions
  FOR SELECT USING (true);

-- STUDENT ACHIEVEMENTS RLS
CREATE POLICY "student_achievements_student_read" ON public.student_achievements
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "student_achievements_admin_full" ON public.student_achievements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "student_achievements_system_write" ON public.student_achievements
  FOR ALL USING (true) WITH CHECK (true);

-- METRICS RLS
CREATE POLICY "metrics_daily_read_all" ON public.metrics_daily 
  FOR SELECT USING (true);

CREATE POLICY "metrics_daily_admin_write" ON public.metrics_daily
  FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_grade(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_question_data() TO authenticated;

-- Test basic connectivity
SELECT 'Database policies fixed successfully' as status;