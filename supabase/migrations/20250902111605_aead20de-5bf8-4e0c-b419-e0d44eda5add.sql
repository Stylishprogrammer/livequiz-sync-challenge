-- Fix security vulnerability: Restrict live quiz session access to participating schools only
-- Drop the overly permissive policy
DROP POLICY "Schools can view live sessions" ON public.live_quiz_sessions;

-- Create a secure policy that only allows schools to view sessions for quizzes they're participating in
CREATE POLICY "Schools can view sessions they participate in" 
ON public.live_quiz_sessions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM public.school_users su
    JOIN public.quiz_participants qp ON su.school_id = qp.school_id
    WHERE su.user_id = auth.uid() 
      AND qp.quiz_id = live_quiz_sessions.quiz_id
  )
);