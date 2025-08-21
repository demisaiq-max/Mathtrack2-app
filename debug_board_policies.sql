-- Debug script to check board policies and data
-- Run this in Supabase SQL editor to debug the board issues

-- 1. Check if RLS is enabled on questions table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'questions';

-- 2. List all policies on questions table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'questions';

-- 3. Check current user's profile (replace with actual user ID)
-- SELECT id, full_name, email, role, grade_level 
-- FROM public.profiles 
-- WHERE email = 'your-student-email@example.com';

-- 4. Check existing questions for grade 10 (example)
SELECT id, grade_level, author_id, title, body, created_at
FROM public.questions 
WHERE grade_level = 10
ORDER BY created_at DESC;

-- 5. Test insert permissions (this will show what policies allow)
-- Replace 'your-user-id' with actual authenticated user ID
-- INSERT INTO public.questions (grade_level, author_id, title, body)
-- VALUES (10, 'your-user-id', 'Test Question', 'This is a test question body');

-- 6. Check if there are any conflicting policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('questions', 'question_likes', 'question_comments')
ORDER BY tablename, policyname;

-- 7. Verify profiles table has correct data
SELECT COUNT(*) as total_profiles, 
       COUNT(CASE WHEN role = 'student' THEN 1 END) as students,
       COUNT(CASE WHEN grade_level IS NOT NULL THEN 1 END) as with_grade
FROM public.profiles;