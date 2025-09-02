-- Fix security vulnerability: Replace overly permissive live quiz session policy
-- First create the secure policy with a different name
CREATE POLICY "Schools can view participating quiz sessions" 
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

-- Now drop the insecure policy
DROP POLICY "Schools can view live sessions" ON public.live_quiz_sessions;