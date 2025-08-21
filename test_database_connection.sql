-- Test script to verify database connection and basic queries work
-- Run this after applying the comprehensive RLS fix

-- Test 1: Basic connection test
SELECT 'Database connection test' as test_name, count(*) as profile_count FROM public.profiles;

-- Test 2: Check if we can read exams
SELECT 'Exams test' as test_name, count(*) as exam_count FROM public.exams;

-- Test 3: Check if we can read exam questions
SELECT 'Questions test' as test_name, count(*) as question_count FROM public.exam_questions;

-- Test 4: Check exam data with subjects
SELECT 
  e.id,
  e.title,
  e.grade_level,
  e.status,
  s.name as subject_name,
  count(eq.id) as question_count
FROM public.exams e
LEFT JOIN public.subjects s ON s.id = e.subject_id
LEFT JOIN public.exam_questions eq ON eq.exam_id = e.id
GROUP BY e.id, e.title, e.grade_level, e.status, s.name
ORDER BY e.id;

-- Test 5: Check if exam questions have options
SELECT 
  eq.id,
  eq.exam_id,
  eq.prompt,
  eq.options,
  eq.correct_answer,
  eq.type
FROM public.exam_questions eq
WHERE eq.options IS NOT NULL
LIMIT 5;