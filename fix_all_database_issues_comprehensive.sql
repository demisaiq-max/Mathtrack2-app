-- COMPREHENSIVE DATABASE FIX
-- This script fixes all RLS policies, infinite recursion issues, and validation problems

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "profiles_self_read_admin_read_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;

DROP POLICY IF EXISTS "subjects_admin_manage" ON public.subjects;
DROP POLICY IF EXISTS "subjects_students_read_via_exams" ON public.subjects;

DROP POLICY IF EXISTS "exams_admin_manage_own" ON public.exams;
DROP POLICY IF EXISTS "exams_students_read_grade" ON public.exams;

DROP POLICY IF EXISTS "questions_admin_manage_via_exam" ON public.exam_questions;
DROP POLICY IF EXISTS "questions_students_read_grade" ON public.exam_questions;

DROP POLICY IF EXISTS "submissions_student_manage_own" ON public.exam_submissions;
DROP POLICY IF EXISTS "submissions_admin_read_own_exam" ON public.exam_submissions;

DROP POLICY IF EXISTS "answers_student_manage_own" ON public.submission_answers;
DROP POLICY IF EXISTS "answers_admin_read_via_exam" ON public.submission_answers;

DROP POLICY IF EXISTS "stats_student_read_own" ON public.student_exam_stats;
DROP POLICY IF EXISTS "stats_admin_read_all" ON public.student_exam_stats;

DROP POLICY IF EXISTS "announcements_admin_manage" ON public.announcements;
DROP POLICY IF EXISTS "announcements_students_read_grade" ON public.announcements;
DROP POLICY IF EXISTS "announcement_interact_read_grade" ON public.announcement_likes;
DROP POLICY IF EXISTS "announcement_interact_insert_self" ON public.announcement_likes;
DROP POLICY IF EXISTS "announcement_interact_read_grade_comments" ON public.announcement_comments;
DROP POLICY IF EXISTS "announcement_interact_insert_self_comments" ON public.announcement_comments;

DROP POLICY IF EXISTS "forum_question_insert_own_grade" ON public.questions;
DROP POLICY IF EXISTS "forum_question_read_same_grade" ON public.questions;
DROP POLICY IF EXISTS "forum_question_manage_own" ON public.questions;
DROP POLICY IF EXISTS "forum_question_delete_own" ON public.questions;
DROP POLICY IF EXISTS "forum_question_admin_manage" ON public.questions;
DROP POLICY IF EXISTS "forum_interact_read_grade" ON public.question_likes;
DROP POLICY IF EXISTS "forum_interact_insert_self" ON public.question_likes;
DROP POLICY IF EXISTS "forum_interact_delete_self" ON public.question_likes;
DROP POLICY IF EXISTS "forum_interact_read_grade_comments" ON public.question_comments;
DROP POLICY IF EXISTS "forum_interact_insert_self_comments" ON public.question_comments;

DROP POLICY IF EXISTS "schedules_admin_manage_own" ON public.schedules;
DROP POLICY IF EXISTS "schedules_students_read_grade" ON public.schedules;

DROP POLICY IF EXISTS "achievement_defs_admin_manage" ON public.achievement_definitions;
DROP POLICY IF EXISTS "achievement_defs_read_all" ON public.achievement_definitions;
DROP POLICY IF EXISTS "student_achievements_student_manage_own" ON public.student_achievements;
DROP POLICY IF EXISTS "student_achievements_admin_read" ON public.student_achievements;

DROP POLICY IF EXISTS "metrics_read_all" ON public.metrics_daily;
DROP POLICY IF EXISTS "metrics_admin_write" ON public.metrics_daily;

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

-- Create helper function to get user role (avoids infinite recursion)
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid) RETURNS text AS $$
BEGIN
  RETURN (SELECT role::text FROM auth.users au WHERE au.id = user_id LIMIT 1);
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to get user grade (avoids infinite recursion)
CREATE OR REPLACE FUNCTION get_user_grade(user_id uuid) RETURNS int AS $$
BEGIN
  RETURN (SELECT grade_level FROM public.profiles WHERE id = user_id LIMIT 1);
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES RLS (Fixed to avoid infinite recursion)
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() OR 
    get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid()) 
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_delete" ON public.profiles
  FOR DELETE USING (
    id = auth.uid() OR 
    get_user_role(auth.uid()) = 'admin'
  );

-- SUBJECTS RLS
CREATE POLICY "subjects_admin_full" ON public.subjects
  FOR ALL USING (admin_id = auth.uid()) 
  WITH CHECK (admin_id = auth.uid());

CREATE POLICY "subjects_student_read" ON public.subjects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.subject_id = subjects.id 
        AND e.grade_level = get_user_grade(auth.uid())
    )
  );

-- EXAMS RLS
CREATE POLICY "exams_admin_full" ON public.exams
  FOR ALL USING (admin_id = auth.uid()) 
  WITH CHECK (admin_id = auth.uid());

