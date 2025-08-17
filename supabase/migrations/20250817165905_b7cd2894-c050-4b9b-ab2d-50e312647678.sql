-- Create user role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'school');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'school',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create schools table
CREATE TABLE public.schools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create school_users linking table
CREATE TABLE public.school_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, school_id)
);

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create question types enum and table
CREATE TYPE public.question_type AS ENUM ('multiple_choice', 'true_false', 'short_answer');

CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type question_type NOT NULL DEFAULT 'multiple_choice',
  correct_answer_index INTEGER, -- For multiple choice questions
  correct_answer_text TEXT, -- For true/false or short answer
  time_limit INTEGER NOT NULL DEFAULT 60, -- in seconds
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create question options table (for multiple choice questions)
CREATE TABLE public.question_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(question_id, option_index)
);

-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz participants table
CREATE TABLE public.quiz_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  is_connected BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(quiz_id, school_id)
);

-- Create live quiz sessions table
CREATE TABLE public.live_quiz_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  current_question_id UUID REFERENCES public.questions(id),
  question_start_time TIMESTAMP WITH TIME ZONE,
  question_end_time TIMESTAMP WITH TIME ZONE,
  is_question_active BOOLEAN NOT NULL DEFAULT false,
  show_answers BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz responses table
CREATE TABLE public.quiz_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  selected_option_index INTEGER,
  answer_text TEXT,
  is_correct BOOLEAN,
  response_time_ms INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(quiz_id, question_id, school_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Create RLS policies for schools
CREATE POLICY "Anyone can view approved schools" ON public.schools
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Admins can manage all schools" ON public.schools
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "School users can view their own school" ON public.schools
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.school_users 
      WHERE school_users.school_id = schools.id 
      AND school_users.user_id = auth.uid()
    )
  );

-- Create RLS policies for subjects
CREATE POLICY "Anyone can view active subjects" ON public.subjects
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage subjects" ON public.subjects
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create RLS policies for questions
CREATE POLICY "Admins can manage all questions" ON public.questions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "School users can view active questions during quiz" ON public.questions
  FOR SELECT USING (
    is_active = true AND 
    EXISTS (
      SELECT 1 FROM public.live_quiz_sessions lqs
      WHERE lqs.current_question_id = questions.id
    )
  );

-- Create RLS policies for question options
CREATE POLICY "Admins can manage question options" ON public.question_options
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "School users can view options for current question" ON public.question_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.live_quiz_sessions lqs
      WHERE lqs.current_question_id = question_options.question_id
    )
  );

-- Create RLS policies for quizzes
CREATE POLICY "Admins can manage all quizzes" ON public.quizzes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Schools can view active quizzes" ON public.quizzes
  FOR SELECT USING (is_active = true);

-- Create RLS policies for quiz participants
CREATE POLICY "Admins can manage participants" ON public.quiz_participants
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Schools can view their participation" ON public.quiz_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.school_users 
      WHERE school_users.school_id = quiz_participants.school_id 
      AND school_users.user_id = auth.uid()
    )
  );

-- Create RLS policies for live quiz sessions
CREATE POLICY "Admins can manage live sessions" ON public.live_quiz_sessions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Schools can view live sessions" ON public.live_quiz_sessions
  FOR SELECT USING (true);

-- Create RLS policies for quiz responses
CREATE POLICY "Admins can view all responses" ON public.quiz_responses
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Schools can manage their own responses" ON public.quiz_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.school_users 
      WHERE school_users.school_id = quiz_responses.school_id 
      AND school_users.user_id = auth.uid()
    )
  );

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'school')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_live_quiz_sessions_updated_at
  BEFORE UPDATE ON public.live_quiz_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subjects
INSERT INTO public.subjects (name, description) VALUES
  ('Mathematics', 'Mathematical problems and concepts'),
  ('Physics', 'Physics principles and applications'),
  ('Chemistry', 'Chemical reactions and properties'),
  ('Biology', 'Biological systems and life sciences'),
  ('Computer Science', 'Programming and computational thinking'),
  ('General Knowledge', 'Miscellaneous topics and current affairs');