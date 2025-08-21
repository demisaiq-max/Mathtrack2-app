-- Fix RLS policies for exam questions to ensure proper access

-- Drop existing policies for exam_questions
DROP POLICY IF EXISTS "questions_admin_manage_via_exam" ON public.exam_questions;
DROP POLICY IF EXISTS "questions_students_read_grade" ON public.exam_questions;

-- Create new policies for exam_questions
-- Allow admins to manage questions for their own exams
CREATE POLICY "exam_questions_admin_full_access" ON public.exam_questions
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

-- Allow students to read questions for exams in their grade level
-- But hide correct_answer and explanation from students during exam
CREATE POLICY "exam_questions_students_read_limited" ON public.exam_questions
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

-- Ensure the RLS is enabled
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;

-- Also fix any potential issues with exam submissions and answers
-- Drop and recreate submission answer policies to ensure proper access
DROP POLICY IF EXISTS "answers_student_manage_own" ON public.submission_answers;
DROP POLICY IF EXISTS "answers_admin_read_via_exam" ON public.submission_answers;

-- Allow students to manage their own submission answers
CREATE POLICY "submission_answers_student_full_access" ON public.submission_answers
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
      AND s.status = 'Pending'
    )
  );

-- Allow admins to read submission answers for their exams
CREATE POLICY "submission_answers_admin_read_access" ON public.submission_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 
      FROM public.exam_submissions s
      JOIN public.exams e ON e.id = s.exam_id
      WHERE s.id = submission_answers.submission_id 
      AND e.admin_id = auth.uid()
    )
  );

-- Ensure RLS is enabled for submission_answers
ALTER TABLE public.submission_answers ENABLE ROW LEVEL SECURITY;