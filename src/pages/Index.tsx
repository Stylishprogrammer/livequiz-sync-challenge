import { useState, useEffect } from 'react';
import { QuizSelector } from '@/components/QuizSelector';
import { AdminDashboard } from '@/components/AdminDashboard';
import { SchoolQuiz } from '@/components/SchoolQuiz';

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
}

const Index = () => {
  const [userRole, setUserRole] = useState<'admin' | 'school' | null>(null);
  const [schoolName, setSchoolName] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isQuestionActive, setIsQuestionActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showAnswers, setShowAnswers] = useState(false);

  const handleRoleSelect = (role: 'admin' | 'school', name?: string) => {
    setUserRole(role);
    if (role === 'school' && name) {
      setSchoolName(name);
    }
  };

  const handleQuestionStart = (question: Question) => {
    setCurrentQuestion(question);
    setIsQuestionActive(true);
    setTimeRemaining(question.timeLimit);
    setShowAnswers(false);
    
    // Auto-stop question when time runs out
    setTimeout(() => {
      setIsQuestionActive(false);
    }, question.timeLimit * 1000);
  };

  const handleRevealAnswer = () => {
    setShowAnswers(true);
    setIsQuestionActive(false);
  };

  const handleNextQuestion = () => {
    setCurrentQuestion(null);
    setIsQuestionActive(false);
    setTimeRemaining(0);
    setShowAnswers(false);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    console.log(`${schoolName} selected answer: ${answerIndex}`);
    // In a real app, this would send the answer to the server
  };

  // Update timer for school view
  useEffect(() => {
    if (isQuestionActive && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsQuestionActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isQuestionActive, timeRemaining]);

  if (!userRole) {
    return <QuizSelector onRoleSelect={handleRoleSelect} />;
  }

  if (userRole === 'admin') {
    return (
      <div className="min-h-screen p-6">
        <AdminDashboard
          onQuestionStart={handleQuestionStart}
          onRevealAnswer={handleRevealAnswer}
          onNextQuestion={handleNextQuestion}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <SchoolQuiz
        schoolName={schoolName}
        currentQuestion={currentQuestion}
        isQuestionActive={isQuestionActive}
        timeRemaining={timeRemaining}
        showAnswers={showAnswers}
        onAnswerSelect={handleAnswerSelect}
      />
    </div>
  );
};

export default Index;
