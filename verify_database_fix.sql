-- Test queries to verify database functionality after applying the comprehensive fix

-- Test 1: Check if we can access profiles
SELECT 'Profile access test' as test_name, 
       count(*) as total_profiles,
       count(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
       count(CASE WHEN role = 'student' THEN 1 END) as student_count
FROM public.profiles;

-- Test 2: Check exams and their questions
SELECT 'Exam questions test' as test_name,
       e.id as exam_id,
       e.title,
       e.grade_level,
       e.status,
       count(eq.id) as question_count,
       count(CASE WHEN eq.options IS NOT NULL THEN 1 END) as questions_with_options
FROM public.exams e
LEFT JOIN public.exam_questions eq ON eq.exam_id = e.id
GROUP BY e.id, e.title, e.grade_level, e.status
ORDER BY e.id;

-- Test 3: Check question options format
SELECT 'Question options format test' as test_name,
       eq.id,
       eq.type,
       LEFT(eq.prompt, 30) || '...' as prompt_preview,
       eq.options,
       jsonb_typeof(eq.options) as options_type,
       CASE 
         WHEN eq.options IS NULL THEN 'NULL'
         WHEN jsonb_typeof(eq.options) = 'array' THEN 'Array (' || jsonb_array_length(eq.options) || ' items)'
         ELSE 'Not array'
       END as options_status,
       eq.correct_answer
FROM public.exam_questions eq
WHERE eq.type IN ('MCQ', 'TRUE_FALSE')
ORDER BY eq.id
LIMIT 10;

-- Test 4: Validate exam questions using the new function
SELECT * FROM validate_exam_questions()
WHERE issue != 'OK'
LIMIT 10;

-- Test 5: Check if submissions and answers work
SELECT 'Submissions test' as test_name,
       count(*) as total_submissions,
       count(CASE WHEN status = 'Pending' THEN 1 END) as pending_submissions,
       count(CASE WHEN status = 'Graded' THEN 1 END) as graded_submissions
FROM public.exam_submissions;

-- Test 6: Check submission answers
SELECT 'Submission answers test' as test_name,
       count(*) as total_answers,
       count(CASE WHEN selected_key IS NOT NULL THEN 1 END) as mcq_answers,
       count(CASE WHEN answer_text IS NOT NULL THEN 1 END) as text_answers,
       count(CASE WHEN is_correct = true THEN 1 END) as correct_answers
FROM public.submission_answers;