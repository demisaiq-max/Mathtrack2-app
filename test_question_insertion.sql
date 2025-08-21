-- Test script to verify question insertion works properly
-- Run this after applying the comprehensive fix

-- Test function to create a sample exam and questions
CREATE OR REPLACE FUNCTION test_question_insertion()
RETURNS jsonb AS $$
DECLARE
  test_admin_id uuid;
  test_subject_id bigint;
  test_exam_id bigint;
  mcq_options jsonb;
  tf_options jsonb;
  result jsonb;
BEGIN
  -- Get a test admin user (you'll need to replace this with an actual admin ID)
  SELECT id INTO test_admin_id FROM public.profiles WHERE role = 'admin' LIMIT 1;
  
  IF test_admin_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No admin user found for testing');
  END IF;
  
  -- Create or get a test subject
  INSERT INTO public.subjects (admin_id, name, description)
  VALUES (test_admin_id, 'Test Mathematics', 'Test subject for mathematics')
  ON CONFLICT (admin_id, name) DO UPDATE SET description = EXCLUDED.description
  RETURNING id INTO test_subject_id;
  
  -- Create a test exam
  INSERT INTO public.exams (
    admin_id, title, description, subject_id, grade_level, 
    duration_minutes, status, allowed_attempts
  ) VALUES (
    test_admin_id, 'Test Exam - Question Insertion', 'Test exam to verify question insertion',
    test_subject_id, 5, 60, 'Active', 1
  ) RETURNING id INTO test_exam_id;
  
  -- Prepare MCQ options
  mcq_options := jsonb_build_array(
    jsonb_build_object('key', 'A', 'text', '2'),
    jsonb_build_object('key', 'B', 'text', '4'),
    jsonb_build_object('key', 'C', 'text', '6'),
    jsonb_build_object('key', 'D', 'text', '8')
  );
  
  -- Insert MCQ question
  INSERT INTO public.exam_questions (
    exam_id, position, type, difficulty, points, prompt, options, correct_answer
  ) VALUES (
    test_exam_id, 1, 'MCQ', 'Medium', 2.0, 
    'What is 2 + 2?', mcq_options, 'B'
  );
  
  -- Prepare True/False options
  tf_options := jsonb_build_array(
    jsonb_build_object('key', 'A', 'text', 'True'),
    jsonb_build_object('key', 'B', 'text', 'False')
  );
  
  -- Insert True/False question
  INSERT INTO public.exam_questions (
    exam_id, position, type, difficulty, points, prompt, options, correct_answer
  ) VALUES (
    test_exam_id, 2, 'TRUE_FALSE', 'Medium', 2.0,
    'The Earth is round.', tf_options, 'A'
  );
  
  -- Insert Short Answer question
  INSERT INTO public.exam_questions (
    exam_id, position, type, difficulty, points, prompt, correct_answer
  ) VALUES (
    test_exam_id, 3, 'SHORT_ANSWER', 'Medium', 3.0,
    'What is the capital of France?', 'Paris'
  );
  
  -- Verify the questions were inserted correctly
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'type', type,
      'prompt', prompt,
      'options', options,
      'correct_answer', correct_answer,
      'points', points
    )
  ) INTO result
  FROM public.exam_questions 
  WHERE exam_id = test_exam_id
  ORDER BY position;
  
  RETURN jsonb_build_object(
    'success', true,
    'exam_id', test_exam_id,
    'questions', result
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql;

-- Function to clean up test data
CREATE OR REPLACE FUNCTION cleanup_test_data()
RETURNS jsonb AS $$
BEGIN
  -- Delete test exams and related data
  DELETE FROM public.exams WHERE title LIKE 'Test Exam - %';
  DELETE FROM public.subjects WHERE name LIKE 'Test %';
  
  RETURN jsonb_build_object('success', true, 'message', 'Test data cleaned up');
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- To run the test, execute:
-- SELECT test_question_insertion();

-- To clean up after testing, execute:
-- SELECT cleanup_test_data();