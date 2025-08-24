-- Fix RLS policies for questions table to allow admin deletion
-- Drop existing policies
DROP POLICY IF EXISTS "forum_question_read_same_grade" ON public.questions;
DROP POLICY IF EXISTS "forum_question_admin_manage" ON public.questions;

-- Recreate policies with better permission handling
-- Allow reading questions from same grade OR if user is admin
CREATE POLICY "forum_question_read_same_grade" ON public.questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles sp 
      WHERE sp.id = auth.uid() 
      AND (sp.grade_level = questions.grade_level OR sp.role = 'admin')
    )
  );

-- Allow admins to manage all questions (simplified policy)
CREATE POLICY "forum_question_admin_manage" ON public.questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles sp 
      WHERE sp.id = auth.uid() AND sp.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles sp 
      WHERE sp.id = auth.uid() AND sp.role = 'admin'
    )
  );

-- Also update question_likes and question_comments policies to allow admin access
DROP POLICY IF EXISTS "forum_interact_read_grade" ON public.question_likes;
CREATE POLICY "forum_interact_read_grade" ON public.question_likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE q.id = question_likes.question_id 
      AND (q.grade_level = p.grade_level OR p.role = 'admin')
    )
  );

DROP POLICY IF EXISTS "forum_interact_read_grade_comments" ON public.question_comments;
CREATE POLICY "forum_interact_read_grade_comments" ON public.question_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE q.id = question_comments.question_id 
      AND (q.grade_level = p.grade_level OR p.role = 'admin')
    )
  );

-- Allow admins to delete question likes and comments
CREATE POLICY "forum_interact_admin_delete" ON public.question_likes
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles sp 
      WHERE sp.id = auth.uid() AND sp.role = 'admin'
    )
  );

CREATE POLICY "forum_interact_admin_delete_comments" ON public.question_comments
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles sp 
      WHERE sp.id = auth.uid() AND sp.role = 'admin'
    )
  );