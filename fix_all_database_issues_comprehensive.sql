-- Fix all database RLS policies to prevent infinite recursion
-- This script drops existing policies and recreates them with proper structure

-- Drop all existing RLS policies to avoid conflicts
DROP POLICY IF EXISTS "profiles_self_read_admin_read_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_read_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;

DROP POLICY IF EXISTS "subjects_admin_manage" ON public.subjects;
DROP POLICY IF EXISTS "subjects_students_read_via_exams" ON public.subjects;
DROP POLICY IF EXISTS "subjects_student_read" ON public.subjects;

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

-- Create a function to check if user is admin (to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
$$;

-- Create a function to get user grade level (to avoid recursion)
CREATE OR REPLACE FUNCTION public.get_user_grade(user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT grade_level FROM public.profiles 
  WHERE id = user_id;
$$;

-- PROFILES RLS (Fixed to avoid infinite recursion)
CREATE POLICY "profiles_self_read" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_admin_read_all" ON public.profiles
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "profiles_insert_self" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_self" ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- SUBJECTS RLS
CREATE POLICY "subjects_admin_manage" ON public.subjects
  FOR ALL USING (admin_id = auth.uid()) WITH CHECK (admin_id = auth.uid());

CREATE POLICY "subjects_student_read" ON public.subjects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.subject_id = subjects.id 
        AND e.grade_level = public.get_user_grade(auth.uid())
    )
  );

-- EXAMS RLS
CREATE POLICY "exams_admin_manage_own" ON public.exams
  FOR ALL USING (admin_id = auth.uid()) WITH CHECK (admin_id = auth.uid());

CREATE POLICY "exams_students_read_grade" ON public.exams
  FOR SELECT USING (
    grade_level = public.get_user_grade(auth.uid())
    AND NOT public.is_admin(auth.uid())
  );

-- EXAM QUESTIONS RLS
CREATE POLICY "questions_admin_manage_via_exam" ON public.exam_questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_questions.exam_id AND e.admin_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_questions.exam_id AND e.admin_id = auth.uid())
  );

CREATE POLICY "questions_students_read_grade" ON public.exam_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_questions.exam_id
        AND e.grade_level = public.get_user_grade(auth.uid())
        AND NOT public.is_admin(auth.uid())
    )
  );

-- SUBMISSIONS RLS
CREATE POLICY "submissions_student_manage_own" ON public.exam_submissions
  FOR ALL USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

CREATE POLICY "submissions_admin_read_own_exam" ON public.exam_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_submissions.exam_id AND e.admin_id = auth.uid()
    )
  );

-- SUBMISSION ANSWERS RLS
CREATE POLICY "answers_student_manage_own" ON public.submission_answers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.exam_submissions s WHERE s.id = submission_answers.submission_id AND s.student_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.exam_submissions s WHERE s.id = submission_answers.submission_id AND s.student_id = auth.uid() AND s.status = 'Pending')
  );

CREATE POLICY "answers_admin_read_via_exam" ON public.submission_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.exam_submissions s
      JOIN public.exams e ON e.id = s.exam_id
      WHERE s.id = submission_answers.submission_id AND e.admin_id = auth.uid()
    )
  );

-- STUDENT EXAM STATS RLS
CREATE POLICY "stats_student_read_own" ON public.student_exam_stats
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "stats_admin_read_all" ON public.student_exam_stats
  FOR SELECT USING (public.is_admin(auth.uid()));

-- ANNOUNCEMENTS & INTERACTIONS RLS
CREATE POLICY "announcements_admin_manage" ON public.announcements
  FOR ALL USING (admin_id = auth.uid()) WITH CHECK (admin_id = auth.uid());

CREATE POLICY "announcements_students_read_grade" ON public.announcements
  FOR SELECT USING (
    grade_level = public.get_user_grade(auth.uid())
  );

CREATE POLICY "announcement_interact_read_grade" ON public.announcement_likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.announcements a
      WHERE a.id = announcement_likes.announcement_id 
        AND a.grade_level = public.get_user_grade(auth.uid())
    )
  );

CREATE POLICY "announcement_interact_insert_self" ON public.announcement_likes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "announcement_interact_read_grade_comments" ON public.announcement_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.announcements a
      WHERE a.id = announcement_comments.announcement_id 
        AND a.grade_level = public.get_user_grade(auth.uid())
    )
  );

CREATE POLICY "announcement_interact_insert_self_comments" ON public.announcement_comments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- QUESTIONS (FORUM) & INTERACTIONS RLS
CREATE POLICY "forum_question_insert_own_grade" ON public.questions
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND
    grade_level = public.get_user_grade(auth.uid())
  );

CREATE POLICY "forum_question_read_same_grade" ON public.questions
  FOR SELECT USING (
    grade_level = public.get_user_grade(auth.uid())
  );

CREATE POLICY "forum_question_manage_own" ON public.questions
  FOR UPDATE USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "forum_question_delete_own" ON public.questions
  FOR DELETE USING (author_id = auth.uid());

CREATE POLICY "forum_question_admin_manage" ON public.questions
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "forum_interact_read_grade" ON public.question_likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = question_likes.question_id 
        AND q.grade_level = public.get_user_grade(auth.uid())
    )
  );

CREATE POLICY "forum_interact_insert_self" ON public.question_likes
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = question_likes.question_id 
        AND q.grade_level = public.get_user_grade(auth.uid())
    )
  );

CREATE POLICY "forum_interact_delete_self" ON public.question_likes
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "forum_interact_read_grade_comments" ON public.question_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = question_comments.question_id 
        AND q.grade_level = public.get_user_grade(auth.uid())
    )
  );

CREATE POLICY "forum_interact_insert_self_comments" ON public.question_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = question_comments.question_id 
        AND q.grade_level = public.get_user_grade(auth.uid())
    )
  );

-- SCHEDULES RLS
CREATE POLICY "schedules_admin_manage_own" ON public.schedules
  FOR ALL USING (admin_id = auth.uid()) WITH CHECK (admin_id = auth.uid());

CREATE POLICY "schedules_students_read_grade" ON public.schedules
  FOR SELECT USING (
    grade_level = public.get_user_grade(auth.uid())
  );

-- ACHIEVEMENTS RLS
CREATE POLICY "achievement_defs_admin_manage" ON public.achievement_definitions
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "achievement_defs_read_all" ON public.achievement_definitions
  FOR SELECT USING (true);

CREATE POLICY "student_achievements_student_manage_own" ON public.student_achievements
  FOR ALL USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

CREATE POLICY "student_achievements_admin_read" ON public.student_achievements
  FOR SELECT USING (public.is_admin(auth.uid()));

-- METRICS RLS
CREATE POLICY "metrics_read_all" ON public.metrics_daily 
  FOR SELECT USING (true);

CREATE POLICY "metrics_admin_write" ON public.metrics_daily
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Add validation function for MCQ questions
CREATE OR REPLACE FUNCTION public.validate_question_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate MCQ questions have options
  IF NEW.type = 'MCQ' AND (NEW.options IS NULL OR jsonb_array_length(NEW.options) = 0) THEN
    RAISE EXCEPTION 'Questions of type MCQ must have options';
  END IF;
  
  -- Validate TRUE_FALSE questions have correct answer
  IF NEW.type = 'TRUE_FALSE' AND NEW.correct_answer NOT IN ('True', 'False') THEN
    RAISE EXCEPTION 'TRUE_FALSE questions must have correct_answer as "True" or "False"';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for question validation
DROP TRIGGER IF EXISTS validate_question_data_trigger ON public.exam_questions;
CREATE TRIGGER validate_question_data_trigger
  BEFORE INSERT OR UPDATE ON public.exam_questions
  FOR EACH ROW EXECUTE FUNCTION public.validate_question_data();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_grade(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_question_data() TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'RLS policies have been successfully recreated without infinite recursion issues.' as result;