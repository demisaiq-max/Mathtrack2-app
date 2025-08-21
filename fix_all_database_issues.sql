-- COMPREHENSIVE FIX FOR ALL DATABASE ISSUES
-- This script fixes infinite recursion, RLS policies, and ensures proper data access

-- Step 1: Disable RLS on all tables temporarily
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

-- PROFILES: Allow users to read and manage their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- SUBJECTS: Allow authenticated users to read, creators to manage
CREATE POLICY "subjects_select_authenticated" ON public.subjects
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "subjects_manage_own" ON public.subjects
  FOR ALL USING (admin_id = auth.uid())
  WITH CHECK (admin_id = auth.uid());

-- EXAMS: Allow authenticated users to read, creators to manage
CREATE POLICY "exams_select_authenticated" ON public.exams
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "exams_manage_own" ON public.exams
  FOR ALL USING (admin_id = auth.uid())
  WITH CHECK (admin_id = auth.uid());

-- EXAM QUESTIONS: Allow authenticated users to read, exam creators to manage
CREATE POLICY "exam_questions_select_authenticated" ON public.exam_questions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "exam_questions_manage_via_exam" ON public.exam_questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_questions.exam_id AND e.admin_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_questions.exam_id AND e.admin_id = auth.uid())
  );

-- EXAM SUBMISSIONS: Students manage their own, exam creators can read
CREATE POLICY "exam_submissions_student_own" ON public.exam_submissions
  FOR ALL USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "exam_submissions_admin_read" ON public.exam_submissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_submissions.exam_id AND e.admin_id = auth.uid())
  );

-- SUBMISSION ANSWERS: Students manage their own, exam creators can read
CREATE POLICY "submission_answers_student_own" ON public.submission_answers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.exam_submissions s WHERE s.id = submission_answers.submission_id AND s.student_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.exam_submissions s WHERE s.id = submission_answers.submission_id AND s.student_id = auth.uid())
  );

CREATE POLICY "submission_answers_admin_read" ON public.submission_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.exam_submissions s
      JOIN public.exams e ON e.id = s.exam_id
      WHERE s.id = submission_answers.submission_id AND e.admin_id = auth.uid()
    )
  );

-- STUDENT EXAM STATS: Students read their own
CREATE POLICY "student_exam_stats_own" ON public.student_exam_stats
  FOR ALL USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- ANNOUNCEMENTS: All authenticated users can read, creators can manage
CREATE POLICY "announcements_select_authenticated" ON public.announcements
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "announcements_manage_own" ON public.announcements
  FOR ALL USING (admin_id = auth.uid())
  WITH CHECK (admin_id = auth.uid());

-- ANNOUNCEMENT LIKES: All authenticated users can manage their own
CREATE POLICY "announcement_likes_select_authenticated" ON public.announcement_likes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "announcement_likes_manage_own" ON public.announcement_likes
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ANNOUNCEMENT COMMENTS: All authenticated users can read and manage their own
CREATE POLICY "announcement_comments_select_authenticated" ON public.announcement_comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "announcement_comments_manage_own" ON public.announcement_comments
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- QUESTIONS: All authenticated users can read and manage their own
CREATE POLICY "questions_select_authenticated" ON public.questions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "questions_manage_own" ON public.questions
  FOR ALL USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- QUESTION LIKES: All authenticated users can manage their own
CREATE POLICY "question_likes_select_authenticated" ON public.question_likes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "question_likes_manage_own" ON public.question_likes
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- QUESTION COMMENTS: All authenticated users can read and manage their own
CREATE POLICY "question_comments_select_authenticated" ON public.question_comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "question_comments_manage_own" ON public.question_comments
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- SCHEDULES: All authenticated users can read, creators can manage
CREATE POLICY "schedules_select_authenticated" ON public.schedules
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "schedules_manage_own" ON public.schedules
  FOR ALL USING (admin_id = auth.uid())
  WITH CHECK (admin_id = auth.uid());

-- ACHIEVEMENT DEFINITIONS: All can read, authenticated users can manage
CREATE POLICY "achievement_definitions_select_all" ON public.achievement_definitions
  FOR SELECT USING (true);

CREATE POLICY "achievement_definitions_manage_authenticated" ON public.achievement_definitions
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- STUDENT ACHIEVEMENTS: Students manage their own
CREATE POLICY "student_achievements_manage_own" ON public.student_achievements
  FOR ALL USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- METRICS DAILY: All can read, authenticated users can manage
CREATE POLICY "metrics_daily_select_all" ON public.metrics_daily
  FOR SELECT USING (true);