CREATE POLICY "exams_student_read" ON public.exams
  FOR SELECT USING (
    get_user_role(auth.uid()) = 'student' AND 
    grade_level = get_user_grade(auth.uid())
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
      WHERE e.id = exam_questions.exam_id
        AND e.grade_level = get_user_grade(auth.uid())
        AND get_user_role(auth.uid()) = 'student'
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
  FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "student_exam_stats_system_write" ON public.student_exam_stats
  FOR ALL USING (true) WITH CHECK (true);

-- ANNOUNCEMENTS RLS
CREATE POLICY "announcements_admin_full" ON public.announcements
  FOR ALL USING (admin_id = auth.uid()) 
  WITH CHECK (admin_id = auth.uid());

CREATE POLICY "announcements_student_read" ON public.announcements
  FOR SELECT USING (grade_level = get_user_grade(auth.uid()));

-- ANNOUNCEMENT LIKES RLS
CREATE POLICY "announcement_likes_read" ON public.announcement_likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.announcements a
      WHERE a.id = announcement_likes.announcement_id 
        AND a.grade_level = get_user_grade(auth.uid())
    )
  );

CREATE POLICY "announcement_likes_insert" ON public.announcement_likes
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.announcements a
      WHERE a.id = announcement_likes.announcement_id 
        AND a.grade_level = get_user_grade(auth.uid())
    )
  );

CREATE POLICY "announcement_likes_delete" ON public.announcement_likes
  FOR DELETE USING (user_id = auth.uid());

-- ANNOUNCEMENT COMMENTS RLS
CREATE POLICY "announcement_comments_read" ON public.announcement_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.announcements a
      WHERE a.id = announcement_comments.announcement_id 
        AND a.grade_level = get_user_grade(auth.uid())
    )
  );

CREATE POLICY "announcement_comments_insert" ON public.announcement_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.announcements a
      WHERE a.id = announcement_comments.announcement_id 
        AND a.grade_level = get_user_grade(auth.uid())
    )
  );

CREATE POLICY "announcement_comments_update" ON public.announcement_comments
  FOR UPDATE USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "announcement_comments_delete" ON public.announcement_comments
  FOR DELETE USING (
    user_id = auth.uid() OR 
    get_user_role(auth.uid()) = 'admin'
  );

-- QUESTIONS (FORUM) RLS
CREATE POLICY "questions_insert" ON public.questions
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND
    grade_level = get_user_grade(auth.uid())
  );

CREATE POLICY "questions_read" ON public.questions
  FOR SELECT USING (
    grade_level = get_user_grade(auth.uid()) OR
    get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "questions_update" ON public.questions
  FOR UPDATE USING (
    author_id = auth.uid() OR 
    get_user_role(auth.uid()) = 'admin'
  ) WITH CHECK (
    author_id = auth.uid() OR 
    get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "questions_delete" ON public.questions
  FOR DELETE USING (
    author_id = auth.uid() OR 
    get_user_role(auth.uid()) = 'admin'
  );

-- QUESTION LIKES RLS
CREATE POLICY "question_likes_read" ON public.question_likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = question_likes.question_id 
        AND (q.grade_level = get_user_grade(auth.uid()) OR get_user_role(auth.uid()) = 'admin')
    )
  );

CREATE POLICY "question_likes_insert" ON public.question_likes
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = question_likes.question_id 
        AND q.grade_level = get_user_grade(auth.uid())
    )
  );

CREATE POLICY "question_likes_delete" ON public.question_likes
  FOR DELETE USING (user_id = auth.uid());

-- QUESTION COMMENTS RLS
CREATE POLICY "question_comments_read" ON public.question_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = question_comments.question_id 
        AND (q.grade_level = get_user_grade(auth.uid()) OR get_user_role(auth.uid()) = 'admin')
    )
  );

CREATE POLICY "question_comments_insert" ON public.question_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = question_comments.question_id 
        AND q.grade_level = get_user_grade(auth.uid())
    )
  );

CREATE POLICY "question_comments_update" ON public.question_comments
  FOR UPDATE USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "question_comments_delete" ON public.question_comments
  FOR DELETE USING (
    user_id = auth.uid() OR 
    get_user_role(auth.uid()) = 'admin'
  );

-- SCHEDULES RLS
CREATE POLICY "schedules_admin_full" ON public.schedules
  FOR ALL USING (admin_id = auth.uid()) 
  WITH CHECK (admin_id = auth.uid());

CREATE POLICY "schedules_student_read" ON public.schedules
  FOR SELECT USING (
    grade_level = get_user_grade(auth.uid()) OR
    grade_level IS NULL
  );

-- ACHIEVEMENT DEFINITIONS RLS
CREATE POLICY "achievement_definitions_admin_full" ON public.achievement_definitions
  FOR ALL USING (get_user_role(auth.uid()) = 'admin') 
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "achievement_definitions_read_all" ON public.achievement_definitions
  FOR SELECT USING (true);

-- STUDENT ACHIEVEMENTS RLS
CREATE POLICY "student_achievements_student_read" ON public.student_achievements
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "student_achievements_admin_full" ON public.student_achievements
  FOR ALL USING (get_user_role(auth.uid()) = 'admin') 
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "student_achievements_system_write" ON public.student_achievements
  FOR ALL USING (true) WITH CHECK (true);

-- METRICS RLS
CREATE POLICY "metrics_daily_read_all" ON public.metrics_daily 
  FOR SELECT USING (true);

CREATE POLICY "metrics_daily_admin_write" ON public.metrics_daily
  FOR ALL USING (get_user_role(auth.uid()) = 'admin') 
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_grade(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_question_data() TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Test basic connectivity
SELECT 'Database fix completed successfully' as status;