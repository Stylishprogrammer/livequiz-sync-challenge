import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { User, Session } from "@supabase/supabase-js";
import { LogOut, Users, Trophy, Clock } from "lucide-react";

interface School {
  id: string;
  name: string;
  contact_email: string;
  contact_phone: string | null;
  contact_person: string;
  address: string | null;
  is_approved: boolean;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface LiveQuizSession {
  id: string;
  quiz_id: string;
  is_question_active: boolean;
  created_at: string;
  updated_at: string;
}

const SchoolDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [liveQuizSessions, setLiveQuizSessions] = useState<LiveQuizSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate('/login');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchSchoolData();
    }
  }, [user]);

  const fetchSchoolData = async () => {
    if (!user) return;

    try {
      // Check if user has school role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile || profile.role !== 'school') {
        toast.error('Unauthorized access');
        navigate('/login');
        return;
      }

      // Get school_id for this user
      const { data: schoolUser, error: schoolUserError } = await supabase
        .from('school_users')
        .select('school_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (schoolUserError) {
        console.error('Error fetching school user relationship:', schoolUserError);
        toast.error('Database error occurred');
        navigate('/login');
        return;
      }

      if (!schoolUser) {
        toast.error('No school associated with this account. Please contact an administrator.');
        setLoading(false);
        return;
      }

      // Fetch school information
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select('*')
        .eq('id', schoolUser.school_id)
        .single();

      if (schoolError || !schoolData) {
        console.error('Error fetching school:', schoolError);
        toast.error('Failed to load school information');
        return;
      }

      setSchool(schoolData);

      // Fetch quiz participants to find quizzes this school participated in
      const { data: participantsData, error: participantsError } = await supabase
        .from('quiz_participants')
        .select('quiz_id')
        .eq('school_id', schoolData.id);

      if (participantsError) {
        console.error('Error fetching quiz participants:', participantsError);
        return;
      }

      const quizIds = participantsData?.map(p => p.quiz_id) || [];

      if (quizIds.length > 0) {
        // Fetch quizzes this school participated in
        const { data: quizzesData, error: quizzesError } = await supabase
          .from('quizzes')
          .select('*')
          .in('id', quizIds)
          .order('created_at', { ascending: false });

        if (quizzesError) {
          console.error('Error fetching quizzes:', quizzesError);
        } else {
          setQuizzes(quizzesData || []);
        }

        // Fetch live quiz sessions for these quizzes
        const { data: liveSessionsData, error: liveSessionsError } = await supabase
          .from('live_quiz_sessions')
          .select('*')
          .in('quiz_id', quizIds)
          .order('created_at', { ascending: false });

        if (liveSessionsError) {
          console.error('Error fetching live quiz sessions:', liveSessionsError);
        } else {
          setLiveQuizSessions(liveSessionsData || []);
        }
      }
    } catch (error) {
      console.error('Error in fetchSchoolData:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error signing out');
    } else {
      toast.success('Signed out successfully');
      navigate('/login');
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-500">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">School Dashboard</h1>
            {school && <p className="text-muted-foreground">{school.name}</p>}
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {school && (
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">School Name</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{school.name}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quizzes.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {liveQuizSessions.filter(session => session.is_question_active).length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="quizzes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="quizzes">My Quizzes</TabsTrigger>
            <TabsTrigger value="live">Live Sessions</TabsTrigger>
            <TabsTrigger value="profile">School Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="quizzes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quiz History</CardTitle>
              </CardHeader>
              <CardContent>
                {quizzes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No quizzes found. Wait for an admin to add your school to quiz sessions.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {quizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h3 className="font-semibold">{quiz.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {quiz.description || 'No description available'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(quiz.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="live" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Live Quiz Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {liveQuizSessions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No live quiz sessions found.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {liveQuizSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h3 className="font-semibold">Live Quiz Session</h3>
                          <p className="text-sm text-muted-foreground">
                            Session ID: {session.id.substring(0, 8)}...
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Started: {new Date(session.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(session.is_question_active)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            {school && (
              <Card>
                <CardHeader>
                  <CardTitle>School Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">School Name</label>
                    <p className="text-lg">{school.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Contact Email</label>
                    <p className="text-lg">{school.contact_email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Contact Phone</label>
                    <p className="text-lg">{school.contact_phone}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SchoolDashboard;