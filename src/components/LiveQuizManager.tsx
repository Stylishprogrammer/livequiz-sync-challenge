import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Play, Square, Clock, Users, Trophy, HelpCircle, Settings } from 'lucide-react';
import { LiveQuizControl } from './LiveQuizControl';

interface Quiz {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

interface LiveSession {
  id: string;
  quiz_id: string;
  is_question_active: boolean;
  current_question_id?: string;
  created_at: string;
  quiz: Quiz;
}

interface Question {
  id: string;
  question_text: string;
  time_limit: number;
  subject: {
    name: string;
  };
}

export function LiveQuizManager() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [activeSessions, setActiveSessions] = useState<LiveSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuizzes();
    fetchActiveSessions();
  }, []);

  const fetchQuizzes = async () => {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch quizzes",
        variant: "destructive"
      });
    } else {
      setQuizzes(data || []);
    }
  };

  const fetchActiveSessions = async () => {
    const { data, error } = await supabase
      .from('live_quiz_sessions')
      .select(`
        *,
        quiz:quizzes(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error", 
        description: "Failed to fetch live sessions",
        variant: "destructive"
      });
    } else {
      setActiveSessions(data || []);
    }
  };

  const startLiveQuiz = async () => {
    if (!selectedQuizId) {
      toast({
        title: "Error",
        description: "Please select a quiz to start",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('live_quiz_sessions')
        .insert({
          quiz_id: selectedQuizId
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Live quiz session started successfully!"
      });

      setSelectedQuizId('');
      fetchActiveSessions();
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

  const stopLiveQuiz = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('live_quiz_sessions')
        .update({ 
          is_question_active: false,
          current_question_id: null
        })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Live quiz session stopped"
      });

      fetchActiveSessions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          Live Quiz Control
        </h2>
        <p className="text-muted-foreground">Start and manage live quiz sessions for real-time competition</p>
      </div>

      {/* Start New Quiz Session */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Start Live Quiz Session
          </CardTitle>
          <CardDescription>
            Select a quiz to start a new live session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a quiz to start" />
                </SelectTrigger>
                <SelectContent>
                  {quizzes.map((quiz) => (
                    <SelectItem key={quiz.id} value={quiz.id}>
                      {quiz.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={startLiveQuiz}
              disabled={!selectedQuizId || loading}
              className="quiz-button-primary"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Live Quiz
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Active Quiz Sessions
          </CardTitle>
          <CardDescription>
            Manage currently running live quiz sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeSessions.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-semibold mb-2">No active sessions</h4>
              <p className="text-muted-foreground">
                Start a live quiz session to begin real-time competition
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <h4 className="font-semibold">{session.quiz?.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {session.quiz?.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant={session.is_question_active ? "default" : "secondary"}>
                        {session.is_question_active ? "Active" : "Inactive"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Started: {new Date(session.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => setSelectedSessionId(session.id)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Control Session
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => stopLiveQuiz(session.id)}
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop Session
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
         </CardContent>
      </Card>

      {/* Live Quiz Control Interface */}
      {selectedSessionId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Active Session Control
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedSessionId('')}
                className="ml-auto"
              >
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LiveQuizControl sessionId={selectedSessionId} />
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Quizzes</span>
            </div>
            <div className="text-2xl font-bold mt-2">{quizzes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Active Sessions</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {activeSessions.filter(s => s.is_question_active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Sessions</span>
            </div>
            <div className="text-2xl font-bold mt-2">{activeSessions.length}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}