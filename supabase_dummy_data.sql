-- DUMMY DATA FOR MATHTRACK EDUCATION APP
-- Run this after the main schema is created

-- First, we need to create some dummy auth.users entries
-- Note: In real Supabase, these would be created through auth signup
-- For testing, we'll insert dummy UUIDs that you can map to real auth users later

-- DUMMY PROFILES (Admin and Students)
-- Admin profiles
insert into public.profiles (id, full_name, email, role, grade_level) values
  ('11111111-1111-1111-1111-111111111111', 'Ali Jawad', 'alijawad12@gmail.com', 'admin', null),
  ('22222222-2222-2222-2222-222222222222', 'Mr. Johnson', 'johnson@mathtrack.com', 'admin', null),
  ('33333333-3333-3333-3333-333333333333', 'Ms. Smith', 'smith@mathtrack.com', 'admin', null),
  ('44444444-4444-4444-4444-444444444444', 'Dr. Wilson', 'wilson@mathtrack.com', 'admin', null);

-- Student profiles (various grades)
insert into public.profiles (id, full_name, email, role, grade_level) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Saiq Kamran', 'wfeknje@gmail.com', 'student', 10),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'John Smith', 'john.smith@student.com', 'student', 12),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Sarah Johnson', 'sarah.johnson@student.com', 'student', 11),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Mike Davis', 'mike.davis@student.com', 'student', 12),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Emma Wilson', 'emma.wilson@student.com', 'student', 11),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Alex Brown', 'alex.brown@student.com', 'student', 10),
  ('gggggggg-gggg-gggg-gggg-gggggggggggg', 'Lisa Chen', 'lisa.chen@student.com', 'student', 9),
  ('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'David Kim', 'david.kim@student.com', 'student', 8),
  ('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 'Maria Garcia', 'maria.garcia@student.com', 'student', 7),
  ('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', 'Ryan Taylor', 'ryan.taylor@student.com', 'student', 6),
  ('kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk', 'Sophie Anderson', 'sophie.anderson@student.com', 'student', 5);

-- SUBJECTS (created by admins)
insert into public.subjects (admin_id, name, description) values
  ('11111111-1111-1111-1111-111111111111', 'Mathematics', 'Core mathematics curriculum covering algebra, geometry, and calculus'),
  ('11111111-1111-1111-1111-111111111111', 'Physics', 'Physics fundamentals and advanced concepts'),
  ('11111111-1111-1111-1111-111111111111', 'Chemistry', 'General and organic chemistry'),
  ('11111111-1111-1111-1111-111111111111', 'Biology', 'Life sciences and biological systems'),
  ('11111111-1111-1111-1111-111111111111', 'English', 'English language arts and literature'),
  ('22222222-2222-2222-2222-222222222222', 'Statistics', 'Statistical analysis and probability'),
  ('33333333-3333-3333-3333-333333333333', 'Geometry', 'Geometric principles and proofs'),
  ('44444444-4444-4444-4444-444444444444', 'Calculus', 'Differential and integral calculus');

-- EXAMS
insert into public.exams (admin_id, title, description, subject_id, grade_level, duration_minutes, instructions, scheduled_start, scheduled_end, status) values
  ('11111111-1111-1111-1111-111111111111', 'Algebra II - Final Exam', 'Comprehensive final exam covering all algebra topics', 1, 12, 120, 'Read all questions carefully. Show your work for partial credit.', '2025-01-22 14:00:00+00', '2025-01-22 16:00:00+00', 'Active'),
  ('11111111-1111-1111-1111-111111111111', 'Geometry - Chapter 8 Quiz', 'Quiz on geometric transformations and congruence', 7, 11, 45, 'Use a calculator where appropriate.', '2025-01-20 10:00:00+00', '2025-01-20 10:45:00+00', 'Active'),
  ('44444444-4444-4444-4444-444444444444', 'Calculus I - Midterm', 'Midterm covering limits and derivatives', 8, 12, 90, 'No calculators allowed for the first section.', '2025-01-25 09:00:00+00', '2025-01-25 10:30:00+00', 'Active'),
  ('22222222-2222-2222-2222-222222222222', 'Statistics - Quiz 3', 'Quiz on probability distributions', 6, 11, 60, 'Formula sheet provided.', '2025-01-18 13:00:00+00', '2025-01-18 14:00:00+00', 'Active'),
  ('11111111-1111-1111-1111-111111111111', 'Math Quiz - Grade 10', 'Basic algebra and geometry quiz', 1, 10, 60, 'Show all work clearly.', '2025-01-15 11:00:00+00', '2025-01-15 12:00:00+00', 'Active'),
  ('11111111-1111-1111-1111-111111111111', 'Physics Lab Test', 'Practical physics concepts', 2, 11, 90, 'Lab safety rules apply.', '2025-01-16 15:30:00+00', '2025-01-16 17:00:00+00', 'Active'),
  ('11111111-1111-1111-1111-111111111111', 'Biology Test', 'Cell biology and genetics', 4, 10, 75, 'Multiple choice and short answers.', '2025-01-22 10:00:00+00', '2025-01-22 11:15:00+00', 'Active'),
  ('11111111-1111-1111-1111-111111111111', 'Grade 5 Math Quiz', 'Basic arithmetic and fractions', 1, 5, 45, 'Show all work clearly.', '2025-01-23 10:00:00+00', '2025-01-23 10:45:00+00', 'Active'),
  ('11111111-1111-1111-1111-111111111111', 'Grade 5 Science Test', 'Plants and animals basics', 4, 5, 60, 'Read questions carefully.', '2025-01-24 14:00:00+00', '2025-01-24 15:00:00+00', 'Active');

-- EXAM QUESTIONS (various types)
-- Math Quiz questions
insert into public.exam_questions (exam_id, position, type, difficulty, points, prompt, options, correct_answer, explanation, ai_generated) values
  (5, 1, 'MCQ', 'Medium', 2, 'What is the value of x in the equation 2x + 5 = 13?', 
   '[{"key":"A","text":"x = 3"},{"key":"B","text":"x = 4"},{"key":"C","text":"x = 5"},{"key":"D","text":"x = 6"}]', 
   'B', 'To solve 2x + 5 = 13, subtract 5 from both sides to get 2x = 8, then divide by 2 to get x = 4.', false),
  
  (5, 2, 'TRUE_FALSE', 'Easy', 1, 'The sum of angles in any triangle is always 180 degrees.', 
   '[{"key":"T","text":"True"},{"key":"F","text":"False"}]', 
   'T', 'This is a fundamental property of triangles in Euclidean geometry.', false),
  
  (5, 3, 'SHORT_ANSWER', 'Medium', 3, 'Calculate the area of a rectangle with length 8 cm and width 5 cm.', 
   null, '40', 'Area of rectangle = length × width = 8 × 5 = 40 square cm', false);

-- Physics questions
insert into public.exam_questions (exam_id, position, type, difficulty, points, prompt, options, correct_answer, explanation, ai_generated) values
  (6, 1, 'MCQ', 'Hard', 3, 'What is the acceleration due to gravity on Earth?', 
   '[{"key":"A","text":"9.8 m/s²"},{"key":"B","text":"10 m/s²"},{"key":"C","text":"9.6 m/s²"},{"key":"D","text":"8.9 m/s²"}]', 
   'A', 'The standard acceleration due to gravity on Earth is approximately 9.8 m/s².', false),
  
  (6, 2, 'ESSAY', 'Hard', 5, 'Explain Newton\'s First Law of Motion and provide a real-world example.', 
   null, 'An object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force.', 'Newton\'s First Law, also known as the law of inertia, states that objects resist changes in their motion. Example: A book on a table remains at rest until someone pushes it.', false);

-- Biology questions
insert into public.exam_questions (exam_id, position, type, difficulty, points, prompt, options, correct_answer, explanation, ai_generated) values
  (7, 1, 'MCQ', 'Medium', 2, 'Which organelle is responsible for photosynthesis in plant cells?', 
   '[{"key":"A","text":"Mitochondria"},{"key":"B","text":"Chloroplast"},{"key":"C","text":"Nucleus"},{"key":"D","text":"Ribosome"}]', 
   'B', 'Chloroplasts contain chlorophyll and are the sites where photosynthesis occurs in plant cells.', true),
  
  (7, 2, 'TRUE_FALSE', 'Easy', 1, 'DNA is found only in the nucleus of eukaryotic cells.', 
   '[{"key":"T","text":"True"},{"key":"F","text":"False"}]', 
   'F', 'DNA is found in the nucleus, but also in mitochondria and chloroplasts of eukaryotic cells.', true);

-- Grade 5 Math Quiz questions
insert into public.exam_questions (exam_id, position, type, difficulty, points, prompt, options, correct_answer, explanation, ai_generated) values
  (8, 1, 'MCQ', 'Easy', 2, 'What is 15 + 27?', 
   '[{"key":"A","text":"42"},{"key":"B","text":"41"},{"key":"C","text":"43"},{"key":"D","text":"40"}]', 
   'A', '15 + 27 = 42', false),
  
  (8, 2, 'MCQ', 'Easy', 2, 'What is 1/2 + 1/4?', 
   '[{"key":"A","text":"2/6"},{"key":"B","text":"3/4"},{"key":"C","text":"1/6"},{"key":"D","text":"2/4"}]', 
   'B', '1/2 + 1/4 = 2/4 + 1/4 = 3/4', false);

-- Grade 5 Science Test questions
insert into public.exam_questions (exam_id, position, type, difficulty, points, prompt, options, correct_answer, explanation, ai_generated) values
  (9, 1, 'MCQ', 'Easy', 2, 'What do plants need to make their own food?', 
   '[{"key":"A","text":"Sunlight and water"},{"key":"B","text":"Only water"},{"key":"C","text":"Only sunlight"},{"key":"D","text":"Soil only"}]', 
   'A', 'Plants need sunlight, water, and carbon dioxide to make food through photosynthesis.', false),
  
  (9, 2, 'TRUE_FALSE', 'Easy', 1, 'All animals eat plants.', 
   '[{"key":"T","text":"True"},{"key":"F","text":"False"}]', 
   'F', 'Some animals eat plants (herbivores), some eat meat (carnivores), and some eat both (omnivores).', false);

-- EXAM SUBMISSIONS (student attempts)
insert into public.exam_submissions (exam_id, student_id, attempt_number, submitted_at, status, score_percent, total_points, earned_points, file_name, file_size_bytes) values
  (5, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, '2025-01-15 11:45:00+00', 'Graded', 85.00, 6, 5.1, null, null),
  (6, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, '2025-01-16 16:30:00+00', 'Graded', 72.00, 8, 5.76, null, null),
  (7, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, '2025-01-22 10:50:00+00', 'Graded', 91.00, 3, 2.73, null, null),
  (1, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, '2025-01-15 14:30:00+00', 'Pending', null, null, null, 'algebra_final_john_smith.pdf', 2457600),
  (2, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1, '2025-01-15 10:30:00+00', 'Graded', 92.00, 10, 9.2, 'geometry_quiz_sarah.pdf', 1887436),
  (3, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1, '2025-01-14 10:15:00+00', 'Reviewed', 78.00, 15, 11.7, 'calculus_midterm_mike.pdf', 3355443),
  (4, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1, '2025-01-13 13:45:00+00', 'Pending', null, null, null, 'stats_quiz_emma.pdf', 1572864);

-- SUBMISSION ANSWERS (for graded submissions)
insert into public.submission_answers (submission_id, question_id, selected_key, answer_text, is_correct, earned_points, auto_graded) values
  -- Saiq's Math Quiz answers
  (1, 1, 'B', null, true, 2, true),
  (1, 2, 'T', null, true, 1, true),
  (1, 3, null, '40 square cm', true, 2.1, false),
  
  -- Saiq's Physics answers
  (2, 4, 'A', null, true, 3, true),
  (2, 5, null, 'Newton\'s first law states that objects at rest stay at rest unless acted upon by a force. Example: a ball rolling on grass eventually stops due to friction.', true, 2.76, false),
  
  -- Saiq's Biology answers
  (3, 6, 'B', null, true, 2, true),
  (3, 7, 'F', null, true, 1, true);

-- STUDENT EXAM STATS (aggregated performance)
insert into public.student_exam_stats (student_id, subject_id, exams_taken, highest_score, lowest_score, average_score, last_exam_date) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 1, 85.00, 85.00, 85.00, '2025-01-15'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 1, 72.00, 72.00, 72.00, '2025-01-16'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 1, 91.00, 91.00, 91.00, '2025-01-22'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 7, 1, 92.00, 92.00, 92.00, '2025-01-15'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 8, 1, 78.00, 78.00, 78.00, '2025-01-14');

-- ANNOUNCEMENTS (Board updates)
insert into public.announcements (admin_id, grade_level, title, priority, body) values
  ('11111111-1111-1111-1111-111111111111', 10, 'Holiday', 'high', 'Tomorrow is public holiday'),
  ('22222222-2222-2222-2222-222222222222', 11, 'New Study Materials Available', 'high', 'New study materials for Calculus have been uploaded to the resource center. Please check them out before the upcoming exam on January 22nd.'),
  ('33333333-3333-3333-3333-333333333333', 10, 'Office Hours Reminder', 'normal', 'Reminder: Office hours are available every Tuesday and Thursday from 3-5 PM in room 204. Feel free to drop by if you need help with any math topics.'),
  ('44444444-4444-4444-4444-444444444444', 12, 'Exam Schedule Update', 'urgent', 'The midterm exam schedule has been updated. Please check your student portal for the latest dates and times. Make sure to prepare accordingly.'),
  ('11111111-1111-1111-1111-111111111111', 9, 'Lab Safety Training', 'normal', 'All students must complete lab safety training before participating in chemistry experiments.'),
  ('22222222-2222-2222-2222-222222222222', 8, 'Parent-Teacher Conference', 'normal', 'Parent-teacher conferences are scheduled for next week. Please check your email for appointment times.');

-- ANNOUNCEMENT LIKES
insert into public.announcement_likes (announcement_id, user_id) values
  (1, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  (1, 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
  (2, 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  (2, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  (3, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  (4, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  (4, 'dddddddd-dddd-dddd-dddd-dddddddddddd');

-- ANNOUNCEMENT COMMENTS
insert into public.announcement_comments (announcement_id, user_id, comment) values
  (1, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Thanks for the update!'),
  (2, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Where can I find the new materials?'),
  (2, '22222222-2222-2222-2222-222222222222', 'Check the resource center under Calculus section.'),
  (3, 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'What topics will be covered during office hours?'),
  (4, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'When will the new schedule be available?');

-- Q&A FORUM QUESTIONS
insert into public.questions (grade_level, subject_id, author_id, title, body) values
  (10, 1, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Help with Quadratic Equations', 'I\'m struggling with solving quadratic equations using the quadratic formula. Can someone explain the steps clearly?'),
  (11, 2, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Physics Problem - Projectile Motion', 'How do I calculate the maximum height of a projectile launched at an angle?'),
  (12, 8, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Calculus Integration', 'What\'s the difference between definite and indefinite integrals?'),
  (10, 4, 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Cell Division Question', 'Can someone explain the difference between mitosis and meiosis?'),
  (9, 1, 'gggggggg-gggg-gggg-gggg-gggggggggggg', 'Geometry Proofs', 'I need help understanding how to write geometric proofs. Any tips?');

-- QUESTION LIKES
insert into public.question_likes (question_id, user_id) values
  (1, 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
  (1, '11111111-1111-1111-1111-111111111111'),
  (2, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  (3, 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  (4, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  (5, 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh');

-- QUESTION COMMENTS
insert into public.question_comments (question_id, user_id, comment) values
  (1, '11111111-1111-1111-1111-111111111111', 'The quadratic formula is x = (-b ± √(b²-4ac)) / 2a. Remember to identify a, b, and c from your equation first.'),
  (1, 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Thanks! That helps a lot.'),
  (2, '22222222-2222-2222-2222-222222222222', 'Use the formula h = (v₀sinθ)²/(2g) where v₀ is initial velocity, θ is launch angle, and g is gravity.'),
  (3, '44444444-4444-4444-4444-444444444444', 'Definite integrals have limits and give a numerical value, while indefinite integrals include a constant of integration.'),
  (4, '11111111-1111-1111-1111-111111111111', 'Mitosis produces identical diploid cells for growth, while meiosis produces genetically diverse haploid gametes for reproduction.'),
  (5, '33333333-3333-3333-3333-333333333333', 'Start with what you know (given information), then use logical steps with geometric theorems to reach your conclusion.');

-- SCHEDULES (Admin schedules)
insert into public.schedules (admin_id, title, type, subject_id, grade_level, date, start_time, end_time, location) values
  ('11111111-1111-1111-1111-111111111111', 'Calculus Quiz', 'Exam', 8, 12, '2025-01-16', '14:00:00', '15:00:00', 'Room 101'),
  ('11111111-1111-1111-1111-111111111111', 'Physics Lab Test', 'Exam', 2, 11, '2025-01-16', '15:30:00', '16:30:00', 'Lab 2'),
  ('11111111-1111-1111-1111-111111111111', 'Staff Meeting', 'Meeting', null, null, '2025-01-16', '16:00:00', '17:00:00', 'Conference Room'),
  ('22222222-2222-2222-2222-222222222222', 'Statistics Review', 'Class', 6, 11, '2025-01-17', '10:00:00', '11:00:00', 'Room 205'),
  ('33333333-3333-3333-3333-333333333333', 'Geometry Workshop', 'Class', 7, 10, '2025-01-17', '13:00:00', '14:00:00', 'Room 103'),
  ('44444444-4444-4444-4444-444444444444', 'Calculus Office Hours', 'Other', 8, 12, '2025-01-17', '15:00:00', '16:00:00', 'Room 301');

-- STUDENT ACHIEVEMENTS (progress tracking)
insert into public.student_achievements (student_id, achievement_id, earned, progress_value, earned_at) values
  -- Saiq's achievements
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, true, 1, '2025-01-15 11:45:00+00'), -- First Steps
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, true, 100, '2025-01-22 10:50:00+00'), -- Perfect Score (91% rounded up for demo)
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, false, 3, null), -- Consistent Performer (3/5)
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5, false, 8, null), -- Improvement Champion (8/15)
  
  -- John's achievements
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, true, 1, '2025-01-15 14:30:00+00'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 3, false, 1, null),
  
  -- Sarah's achievements
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 1, true, 1, '2025-01-15 10:30:00+00'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 3, false, 1, null),
  
  -- Mike's achievements
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 1, true, 1, '2025-01-14 10:15:00+00'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 3, false, 1, null);

-- DAILY METRICS (for admin dashboard)
insert into public.metrics_daily (snapshot_date, total_students, active_exams, avg_score, pending_reviews) values
  ('2025-01-15', 1330, 673, 85.0, 204),
  ('2025-01-14', 1318, 668, 84.2, 198),
  ('2025-01-13', 1315, 665, 83.8, 195),
  ('2025-01-12', 1312, 662, 83.5, 201),
  ('2025-01-11', 1308, 658, 83.1, 189);

-- Add some subject-specific achievements for Math Master
insert into public.achievement_definitions (code, name, description, target_value, subject_id) values
  ('MATH_MASTER','Math Master','Complete 10 math exams',10, 1)
on conflict (code) do nothing;

-- Add Math Master progress for students
insert into public.student_achievements (student_id, achievement_id, earned, progress_value) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 6, false, 7) -- 7/10 math exams
on conflict (student_id, achievement_id) do nothing;