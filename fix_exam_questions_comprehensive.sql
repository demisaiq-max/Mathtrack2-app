-- Comprehensive fix for exam questions and RLS policies
-- This addresses the issue where questions are created but options and correct_answer are NULL

-- First, let's check and fix the exam_questions table structure
-- The options column should be JSONB and allow proper JSON storage

-- Drop existing problematic policies
DROP POLICY IF EXISTS "questions_admin_manage_via_exam" ON public.exam_questions;
DROP POLICY IF EXISTS "questions_students_read_grade" ON public.exam_questions;
DROP POLICY IF EXISTS "exam_questions_admin_full_access" ON public.exam_questions;
DROP POLICY IF EXISTS "exam_questions_students_read_limited" ON public.exam_questions;

-- Create comprehensive policies for exam_questions
-- Allow admins full access to questions for their exams
CREATE POLICY "exam_questions_admin_manage" ON public.exam_questions
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

-- Allow students to read questions (but not correct answers) for their grade level
CREATE POLICY "exam_questions_students_read" ON public.exam_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 
      FROM public.exams e
      JOIN public.profiles sp ON sp.id = auth.uid()
      WHERE e.id = exam_questions.exam_id
        AND sp.role = 'student'
        AND sp.grade_level = e.grade_level
        AND e.status = 'Active'
    )
  );

-- Ensure RLS is enabled
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;

-- Fix submission policies
DROP POLICY IF EXISTS "submissions_student_manage_own" ON public.exam_submissions;
DROP POLICY IF EXISTS "submissions_admin_read_own_exam" ON public.exam_submissions;

CREATE POLICY "exam_submissions_student_access" ON public.exam_submissions
  FOR ALL USING (student_id = auth.uid()) 
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "exam_submissions_admin_read" ON public.exam_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_submissions.exam_id AND e.admin_id = auth.uid()
    )
  );

-- Fix submission answers policies
DROP POLICY IF EXISTS "answers_student_manage_own" ON public.submission_answers;
DROP POLICY IF EXISTS "answers_admin_read_via_exam" ON public.submission_answers;
DROP POLICY IF EXISTS "submission_answers_student_full_access" ON public.submission_answers;
DROP POLICY IF EXISTS "submission_answers_admin_read_access" ON public.submission_answers;

CREATE POLICY "submission_answers_student_manage" ON public.submission_answers
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
      SELECT 1 
      FROM public.exam_submissions s
      JOIN public.exams e ON e.id = s.exam_id
      WHERE s.id = submission_answers.submission_id 
      AND e.admin_id = auth.uid()
    )
  );

-- Ensure all tables have RLS enabled
ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_answers ENABLE ROW LEVEL SECURITY;

-- Create a function to validate question data before insertion
CREATE OR REPLACE FUNCTION validate_question_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure MCQ and TRUE_FALSE questions have options
  IF NEW.type IN ('MCQ', 'TRUE_FALSE') THEN
    IF NEW.options IS NULL OR jsonb_array_length(NEW.options) = 0 THEN
      RAISE EXCEPTION 'Questions of type % must have options', NEW.type;
    END IF;
    
    -- Ensure they have a correct answer
    IF NEW.correct_answer IS NULL OR trim(NEW.correct_answer) = '' THEN
      RAISE EXCEPTION 'Questions of type % must have a correct answer', NEW.type;
    END IF;
  END IF;
  
  -- Ensure prompt is not empty
  IF NEW.prompt IS NULL OR trim(NEW.prompt) = '' THEN
    RAISE EXCEPTION 'Question prompt cannot be empty';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate question data
DROP TRIGGER IF EXISTS validate_question_trigger ON public.exam_questions;
CREATE TRIGGER validate_question_trigger
  BEFORE INSERT OR UPDATE ON public.exam_questions
  FOR EACH ROW EXECUTE FUNCTION validate_question_data();

-- Create a function to help debug question insertion
CREATE OR REPLACE FUNCTION debug_question_insert(
  p_exam_id bigint,
  p_type question_type,
  p_prompt text,
  p_options jsonb DEFAULT NULL,
  p_correct_answer text DEFAULT NULL,
  p_points numeric DEFAULT 1.0,
  p_position int DEFAULT 1
)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  new_id bigint;
BEGIN
  -- Log the input parameters
  RAISE NOTICE 'Inserting question with: exam_id=%, type=%, prompt=%, options=%, correct_answer=%, points=%, position=%', 
    p_exam_id, p_type, p_prompt, p_options, p_correct_answer, p_points, p_position;
  
  -- Insert the question
  INSERT INTO public.exam_questions (
    exam_id, type, prompt, options, correct_answer, points, position, difficulty
  ) VALUES (
    p_exam_id, p_type, p_prompt, p_options, p_correct_answer, p_points, p_position, 'Medium'
  ) RETURNING id INTO new_id;
  
  -- Return success result
  result := jsonb_build_object(
    'success', true,
    'question_id', new_id,
    'message', 'Question inserted successfully'
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return error result
    result := jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql;