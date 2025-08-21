-- Simple fix for RLS policies to avoid infinite recursion
-- This removes all problematic policies and creates simple ones

-- Disable RLS temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_read_admin_read_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;

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

-- Fix questions table policies to be simpler
DROP POLICY IF EXISTS "forum_question_insert_own_grade" ON public.questions;
DROP POLICY IF EXISTS "forum_question_read_same_grade" ON public.questions;
DROP POLICY IF EXISTS "forum_question_manage_own" ON public.questions;
DROP POLICY IF EXISTS "forum_question_delete_own" ON public.questions;
DROP POLICY IF EXISTS "forum_question_admin_manage" ON public.questions;
DROP POLICY IF EXISTS "questions_insert_authenticated" ON public.questions;
DROP POLICY IF EXISTS "questions_select_all" ON public.questions;
DROP POLICY IF EXISTS "questions_update_own" ON public.questions;
DROP POLICY IF EXISTS "questions_delete_own" ON public.questions;

-- Create simple policies for questions
CREATE POLICY "questions_insert_authenticated" ON public.questions
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "questions_select_all" ON public.questions
  FOR SELECT USING (true);

CREATE POLICY "questions_update_own" ON public.questions
  FOR UPDATE USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "questions_delete_own" ON public.questions
  FOR DELETE USING (auth.uid() = author_id);

-- Fix announcements policies
DROP POLICY IF EXISTS "announcements_admin_manage" ON public.announcements;
DROP POLICY IF EXISTS "announcements_students_read_grade" ON public.announcements;
DROP POLICY IF EXISTS "announcements_select_all" ON public.announcements;
DROP POLICY IF EXISTS "announcements_insert_authenticated" ON public.announcements;
DROP POLICY IF EXISTS "announcements_update_own" ON public.announcements;
DROP POLICY IF EXISTS "announcements_delete_own" ON public.announcements;

CREATE POLICY "announcements_select_all" ON public.announcements
  FOR SELECT USING (true);

CREATE POLICY "announcements_insert_authenticated" ON public.announcements
  FOR INSERT WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "announcements_update_own" ON public.announcements
  FOR UPDATE USING (auth.uid() = admin_id)
  WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "announcements_delete_own" ON public.announcements
  FOR DELETE USING (auth.uid() = admin_id);

-- Allow admins to delete any questions (not just their own)
CREATE POLICY "questions_delete_admin" ON public.questions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to delete any announcements (not just their own)
CREATE POLICY "announcements_delete_admin" ON public.announcements
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );