import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  Eye, 
  SkipForward, 
  Clock, 
  Users, 
  Trophy, 
  CheckCircle, 
  XCircle,
  Activity
} from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  time_limit: number;
  correct_answer_index: number | null;
  options: { id: string; option_text: string; option_index: number }[];
  subject: { name: string };
}

interface LiveSession {
  id: string;
  quiz_id: string;
  is_question_active: boolean;
  current_question_id?: string;
  show_answers: boolean;
  question_start_time?: string;
  quiz: { title: string; description: string };
}

interface SchoolResponse {
  id: string;
  school_id: string;
  selected_option_index: number | null;
  is_correct: boolean;
  response_time_ms: number;
  schools: { school_name: string } | null;
}

interface LiveQuizControlProps {
  sessionId: string;
}

export function LiveQuizControl({ sessionId }: LiveQuizControlProps) {
  const [session, setSession] = useState<LiveSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
  const [responses, setResponses] = useState<SchoolResponse[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [loading, setLoading] = useState(false);
  const [audioTimer, setAudioTimer] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSession();
    fetchQuestions();
    subscribeToSession();
    subscribeToResponses();
    
    // Initialize audio timer
    const audio = new Audio('/assets/30sec_timer.mp3');
    audio.preload = 'auto';
    audio.volume = 0.7;
    setAudioTimer(audio);
    
    return () => {
      // Cleanup audio on unmount
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [sessionId]);

  useEffect(() => {
    if (session?.current_question_id) {
      fetchCurrentQuestion(session.current_question_id);
    }
  }, [session?.current_question_id]);

  const fetchSession = async () => {
    const { data, error } = await supabase
      .from('live_quiz_sessions')
      .select(`
        *,
        quiz:quizzes(title, description)
      `)
      .eq('id', sessionId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch session details",
        variant: "destructive"
      });
    } else {
      setSession(data);
    }
  };

  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from('questions')
      .select(`
        *,
        options:question_options(*),
        subject:subjects(name)
      `)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching questions:', error);
    } else {
      const formattedQuestions = data.map(q => ({
        ...q,
        options: q.options.sort((a: any, b: any) => a.option_index - b.option_index)
      }));
      setQuestions(formattedQuestions);
    }
  };

  const fetchCurrentQuestion = async (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      setCurrentQuestion(question);
      setSelectedQuestionId(questionId);
    }
  };

  const subscribeToSession = () => {
    const channel = supabase
      .channel('admin-session-control')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_quiz_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          if (payload.new) {
            const sessionData = payload.new as any;
            setSession(sessionData);
            if (sessionData.question_start_time) {
              startClientTimer(new Date(sessionData.question_start_time));
            }
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const subscribeToResponses = () => {
    const channel = supabase
      .channel('quiz-responses')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quiz_responses',
          filter: `quiz_id=eq.${sessionId}`
        },
        () => {
          fetchResponses();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const fetchResponses = async () => {
    if (!currentQuestion) return;

    const { data, error } = await supabase
      .from('quiz_responses')
      .select(`
        id,
        school_id,
        selected_option_index,
        is_correct,
        response_time_ms,
        schools!inner(school_name)
      `)
      .eq('quiz_id', sessionId)
      .eq('question_id', currentQuestion.id);

    if (!error && data) {
      const formattedResponses: SchoolResponse[] = data.map(item => ({
        id: item.id,
        school_id: item.school_id,
        selected_option_index: item.selected_option_index,
        is_correct: item.is_correct,
        response_time_ms: item.response_time_ms,
        schools: Array.isArray(item.schools) && item.schools.length > 0 
          ? item.schools[0] 
          : { school_name: 'Unknown School' }
      }));
      setResponses(formattedResponses);
    }
  };

  const startClientTimer = (startTime: Date) => {
    const updateTimer = () => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const remaining = Math.max(0, 30 - elapsed);
      setTimeRemaining(remaining);

      if (remaining > 0) {
        setTimeout(updateTimer, 1000);
      } else {
        // Timer finished - automatically stop the question
        if (audioTimer) {
          audioTimer.pause();
          audioTimer.currentTime = 0;
        }
        
        // Automatically stop the question when timer reaches 0
        supabase
          .from('live_quiz_sessions')
          .update({
            is_question_active: false
          })
          .eq('id', sessionId)
          .then(() => {
            toast({
              title: "Time's Up!",
              description: "Question timer has ended automatically"
            });
          });
      }
    };
    updateTimer();
  };

  const startQuestion = async () => {
    if (!selectedQuestionId) {
      toast({
        title: "Error",
        description: "Please select a question first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await supabase
        .from('live_quiz_sessions')
        .update({
          current_question_id: selectedQuestionId,
          is_question_active: true,
          show_answers: false,
          question_start_time: new Date().toISOString()
        })
        .eq('id', sessionId);

      // Play the 30-second timer audio
      if (audioTimer) {
        audioTimer.currentTime = 0; // Reset to beginning
        audioTimer.play().catch(error => {
          console.error('Error playing timer audio:', error);
          toast({
            title: "Audio Warning",
            description: "Timer audio couldn't play. Please check your browser settings.",
            variant: "default"
          });
        });
      }

      toast({
        title: "Question Started",
        description: "30-second timer has begun for all schools"
      });

      fetchResponses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const stopQuestion = async () => {
    try {
      // Stop audio timer if playing
      if (audioTimer) {
        audioTimer.pause();
        audioTimer.currentTime = 0;
      }

      await supabase
        .from('live_quiz_sessions')
        .update({
          is_question_active: false
        })
        .eq('id', sessionId);

      toast({
        title: "Question Stopped",
        description: "Timer stopped - no more answers accepted"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const showAnswers = async () => {
    try {
      // Stop audio timer if playing
      if (audioTimer) {
        audioTimer.pause();
        audioTimer.currentTime = 0;
      }

      await supabase
        .from('live_quiz_sessions')
        .update({
          show_answers: true,
          is_question_active: false
        })
        .eq('id', sessionId);

      toast({
        title: "Answers Revealed",
        description: "Correct answers are now visible to all schools"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getProgressPercentage = () => {
    return ((30 - timeRemaining) / 30) * 100;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6" />
          Live Quiz Control
        </h2>
        <p className="text-muted-foreground">
          Control the live quiz session: {session?.quiz?.title}
        </p>
      </div>

      {/* Question Selection & Control */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Question Control Panel
          </CardTitle>
          <CardDescription>
            Select and control questions during the live session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question Selector */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={selectedQuestionId} onValueChange={setSelectedQuestionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select next question" />
                </SelectTrigger>
                <SelectContent>
                  {questions.map((question) => (
                    <SelectItem key={question.id} value={question.id}>
                      {question.subject.name}: {question.question_text.slice(0, 50)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              onClick={startQuestion}
              disabled={!selectedQuestionId || loading || session?.is_question_active}
              className="quiz-button-primary"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Question
            </Button>
          </div>

          {/* Current Question Display */}
          {currentQuestion && (
            <div className="space-y-4 p-4 bg-secondary/20 rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Current Question</h3>
                <Badge variant={session?.is_question_active ? "default" : "secondary"}>
                  {session?.is_question_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <p className="text-lg">{currentQuestion.question_text}</p>
              
              {/* Timer Display */}
              {session?.is_question_active && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Time Remaining</span>
                    <span className={`text-2xl font-bold ${
                      timeRemaining <= 5 ? 'text-red-500 animate-pulse' : 
                      timeRemaining <= 10 ? 'text-orange-500' : 'text-green-500'
                    }`}>
                      {timeRemaining}s
                    </span>
                  </div>
                  <Progress value={getProgressPercentage()} className="h-3" />
                </div>
              )}

              {/* Options Display */}
              <div className="grid grid-cols-2 gap-2">
                {currentQuestion.options.map((option) => (
                  <div
                    key={option.id}
                    className={`p-3 rounded border-2 ${
                      session?.show_answers && option.option_index === currentQuestion.correct_answer_index
                        ? 'bg-green-100 border-green-500 text-green-800'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                        {String.fromCharCode(65 + option.option_index)}
                      </div>
                      <span className="text-sm">{option.option_text}</span>
                      {session?.show_answers && option.option_index === currentQuestion.correct_answer_index && (
                        <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Control Buttons */}
              <div className="flex gap-2">
                {session?.is_question_active && (
                  <Button onClick={stopQuestion} variant="outline" size="sm">
                    <Pause className="h-4 w-4 mr-2" />
                    Stop Timer
                  </Button>
                )}
                
                {!session?.show_answers && (
                  <Button onClick={showAnswers} variant="secondary" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Reveal Answers
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Responses */}
      {currentQuestion && (
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Live Responses ({responses.length})
            </CardTitle>
            <CardDescription>
              Real-time responses from schools for current question
            </CardDescription>
          </CardHeader>
          <CardContent>
            {responses.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Waiting for school responses...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {responses.map((response) => (
                  <div
                    key={response.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        response.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {response.is_correct ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{response.schools?.school_name || 'Unknown School'}</div>
                        <div className="text-sm text-muted-foreground">
                          Answer: {response.selected_option_index !== null 
                            ? String.fromCharCode(65 + response.selected_option_index)
                            : 'No answer'
                          } • {(response.response_time_ms / 1000).toFixed(1)}s
                        </div>
                      </div>
                    </div>
                    <Badge variant={response.is_correct ? "default" : "destructive"}>
                      {response.is_correct ? '+10' : '0'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}