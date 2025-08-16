import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, SkipForward, Eye, Users, Clock, Trophy } from 'lucide-react';

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
}

interface School {
  id: string;
  name: string;
  score: number;
  isConnected: boolean;
  lastSeen: Date;
  currentAnswer?: number;
  responseTime?: number;
}

interface AdminDashboardProps {
  onQuestionStart: (question: Question) => void;
  onRevealAnswer: () => void;
  onNextQuestion: () => void;
}

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: 1,
    text: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2,
    timeLimit: 30
  },
  {
    id: 2,
    text: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1,
    timeLimit: 25
  },
  {
    id: 3,
    text: "What is 12 × 8?",
    options: ["84", "96", "108", "92"],
    correctAnswer: 1,
    timeLimit: 20
  }
];

const SAMPLE_SCHOOLS: School[] = [
  { id: '1', name: 'Riverside High School', score: 95, isConnected: true, lastSeen: new Date() },
  { id: '2', name: 'Oak Valley Academy', score: 87, isConnected: true, lastSeen: new Date() },
  { id: '3', name: 'Mountain View School', score: 82, isConnected: false, lastSeen: new Date(Date.now() - 300000) },
  { id: '4', name: 'Sunset Elementary', score: 78, isConnected: true, lastSeen: new Date() },
];

export function AdminDashboard({ onQuestionStart, onRevealAnswer, onNextQuestion }: AdminDashboardProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isQuestionActive, setIsQuestionActive] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [schools, setSchools] = useState<School[]>(SAMPLE_SCHOOLS);

  const currentQuestion = SAMPLE_QUESTIONS[currentQuestionIndex];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isQuestionActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsQuestionActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isQuestionActive, timeRemaining]);

  const handleStartQuestion = () => {
    if (currentQuestion) {
      setTimeRemaining(currentQuestion.timeLimit);
      setIsQuestionActive(true);
      setShowAnswers(false);
      onQuestionStart(currentQuestion);
      
      // Simulate random school responses
      setTimeout(() => {
        setSchools(prev => prev.map(school => ({
          ...school,
          currentAnswer: Math.floor(Math.random() * 4),
          responseTime: Math.floor(Math.random() * 15000) + 2000
        })));
      }, 3000);
    }
  };

  const handleRevealAnswer = () => {
    setShowAnswers(true);
    setIsQuestionActive(false);
    onRevealAnswer();
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < SAMPLE_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowAnswers(false);
      setTimeRemaining(0);
      onNextQuestion();
    }
  };

  const getProgressPercentage = () => {
    if (!currentQuestion) return 0;
    return ((currentQuestion.timeLimit - timeRemaining) / currentQuestion.timeLimit) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Live Quiz Admin</h1>
            <p className="text-muted-foreground">Question {currentQuestionIndex + 1} of {SAMPLE_QUESTIONS.length}</p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span className="font-semibold">{schools.filter(s => s.isConnected).length} schools online</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Question Control Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Question Control Panel
              </CardTitle>
              <CardDescription>
                Manage the current question and timing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentQuestion && (
                <div className="space-y-4">
                  <div className="p-4 bg-secondary/20 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3">{currentQuestion.text}</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {currentQuestion.options.map((option, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border text-center transition-all ${
                            showAnswers && index === currentQuestion.correctAnswer
                              ? 'bg-green-100 border-green-500 text-green-800'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          {String.fromCharCode(65 + index)}. {option}
                        </div>
                      ))}
                    </div>
                  </div>

                  {isQuestionActive && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Time Remaining</span>
                        <span className="font-mono">{timeRemaining}s</span>
                      </div>
                      <Progress value={getProgressPercentage()} className="h-3" />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={handleStartQuestion}
                      disabled={isQuestionActive}
                      className="quiz-button-primary"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Question
                    </Button>
                    
                    <Button
                      onClick={handleRevealAnswer}
                      disabled={!isQuestionActive && timeRemaining === 0 && !showAnswers}
                      variant="outline"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Reveal Answer
                    </Button>
                    
                    <Button
                      onClick={handleNextQuestion}
                      disabled={currentQuestionIndex >= SAMPLE_QUESTIONS.length - 1 || !showAnswers}
                      variant="outline"
                    >
                      <SkipForward className="h-4 w-4 mr-2" />
                      Next Question
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Question Statistics */}
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle>Question Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {currentQuestion?.options.map((option, index) => {
                  const responses = schools.filter(s => s.currentAnswer === index).length;
                  const percentage = schools.length > 0 ? (responses / schools.length) * 100 : 0;
                  
                  return (
                    <div key={index} className="text-center space-y-2">
                      <div className={`h-20 rounded-lg flex items-end justify-center ${
                        showAnswers && index === currentQuestion.correctAnswer 
                          ? 'bg-green-200' 
                          : 'bg-gray-100'
                      }`}>
                        <div 
                          className={`w-full rounded-lg transition-all duration-1000 ${
                            showAnswers && index === currentQuestion.correctAnswer
                              ? 'bg-green-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ height: `${percentage}%`, minHeight: '4px' }}
                        />
                      </div>
                      <div className="text-sm">
                        <div className="font-semibold">{String.fromCharCode(65 + index)}</div>
                        <div className="text-muted-foreground">{responses} ({percentage.toFixed(0)}%)</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Leaderboard */}
        <div className="space-y-6">
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Live Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {schools
                  .sort((a, b) => b.score - a.score)
                  .map((school, index) => (
                    <div key={school.id} className="flex items-center justify-between p-3 rounded-lg bg-white/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{school.name}</div>
                          <div className="flex items-center gap-2">
                            <Badge variant={school.isConnected ? "default" : "secondary"}>
                              {school.isConnected ? "Online" : "Offline"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{school.score}</div>
                        {school.responseTime && (
                          <div className="text-xs text-muted-foreground">
                            {(school.responseTime / 1000).toFixed(1)}s
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}