-- Fix RLS policies for questions table
-- Drop existing conflicting policies
DROP POLICY IF EXISTS "forum_question_manage_self_or_admin" ON public.questions;
DROP POLICY IF EXISTS "forum_interact_insert_self" ON public.question_likes;
DROP POLICY IF EXISTS "forum_interact_insert_self_comments" ON public.question_comments;

-- Create new policies for questions table
-- Allow students to insert questions for their own grade
CREATE POLICY "forum_question_insert_own_grade" ON public.questions
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles sp 
      WHERE sp.id = auth.uid() AND sp.grade_level = questions.grade_level
    )
  );

-- Allow authors to update/delete their own questions
CREATE POLICY "forum_question_manage_own" ON public.questions
  FOR UPDATE USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "forum_question_delete_own" ON public.questions
  FOR DELETE USING (author_id = auth.uid());

-- Allow admins to manage all questions
CREATE POLICY "forum_question_admin_manage" ON public.questions
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Fix question_likes policies
CREATE POLICY "forum_interact_insert_self" ON public.question_likes
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE q.id = question_likes.question_id AND q.grade_level = p.grade_level
    )
  );

CREATE POLICY "forum_interact_delete_self" ON public.question_likes
  FOR DELETE USING (user_id = auth.uid());

-- Fix question_comments policies
CREATE POLICY "forum_interact_insert_self_comments" ON public.question_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE q.id = question_comments.question_id AND q.grade_level = p.grade_level
    )
  );