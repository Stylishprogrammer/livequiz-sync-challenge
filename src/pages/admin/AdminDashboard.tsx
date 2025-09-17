import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Users, HelpCircle, BookOpen, Trophy, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QuestionManager } from "@/components/QuestionManager";
import { SubjectManager } from "@/components/SubjectManager";
import { LiveQuizManager } from "@/components/LiveQuizManager";
import UserManager from "@/components/UserManager";
import { BulkQuestionUpload } from "@/components/BulkQuestionUpload";

interface Profile {
  full_name: string;
  role: string;
}

interface School {
  id: string;
  name: string;
  contact_person: string;
  contact_email: string;
  is_approved: boolean;
  created_at: string;
}

interface Subject {
  id: string;
  name: string;
  description: string;
  question_count?: number;
}

export default function AdminDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('user_id', session.user.id)
        .single();

      if (!profileData || profileData.role !== 'admin') {
        navigate('/login');
        return;
      }

      setProfile(profileData);
      await loadDashboardData();
    };

    checkAuth();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      // Load schools
      const { data: schoolsData } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false });

      if (schoolsData) setSchools(schoolsData);

      // Load subjects with question counts
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select(`
          *,
          questions(count)
        `)
        .eq('is_active', true);

      if (subjectsData) {
        const subjectsWithCounts = subjectsData.map(subject => ({
          ...subject,
          question_count: subject.questions?.[0]?.count || 0
        }));
        setSubjects(subjectsWithCounts);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const approveSchool = async (schoolId: string) => {
    try {
      const { error } = await supabase
        .from('schools')
        .update({ is_approved: true })
        .eq('id', schoolId);

      if (error) throw error;

      toast({
        title: "School approved",
        description: "The school has been approved successfully.",
      });

      await loadDashboardData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {profile?.full_name}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schools">Schools</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="live-quiz">Live Quiz</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Registered Schools</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{schools.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {schools.filter(s => s.is_approved).length} approved
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {subjects.reduce((total, subject) => total + (subject.question_count || 0), 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across {subjects.length} subjects
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Subjects</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{subjects.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Available for quizzes
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent School Registrations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {schools.slice(0, 5).map((school) => (
                      <div key={school.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{school.name}</p>
                          <p className="text-sm text-muted-foreground">{school.contact_person}</p>
                        </div>
                        <Badge variant={school.is_approved ? "default" : "secondary"}>
                          {school.is_approved ? "Approved" : "Pending"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subject Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {subjects.map((subject) => (
                      <div key={subject.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{subject.name}</p>
                          <p className="text-sm text-muted-foreground">{subject.description}</p>
                        </div>
                        <Badge variant="outline">
                          {subject.question_count} questions
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schools" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>School Management</CardTitle>
                <CardDescription>
                  Manage school registrations and approvals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {schools.map((school) => (
                    <div key={school.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h3 className="font-medium">{school.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Contact: {school.contact_person} ({school.contact_email})
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Registered: {new Date(school.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={school.is_approved ? "default" : "secondary"}>
                          {school.is_approved ? "Approved" : "Pending"}
                        </Badge>
                        {!school.is_approved && (
                          <Button
                            size="sm"
                            onClick={() => approveSchool(school.id)}
                          >
                            Approve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-6">
            <SubjectManager />
          </TabsContent>

          <TabsContent value="questions" className="space-y-6">
            <QuestionManager />
          </TabsContent>

          <TabsContent value="bulk-upload" className="space-y-6">
            <BulkQuestionUpload />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManager />
          </TabsContent>

          <TabsContent value="live-quiz" className="space-y-6">
            <LiveQuizManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}