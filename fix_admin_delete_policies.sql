-- Drop the conflicting policies that check JWT claims
DROP POLICY IF EXISTS "Admins can manage all announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can manage all questions" ON public.questions;
DROP POLICY IF EXISTS "Admins can manage all announcement_likes" ON public.announcement_likes;
DROP POLICY IF EXISTS "Admins can manage all question_likes" ON public.question_likes;
DROP POLICY IF EXISTS "Admins can manage all announcement_comments" ON public.announcement_comments;
DROP POLICY IF EXISTS "Admins can manage all question_comments" ON public.question_comments;

-- Fix announcement policies to allow admin deletion
DROP POLICY IF EXISTS "announcements_admin_manage" ON public.announcements;
CREATE POLICY "announcements_admin_manage" ON public.announcements
  FOR ALL USING (
    admin_id = auth.uid() OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  ) 
  WITH CHECK (
    admin_id = auth.uid() OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Fix announcement likes policies for admin management
DROP POLICY IF EXISTS "announcement_interact_insert_self" ON public.announcement_likes;
DROP POLICY IF EXISTS "announcement_interact_read_grade" ON public.announcement_likes;

CREATE POLICY "announcement_likes_read" ON public.announcement_likes
  FOR SELECT USING (
    -- Students can read likes for their grade
    EXISTS (
      SELECT 1 FROM public.announcements a
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE a.id = announcement_likes.announcement_id AND a.grade_level = p.grade_level
    ) OR
    -- Admins can read all likes
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "announcement_likes_insert" ON public.announcement_likes
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND (
      -- Students can like announcements for their grade
      EXISTS (
        SELECT 1 FROM public.announcements a
        JOIN public.profiles p ON p.id = auth.uid()
        WHERE a.id = announcement_likes.announcement_id AND a.grade_level = p.grade_level
      ) OR
      -- Admins can like any announcement
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
  );

CREATE POLICY "announcement_likes_delete" ON public.announcement_likes
  FOR DELETE USING (
    user_id = auth.uid() OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Fix announcement comments policies for admin management
DROP POLICY IF EXISTS "announcement_interact_insert_self_comments" ON public.announcement_comments;
DROP POLICY IF EXISTS "announcement_interact_read_grade_comments" ON public.announcement_comments;

CREATE POLICY "announcement_comments_read" ON public.announcement_comments
  FOR SELECT USING (
    -- Students can read comments for their grade
    EXISTS (
      SELECT 1 FROM public.announcements a
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE a.id = announcement_comments.announcement_id AND a.grade_level = p.grade_level
    ) OR
    -- Admins can read all comments
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "announcement_comments_insert" ON public.announcement_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND (
      -- Students can comment on announcements for their grade
      EXISTS (
        SELECT 1 FROM public.announcements a
        JOIN public.profiles p ON p.id = auth.uid()
        WHERE a.id = announcement_comments.announcement_id AND a.grade_level = p.grade_level
      ) OR
      -- Admins can comment on any announcement
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
  );

CREATE POLICY "announcement_comments_delete" ON public.announcement_comments
  FOR DELETE USING (
    user_id = auth.uid() OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Fix question policies to allow admin deletion
DROP POLICY IF EXISTS "forum_question_admin_manage" ON public.questions;
CREATE POLICY "forum_question_admin_manage" ON public.questions
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Fix question likes policies for admin management
DROP POLICY IF EXISTS "forum_interact_insert_self" ON public.question_likes;
DROP POLICY IF EXISTS "forum_interact_delete_self" ON public.question_likes;
DROP POLICY IF EXISTS "forum_interact_read_grade" ON public.question_likes;

CREATE POLICY "question_likes_read" ON public.question_likes
  FOR SELECT USING (
    -- Students can read likes for their grade
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE q.id = question_likes.question_id AND q.grade_level = p.grade_level
    ) OR
    -- Admins can read all likes
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "question_likes_insert" ON public.question_likes
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND (
      -- Students can like questions for their grade
      EXISTS (
        SELECT 1 FROM public.questions q
        JOIN public.profiles p ON p.id = auth.uid()
        WHERE q.id = question_likes.question_id AND q.grade_level = p.grade_level
      ) OR
      -- Admins can like any question
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
  );

CREATE POLICY "question_likes_delete" ON public.question_likes
  FOR DELETE USING (
    user_id = auth.uid() OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Fix question comments policies for admin management
DROP POLICY IF EXISTS "forum_interact_insert_self_comments" ON public.question_comments;
DROP POLICY IF EXISTS "forum_interact_read_grade_comments" ON public.question_comments;

CREATE POLICY "question_comments_read" ON public.question_comments
  FOR SELECT USING (
    -- Students can read comments for their grade
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE q.id = question_comments.question_id AND q.grade_level = p.grade_level
    ) OR
    -- Admins can read all comments
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "question_comments_insert" ON public.question_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND (
      -- Students can comment on questions for their grade
      EXISTS (
        SELECT 1 FROM public.questions q
        JOIN public.profiles p ON p.id = auth.uid()
        WHERE q.id = question_comments.question_id AND q.grade_level = p.grade_level
      ) OR
      -- Admins can comment on any question
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
  );

CREATE POLICY "question_comments_delete" ON public.question_comments
  FOR DELETE USING (
    user_id = auth.uid() OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );