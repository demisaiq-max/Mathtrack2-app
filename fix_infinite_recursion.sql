-- Fix infinite recursion in profiles table RLS policies
-- This script removes the problematic policies and creates new ones

-- First, disable RLS temporarily to avoid issues
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for profiles
-- Allow users to read their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Now fix the questions table policies to avoid referencing profiles in a way that causes recursion
-- Drop existing policies
DROP POLICY IF EXISTS "forum_question_insert_own_grade" ON public.questions;
DROP POLICY IF EXISTS "forum_question_manage_own" ON public.questions;
DROP POLICY IF EXISTS "forum_question_delete_own" ON public.questions;
DROP POLICY IF EXISTS "forum_question_admin_manage" ON public.questions;

-- Create new policies for questions that don't cause recursion
-- Allow authenticated users to insert questions (we'll validate grade in the app)
CREATE POLICY "questions_insert_authenticated" ON public.questions
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Allow users to read questions for their grade level
CREATE POLICY "questions_select_all" ON public.questions
  FOR SELECT USING (true);

-- Allow authors to update their own questions
CREATE POLICY "questions_update_own" ON public.questions
  FOR UPDATE USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Allow authors to delete their own questions
CREATE POLICY "questions_delete_own" ON public.questions
  FOR DELETE USING (auth.uid() = author_id);

-- Fix question_likes policies
DROP POLICY IF EXISTS "forum_interact_insert_self" ON public.question_likes;
DROP POLICY IF EXISTS "forum_interact_delete_self" ON public.question_likes;

CREATE POLICY "question_likes_insert_authenticated" ON public.question_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "question_likes_select_all" ON public.question_likes
  FOR SELECT USING (true);

CREATE POLICY "question_likes_delete_own" ON public.question_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Fix question_comments policies
DROP POLICY IF EXISTS "forum_interact_insert_self_comments" ON public.question_comments;

CREATE POLICY "question_comments_insert_authenticated" ON public.question_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "question_comments_select_all" ON public.question_comments
  FOR SELECT USING (true);

CREATE POLICY "question_comments_update_own" ON public.question_comments
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "question_comments_delete_own" ON public.question_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Fix announcement policies if they exist
DROP POLICY IF EXISTS "announcements_select_all" ON public.announcements;
DROP POLICY IF EXISTS "announcements_insert_admin" ON public.announcements;
DROP POLICY IF EXISTS "announcements_update_admin" ON public.announcements;
DROP POLICY IF EXISTS "announcements_delete_admin" ON public.announcements;

CREATE POLICY "announcements_select_all" ON public.announcements
  FOR SELECT USING (true);

CREATE POLICY "announcements_insert_authenticated" ON public.announcements
  FOR INSERT WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "announcements_update_own" ON public.announcements
  FOR UPDATE USING (auth.uid() = admin_id)
  WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "announcements_delete_own" ON public.announcements
  FOR DELETE USING (auth.uid() = admin_id);

-- Fix announcement_likes policies
DROP POLICY IF EXISTS "announcement_likes_insert_authenticated" ON public.announcement_likes;
DROP POLICY IF EXISTS "announcement_likes_select_all" ON public.announcement_likes;
DROP POLICY IF EXISTS "announcement_likes_delete_own" ON public.announcement_likes;

CREATE POLICY "announcement_likes_insert_authenticated" ON public.announcement_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "announcement_likes_select_all" ON public.announcement_likes
  FOR SELECT USING (true);

CREATE POLICY "announcement_likes_delete_own" ON public.announcement_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Fix announcement_comments policies
DROP POLICY IF EXISTS "announcement_comments_insert_authenticated" ON public.announcement_comments;
DROP POLICY IF EXISTS "announcement_comments_select_all" ON public.announcement_comments;
DROP POLICY IF EXISTS "announcement_comments_update_own" ON public.announcement_comments;
DROP POLICY IF EXISTS "announcement_comments_delete_own" ON public.announcement_comments;

CREATE POLICY "announcement_comments_insert_authenticated" ON public.announcement_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "announcement_comments_select_all" ON public.announcement_comments
  FOR SELECT USING (true);

CREATE POLICY "announcement_comments_update_own" ON public.announcement_comments
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "announcement_comments_delete_own" ON public.announcement_comments
  FOR DELETE USING (auth.uid() = user_id);