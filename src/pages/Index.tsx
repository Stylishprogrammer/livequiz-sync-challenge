import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { QuizSelector } from '@/components/QuizSelector';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleRoleSelect = (role: 'admin' | 'school') => {
    if (role === 'admin') {
      navigate('/register/admin');
    } else {
      navigate('/register/school');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <QuizSelector onRoleSelect={handleRoleSelect} />;
  }

  // User is authenticated, redirect based on their role
  return (
    <div className="min-h-screen p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold gradient-text">QuizMaster Live</h1>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">Welcome, {user.email}</span>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
      
      <div className="text-center space-y-6">
        <div className="glass-card p-8 max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-4">Choose Your Dashboard</h2>
          <div className="space-y-4">
            <Button
              onClick={() => navigate('/admin/dashboard')}
              className="w-full quiz-button-primary"
            >
              Admin Dashboard
            </Button>
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