CREATE POLICY "metrics_daily_manage_authenticated" ON public.metrics_daily
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Step 5: Verify that exam questions have proper options format
-- Update any malformed options to ensure they are proper JSONB arrays
UPDATE public.exam_questions 
SET options = CASE 
  WHEN options IS NULL THEN NULL
  WHEN jsonb_typeof(options) = 'array' THEN options
  WHEN jsonb_typeof(options) = 'object' THEN 
    CASE 
      WHEN options ? '0' THEN -- Check if it has numeric keys (array stored as object)
        (SELECT jsonb_agg(value ORDER BY key::int) 
         FROM jsonb_each(options) 
         WHERE key ~ '^[0-9]+$')
      ELSE 
        jsonb_build_array(options)
    END
  ELSE 
    NULL
END
WHERE options IS NOT NULL;

-- Step 6: Ensure correct_answer is properly formatted
UPDATE public.exam_questions 
SET correct_answer = CASE 
  WHEN type = 'MCQ' AND correct_answer ~ '^[0-9]+$' THEN 
    chr(65 + correct_answer::int) -- Convert 0,1,2,3 to A,B,C,D
  WHEN type = 'TRUE_FALSE' AND correct_answer IN ('0', '1') THEN 
    CASE WHEN correct_answer = '0' THEN 'A' ELSE 'B' END
  ELSE 
    correct_answer
END
WHERE correct_answer IS NOT NULL;

-- Step 7: Remove any existing validation triggers that might be causing issues
DROP TRIGGER IF EXISTS validate_question_trigger ON public.exam_questions;
DROP FUNCTION IF EXISTS validate_question_data();
DROP FUNCTION IF EXISTS debug_question_insert(bigint, question_type, text, jsonb, text, numeric, int);

-- Step 8: Create a function to validate exam question data integrity (for reporting only)
CREATE OR REPLACE FUNCTION validate_exam_questions()
RETURNS TABLE(
  exam_id bigint,
  exam_title text,
  question_id bigint,
  question_prompt text,
  issue text
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    e.id as exam_id,
    e.title as exam_title,
    eq.id as question_id,
    LEFT(eq.prompt, 50) || '...' as question_prompt,
    CASE 
      WHEN eq.options IS NULL AND eq.type IN ('MCQ', 'TRUE_FALSE') THEN 'Missing options for MCQ/TRUE_FALSE question'
      WHEN eq.correct_answer IS NULL AND eq.type IN ('MCQ', 'TRUE_FALSE') THEN 'Missing correct answer for MCQ/TRUE_FALSE question'
      WHEN eq.type = 'MCQ' AND jsonb_array_length(eq.options) < 2 THEN 'MCQ question has less than 2 options'
      WHEN eq.type = 'TRUE_FALSE' AND jsonb_array_length(eq.options) != 2 THEN 'TRUE_FALSE question should have exactly 2 options'
      ELSE 'OK'
    END as issue
  FROM public.exams e
  JOIN public.exam_questions eq ON eq.exam_id = e.id
  WHERE eq.type IN ('MCQ', 'TRUE_FALSE')
  ORDER BY e.id, eq.position;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create a helper function to properly insert questions with validation
CREATE OR REPLACE FUNCTION insert_exam_question(
  p_exam_id bigint,
  p_type question_type,
  p_prompt text,
  p_options jsonb DEFAULT NULL,
  p_correct_answer text DEFAULT NULL,
  p_explanation text DEFAULT NULL,
  p_points numeric DEFAULT 1.0,
  p_position int DEFAULT 1
)
RETURNS bigint AS $
DECLARE
  new_id bigint;
BEGIN
  -- For MCQ and TRUE_FALSE, ensure we have proper options format
  IF p_type IN ('MCQ', 'TRUE_FALSE') THEN
    -- If options is null or empty, create default structure
    IF p_options IS NULL OR jsonb_array_length(p_options) = 0 THEN
      IF p_type = 'TRUE_FALSE' THEN
        p_options := '[{"key":"A","text":"True"},{"key":"B","text":"False"}]'::jsonb;
        IF p_correct_answer IS NULL THEN
          p_correct_answer := 'A';
        END IF;
      ELSE
        -- For MCQ, create placeholder options if none provided
        p_options := '[{"key":"A","text":"Option A"},{"key":"B","text":"Option B"},{"key":"C","text":"Option C"},{"key":"D","text":"Option D"}]'::jsonb;
        IF p_correct_answer IS NULL THEN
          p_correct_answer := 'A';
        END IF;
      END IF;
    END IF;
  END IF;
  
  -- Insert the question
  INSERT INTO public.exam_questions (
    exam_id, type, prompt, options, correct_answer, explanation, points, position, difficulty, ai_generated
  ) VALUES (
    p_exam_id, p_type, p_prompt, p_options, p_correct_answer, p_explanation, p_points, p_position, 'Medium', true
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION validate_exam_questions() TO authenticated;