import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, Clock, CheckCircle, XCircle, Trophy, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: string;
  question_text: string;
  time_limit: number;
  correct_answer_index: number | null;
  options: { id: string; option_text: string; option_index: number }[];
}

interface SchoolQuizProps {
  schoolId: string;
  schoolName: string;
  sessionId: string;
}

export function SchoolQuiz({ 
  schoolId,
  schoolName, 
  sessionId
}: SchoolQuizProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isQuestionActive, setIsQuestionActive] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Real-time subscription to live quiz session
  useEffect(() => {
    const channel = supabase
      .channel('live-quiz-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_quiz_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Session update:', payload);
          if (payload.new) {
            const session = payload.new as any;
            setIsQuestionActive(session.is_question_active);
            setShowAnswers(session.show_answers);
            
            if (session.current_question_id && session.is_question_active) {
              fetchCurrentQuestion(session.current_question_id);
              if (session.question_start_time) {
                startTimer(new Date(session.question_start_time));
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Fetch current question when session updates
  const fetchCurrentQuestion = async (questionId: string) => {
    try {
      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .select(`
          *,
          options:question_options(*)
        `)
        .eq('id', questionId)
        .single();

      if (questionError) {
        console.error('Error fetching question:', questionError);
        return;
      }

      if (questionData) {
        const formattedQuestion: Question = {
          id: questionData.id,
          question_text: questionData.question_text,
          time_limit: questionData.time_limit,
          correct_answer_index: questionData.correct_answer_index,
          options: questionData.options.sort((a: any, b: any) => a.option_index - b.option_index)
        };
        setCurrentQuestion(formattedQuestion);
        setQuestionNumber(prev => prev + 1);
        setSelectedAnswer(null);
        setHasSubmitted(false);
        
        // Play timer sound when new question starts
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(e => console.log('Audio play failed:', e));
        }
      }
    } catch (error) {
      console.error('Error in fetchCurrentQuestion:', error);
    }
  };

  // Start 30-second timer
  const startTimer = (startTime: Date) => {
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const remaining = Math.max(0, 30 - elapsed);
    
    setTimeRemaining(remaining);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          // Auto-submit as zero when time runs out
          if (!hasSubmitted) {
            handleTimeExpired();
          }
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          return 0;
        }
        return newTime;
      });
    }, 1000);
  };

  // Handle time expiration - mark as zero
  const handleTimeExpired = async () => {
    if (!currentQuestion || hasSubmitted) return;
    
    setHasSubmitted(true);
    
    try {
      await supabase
        .from('quiz_responses')
        .insert({
          quiz_id: sessionId,
          question_id: currentQuestion.id,
          school_id: schoolId,
          selected_option_index: null, // null indicates no answer
          is_correct: false,
          response_time_ms: 30000, // Full time elapsed
          answer_text: null
        });
        
      toast({
        title: "Time's up!",
        description: "Question marked as incorrect - no answer submitted in time",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Error submitting timeout response:', error);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Update score when answers are revealed
  useEffect(() => {
    if (showAnswers && hasSubmitted && currentQuestion) {
      if (selectedAnswer === currentQuestion.correct_answer_index) {
        setScore(prev => prev + 10);
      }
    }
  }, [showAnswers, selectedAnswer, currentQuestion, hasSubmitted]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (!hasSubmitted && isQuestionActive && timeRemaining > 0) {
      setSelectedAnswer(answerIndex);
    }
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null || hasSubmitted || !currentQuestion || timeRemaining <= 0) return;
    
    setHasSubmitted(true);
    const responseTime = (30 - timeRemaining) * 1000; // Convert to milliseconds
    const isCorrect = selectedAnswer === currentQuestion.correct_answer_index;
    
    try {
      await supabase
        .from('quiz_responses')
        .insert({
          quiz_id: sessionId,
          question_id: currentQuestion.id,
          school_id: schoolId,
          selected_option_index: selectedAnswer,
          is_correct: isCorrect,
          response_time_ms: responseTime,
          answer_text: currentQuestion.options[selectedAnswer]?.option_text || null
        });
        
      toast({
        title: "Answer submitted!",
        description: `Response time: ${responseTime / 1000}s`,
      });
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: "Error",
        description: "Failed to submit answer",
        variant: "destructive"
      });
    }
  };

  const getProgressPercentage = () => {
    return ((30 - timeRemaining) / 30) * 100;
  };

  const getAnswerButtonClass = (index: number) => {
    let baseClass = "p-4 text-left transition-all duration-300 border-2 hover:scale-105";
    
    if (showAnswers) {
      if (index === currentQuestion?.correct_answer_index) {
        return `${baseClass} bg-green-100 border-green-500 text-green-800`;
      } else if (selectedAnswer === index && index !== currentQuestion?.correct_answer_index) {
        return `${baseClass} bg-red-100 border-red-500 text-red-800`;
      } else {
        return `${baseClass} bg-gray-100 border-gray-300 text-gray-600`;
      }
    }
    
    if (selectedAnswer === index) {
      return `${baseClass} bg-blue-100 border-blue-500 text-blue-800`;
    }
    
    // Disable if time expired or already submitted
    if (timeRemaining <= 0 || hasSubmitted) {
      return `${baseClass} bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed`;
    }
    
    return `${baseClass} bg-white border-gray-200 hover:border-blue-300`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Hidden audio element */}
      <audio 
        ref={audioRef}
        src="/assets/30sec_timer.mp3"
        preload="auto"
      />
      
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text">{schoolName}</h1>
            <p className="text-muted-foreground">Live Quiz Participation</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="font-bold text-xl">{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Audio Enabled</span>
            </div>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4 mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 mr-1" />
                  Reconnecting...
                </>
              )}
            </Badge>
          </div>
        </div>
      </div>

      {/* Connection Alert */}
      {!isConnected && (
        <Alert className="glass-card border-yellow-500">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            Connection lost. Your answers are being saved locally and will sync when connection is restored.
          </AlertDescription>
        </Alert>
      )}

      {/* Quiz Content */}
      {currentQuestion ? (
        <div className="space-y-6">
          {/* Question Card */}
          <Card className="glass-card border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Question {questionNumber}
                </CardTitle>
                {isQuestionActive && (
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Time Remaining</div>
                    <div className={`text-2xl font-bold ${timeRemaining <= 5 ? 'text-red-500 animate-pulse' : timeRemaining <= 10 ? 'text-orange-500' : 'text-green-500'}`}>
                      {timeRemaining}s
                    </div>
                    {timeRemaining <= 0 && (
                      <div className="text-xs text-red-600 font-medium">TIME'S UP!</div>
                    )}
                  </div>
                )}
              </div>
              {isQuestionActive && (
                <Progress value={getProgressPercentage()} className="h-3" />
              )}
            </CardHeader>
            <CardContent>
              <h2 className="text-2xl font-semibold mb-6">{currentQuestion.question_text}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswerSelect(option.option_index)}
                    disabled={hasSubmitted || !isQuestionActive || !isConnected || timeRemaining <= 0}
                    className={getAnswerButtonClass(option.option_index)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold">
                        {String.fromCharCode(65 + option.option_index)}
                      </div>
                      <span className="flex-1">{option.option_text}</span>
                      {showAnswers && option.option_index === currentQuestion.correct_answer_index && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {showAnswers && selectedAnswer === option.option_index && option.option_index !== currentQuestion.correct_answer_index && (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Submit Button */}
              {selectedAnswer !== null && !hasSubmitted && isQuestionActive && timeRemaining > 0 && (
                <div className="mt-6 text-center">
                  <Button 
                    onClick={handleSubmitAnswer}
                    className="quiz-button-success px-8 py-3 text-lg"
                    disabled={!isConnected}
                  >
                    Submit Answer ({timeRemaining}s remaining)
                  </Button>
                </div>
              )}
              
              {/* Time Expired Message */}
              {timeRemaining <= 0 && !hasSubmitted && isQuestionActive && (
                <div className="mt-6 text-center">
                  <Badge variant="destructive" className="text-lg px-4 py-2">
                    ⏰ Time Expired - Marked as Incorrect
                  </Badge>
                </div>
              )}

              {/* Status Messages */}
              {hasSubmitted && (
                <div className="mt-6 text-center">
                  <Badge variant="default" className="text-lg px-4 py-2">
                    Answer Submitted!
                  </Badge>
                </div>
              )}

              {showAnswers && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="text-center">
                    <h3 className="font-semibold text-lg mb-2">
                      {selectedAnswer === currentQuestion.correct_answer_index 
                        ? "🎉 Correct!" 
                        : selectedAnswer === null
                        ? "⏰ Time Expired"
                        : "❌ Incorrect"}
                    </h3>
                    <p className="text-muted-foreground">
                      The correct answer was: <strong>
                        {currentQuestion.options.find(opt => opt.option_index === currentQuestion.correct_answer_index)?.option_text}
                      </strong>
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="glass-card border-0">
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">Waiting for next question...</h2>
            <p className="text-muted-foreground">The administrator will start the next question shortly.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}