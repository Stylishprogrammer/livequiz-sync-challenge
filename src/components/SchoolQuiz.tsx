import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, Clock, CheckCircle, XCircle, Trophy } from 'lucide-react';

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
}

interface SchoolQuizProps {
  schoolName: string;
  currentQuestion: Question | null;
  isQuestionActive: boolean;
  timeRemaining: number;
  showAnswers: boolean;
  onAnswerSelect: (answerIndex: number) => void;
}

export function SchoolQuiz({ 
  schoolName, 
  currentQuestion, 
  isQuestionActive, 
  timeRemaining, 
  showAnswers,
  onAnswerSelect 
}: SchoolQuizProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(1);

  // Simulate network status changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.05) { // 5% chance of connection change
        setIsConnected(prev => !prev);
        if (!isConnected) {
          // Simulate reconnection after 3-5 seconds
          setTimeout(() => setIsConnected(true), Math.random() * 2000 + 3000);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isConnected]);

  // Reset state when new question starts
  useEffect(() => {
    if (currentQuestion && isQuestionActive) {
      setSelectedAnswer(null);
      setHasSubmitted(false);
      setQuestionNumber(currentQuestion.id);
    }
  }, [currentQuestion, isQuestionActive]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining === 0 && selectedAnswer !== null && !hasSubmitted) {
      handleSubmitAnswer();
    }
  }, [timeRemaining, selectedAnswer, hasSubmitted]);

  // Update score when answers are revealed
  useEffect(() => {
    if (showAnswers && selectedAnswer !== null && currentQuestion) {
      if (selectedAnswer === currentQuestion.correctAnswer) {
        setScore(prev => prev + 10);
      }
    }
  }, [showAnswers, selectedAnswer, currentQuestion]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (!hasSubmitted && isQuestionActive) {
      setSelectedAnswer(answerIndex);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer !== null && !hasSubmitted) {
      setHasSubmitted(true);
      onAnswerSelect(selectedAnswer);
    }
  };

  const getProgressPercentage = () => {
    if (!currentQuestion) return 100;
    return ((currentQuestion.timeLimit - timeRemaining) / currentQuestion.timeLimit) * 100;
  };

  const getAnswerButtonClass = (index: number) => {
    let baseClass = "p-4 text-left transition-all duration-300 border-2 hover:scale-105";
    
    if (showAnswers) {
      if (index === currentQuestion?.correctAnswer) {
        return `${baseClass} bg-green-100 border-green-500 text-green-800`;
      } else if (selectedAnswer === index && index !== currentQuestion?.correctAnswer) {
        return `${baseClass} bg-red-100 border-red-500 text-red-800`;
      } else {
        return `${baseClass} bg-gray-100 border-gray-300 text-gray-600`;
      }
    }
    
    if (selectedAnswer === index) {
      return `${baseClass} bg-blue-100 border-blue-500 text-blue-800`;
    }
    
    return `${baseClass} bg-white border-gray-200 hover:border-blue-300`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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
                    <div className="text-2xl font-bold text-red-500">{timeRemaining}s</div>
                  </div>
                )}
              </div>
              {isQuestionActive && (
                <Progress value={getProgressPercentage()} className="h-3" />
              )}
            </CardHeader>
            <CardContent>
              <h2 className="text-2xl font-semibold mb-6">{currentQuestion.text}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={hasSubmitted || !isQuestionActive || !isConnected}
                    className={getAnswerButtonClass(index)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="flex-1">{option}</span>
                      {showAnswers && index === currentQuestion.correctAnswer && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {showAnswers && selectedAnswer === index && index !== currentQuestion.correctAnswer && (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Submit Button */}
              {selectedAnswer !== null && !hasSubmitted && isQuestionActive && (
                <div className="mt-6 text-center">
                  <Button 
                    onClick={handleSubmitAnswer}
                    className="quiz-button-success px-8 py-3 text-lg"
                    disabled={!isConnected}
                  >
                    Submit Answer
                  </Button>
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
                      {selectedAnswer === currentQuestion.correctAnswer 
                        ? "🎉 Correct!" 
                        : "❌ Incorrect"}
                    </h3>
                    <p className="text-muted-foreground">
                      The correct answer was: <strong>{currentQuestion.options[currentQuestion.correctAnswer]}</strong>
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