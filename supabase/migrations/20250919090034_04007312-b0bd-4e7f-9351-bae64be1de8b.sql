-- Create sample subjects first
INSERT INTO public.subjects (name, description) VALUES
('Mathematics', 'Basic math questions'),
('Science', 'Science and physics questions'),
('History', 'World history questions'),
('Geography', 'World geography questions')
ON CONFLICT (name) DO NOTHING;

-- Create sample quizzes
INSERT INTO public.quizzes (title, description, created_by, is_active) VALUES
('Mathematics Quiz - Basic', 'Test your basic math skills', (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1), true),
('Science Challenge', 'Physics and chemistry questions', (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1), true),
('World Geography', 'Countries and capitals', (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1), true),
('History Trivia', 'Important historical events', (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1), true);

-- Create sample questions for Mathematics Quiz
INSERT INTO public.questions (question_text, subject_id, correct_answer_index, time_limit, created_by, question_type) VALUES
('What is 15 + 27?', (SELECT id FROM subjects WHERE name = 'Mathematics' LIMIT 1), 1, 30, (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1), 'multiple_choice'),
('What is the square root of 64?', (SELECT id FROM subjects WHERE name = 'Mathematics' LIMIT 1), 0, 30, (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1), 'multiple_choice'),
('If a triangle has angles of 60°, 60°, and 60°, what type of triangle is it?', (SELECT id FROM subjects WHERE name = 'Mathematics' LIMIT 1), 2, 30, (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1), 'multiple_choice');

-- Create sample questions for Science Challenge
INSERT INTO public.questions (question_text, subject_id, correct_answer_index, time_limit, created_by, question_type) VALUES
('What is the chemical symbol for gold?', (SELECT id FROM subjects WHERE name = 'Science' LIMIT 1), 1, 30, (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1), 'multiple_choice'),
('How many planets are in our solar system?', (SELECT id FROM subjects WHERE name = 'Science' LIMIT 1), 3, 30, (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1), 'multiple_choice'),
('What gas do plants absorb from the atmosphere during photosynthesis?', (SELECT id FROM subjects WHERE name = 'Science' LIMIT 1), 0, 30, (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1), 'multiple_choice');

-- Create sample questions for Geography
INSERT INTO public.questions (question_text, subject_id, correct_answer_index, time_limit, created_by, question_type) VALUES
('What is the capital of Japan?', (SELECT id FROM subjects WHERE name = 'Geography' LIMIT 1), 2, 30, (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1), 'multiple_choice'),
('Which is the largest continent by area?', (SELECT id FROM subjects WHERE name = 'Geography' LIMIT 1), 1, 30, (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1), 'multiple_choice'),
('What is the longest river in the world?', (SELECT id FROM subjects WHERE name = 'Geography' LIMIT 1), 0, 30, (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1), 'multiple_choice');

-- Create sample questions for History
INSERT INTO public.questions (question_text, subject_id, correct_answer_index, time_limit, created_by, question_type) VALUES
('In which year did World War II end?', (SELECT id FROM subjects WHERE name = 'History' LIMIT 1), 1, 30, (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1), 'multiple_choice'),
('Who was the first person to walk on the moon?', (SELECT id FROM subjects WHERE name = 'History' LIMIT 1), 0, 30, (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1), 'multiple_choice'),
('Which ancient wonder of the world was located in Alexandria?', (SELECT id FROM subjects WHERE name = 'History' LIMIT 1), 3, 30, (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1), 'multiple_choice');

-- Now let's add the answer options for each question
-- Math Question 1: What is 15 + 27?
INSERT INTO public.question_options (question_id, option_text, option_index) VALUES
((SELECT id FROM questions WHERE question_text = 'What is 15 + 27?' LIMIT 1), '41', 0),
((SELECT id FROM questions WHERE question_text = 'What is 15 + 27?' LIMIT 1), '42', 1),
((SELECT id FROM questions WHERE question_text = 'What is 15 + 27?' LIMIT 1), '43', 2),
((SELECT id FROM questions WHERE question_text = 'What is 15 + 27?' LIMIT 1), '44', 3);

-- Math Question 2: What is the square root of 64?
INSERT INTO public.question_options (question_id, option_text, option_index) VALUES
((SELECT id FROM questions WHERE question_text = 'What is the square root of 64?' LIMIT 1), '8', 0),
((SELECT id FROM questions WHERE question_text = 'What is the square root of 64?' LIMIT 1), '6', 1),
((SELECT id FROM questions WHERE question_text = 'What is the square root of 64?' LIMIT 1), '7', 2),
((SELECT id FROM questions WHERE question_text = 'What is the square root of 64?' LIMIT 1), '9', 3);

-- Math Question 3: Triangle type
INSERT INTO public.question_options (question_id, option_text, option_index) VALUES
((SELECT id FROM questions WHERE question_text LIKE 'If a triangle has angles of 60°, 60°, and 60°%' LIMIT 1), 'Right triangle', 0),
((SELECT id FROM questions WHERE question_text LIKE 'If a triangle has angles of 60°, 60°, and 60°%' LIMIT 1), 'Isosceles triangle', 1),
((SELECT id FROM questions WHERE question_text LIKE 'If a triangle has angles of 60°, 60°, and 60°%' LIMIT 1), 'Equilateral triangle', 2),
((SELECT id FROM questions WHERE question_text LIKE 'If a triangle has angles of 60°, 60°, and 60°%' LIMIT 1), 'Scalene triangle', 3);

-- Science Question 1: Chemical symbol for gold
INSERT INTO public.question_options (question_id, option_text, option_index) VALUES
((SELECT id FROM questions WHERE question_text = 'What is the chemical symbol for gold?' LIMIT 1), 'Go', 0),
((SELECT id FROM questions WHERE question_text = 'What is the chemical symbol for gold?' LIMIT 1), 'Au', 1),
((SELECT id FROM questions WHERE question_text = 'What is the chemical symbol for gold?' LIMIT 1), 'Gd', 2),
((SELECT id FROM questions WHERE question_text = 'What is the chemical symbol for gold?' LIMIT 1), 'Ag', 3);

-- Science Question 2: Number of planets
INSERT INTO public.question_options (question_id, option_text, option_index) VALUES
((SELECT id FROM questions WHERE question_text = 'How many planets are in our solar system?' LIMIT 1), '7', 0),
((SELECT id FROM questions WHERE question_text = 'How many planets are in our solar system?' LIMIT 1), '9', 1),
((SELECT id FROM questions WHERE question_text = 'How many planets are in our solar system?' LIMIT 1), '10', 2),
((SELECT id FROM questions WHERE question_text = 'How many planets are in our solar system?' LIMIT 1), '8', 3);

-- Science Question 3: Photosynthesis gas
INSERT INTO public.question_options (question_id, option_text, option_index) VALUES
((SELECT id FROM questions WHERE question_text LIKE 'What gas do plants absorb%' LIMIT 1), 'Carbon dioxide', 0),
((SELECT id FROM questions WHERE question_text LIKE 'What gas do plants absorb%' LIMIT 1), 'Oxygen', 1),
((SELECT id FROM questions WHERE question_text LIKE 'What gas do plants absorb%' LIMIT 1), 'Nitrogen', 2),
((SELECT id FROM questions WHERE question_text LIKE 'What gas do plants absorb%' LIMIT 1), 'Hydrogen', 3);

-- Geography Question 1: Capital of Japan
INSERT INTO public.question_options (question_id, option_text, option_index) VALUES
((SELECT id FROM questions WHERE question_text = 'What is the capital of Japan?' LIMIT 1), 'Osaka', 0),
((SELECT id FROM questions WHERE question_text = 'What is the capital of Japan?' LIMIT 1), 'Kyoto', 1),
((SELECT id FROM questions WHERE question_text = 'What is the capital of Japan?' LIMIT 1), 'Tokyo', 2),
((SELECT id FROM questions WHERE question_text = 'What is the capital of Japan?' LIMIT 1), 'Hiroshima', 3);

-- Geography Question 2: Largest continent
INSERT INTO public.question_options (question_id, option_text, option_index) VALUES
((SELECT id FROM questions WHERE question_text = 'Which is the largest continent by area?' LIMIT 1), 'Africa', 0),
((SELECT id FROM questions WHERE question_text = 'Which is the largest continent by area?' LIMIT 1), 'Asia', 1),
((SELECT id FROM questions WHERE question_text = 'Which is the largest continent by area?' LIMIT 1), 'North America', 2),
((SELECT id FROM questions WHERE question_text = 'Which is the largest continent by area?' LIMIT 1), 'Europe', 3);

-- Geography Question 3: Longest river
INSERT INTO public.question_options (question_id, option_text, option_index) VALUES
((SELECT id FROM questions WHERE question_text = 'What is the longest river in the world?' LIMIT 1), 'Nile River', 0),
((SELECT id FROM questions WHERE question_text = 'What is the longest river in the world?' LIMIT 1), 'Amazon River', 1),
((SELECT id FROM questions WHERE question_text = 'What is the longest river in the world?' LIMIT 1), 'Mississippi River', 2),
((SELECT id FROM questions WHERE question_text = 'What is the longest river in the world?' LIMIT 1), 'Yangtze River', 3);

-- History Question 1: WWII end
INSERT INTO public.question_options (question_id, option_text, option_index) VALUES
((SELECT id FROM questions WHERE question_text = 'In which year did World War II end?' LIMIT 1), '1944', 0),
((SELECT id FROM questions WHERE question_text = 'In which year did World War II end?' LIMIT 1), '1945', 1),
((SELECT id FROM questions WHERE question_text = 'In which year did World War II end?' LIMIT 1), '1946', 2),
((SELECT id FROM questions WHERE question_text = 'In which year did World War II end?' LIMIT 1), '1943', 3);

-- History Question 2: First moon walker
INSERT INTO public.question_options (question_id, option_text, option_index) VALUES
((SELECT id FROM questions WHERE question_text = 'Who was the first person to walk on the moon?' LIMIT 1), 'Neil Armstrong', 0),
((SELECT id FROM questions WHERE question_text = 'Who was the first person to walk on the moon?' LIMIT 1), 'Buzz Aldrin', 1),
((SELECT id FROM questions WHERE question_text = 'Who was the first person to walk on the moon?' LIMIT 1), 'John Glenn', 2),
((SELECT id FROM questions WHERE question_text = 'Who was the first person to walk on the moon?' LIMIT 1), 'Alan Shepard', 3);

-- History Question 3: Ancient wonder in Alexandria
INSERT INTO public.question_options (question_id, option_text, option_index) VALUES
((SELECT id FROM questions WHERE question_text LIKE '%ancient wonder%Alexandria%' LIMIT 1), 'Colossus of Rhodes', 0),
((SELECT id FROM questions WHERE question_text LIKE '%ancient wonder%Alexandria%' LIMIT 1), 'Hanging Gardens of Babylon', 1),
((SELECT id FROM questions WHERE question_text LIKE '%ancient wonder%Alexandria%' LIMIT 1), 'Great Pyramid of Giza', 2),
((SELECT id FROM questions WHERE question_text LIKE '%ancient wonder%Alexandria%' LIMIT 1), 'Lighthouse of Alexandria', 3);