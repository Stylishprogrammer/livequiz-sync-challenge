import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Play, Settings, GraduationCap } from 'lucide-react';

interface QuizSelectorProps {
  onRoleSelect: (role: 'admin' | 'school', schoolName?: string) => void;
}

export function QuizSelector({ onRoleSelect }: QuizSelectorProps) {
  const [schoolName, setSchoolName] = useState('');

  const handleSchoolJoin = () => {
    if (schoolName.trim()) {
      onRoleSelect('school', schoolName.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold gradient-text">QuizMaster Live</h1>
          <p className="text-xl text-muted-foreground">
            Real-time quiz platform for schools and educators
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Admin Card */}
          <Card className="glass-card border-0 hover:scale-105 transition-all duration-300">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Administrator</CardTitle>
                <CardDescription className="text-base">
                  Create and manage live quizzes, control questions, and monitor school participation
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Play className="h-4 w-4" />
                  <span>Start and control live quizzes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Monitor school participation</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GraduationCap className="h-4 w-4" />
                  <span>View real-time leaderboards</span>
                </div>
              </div>
              <Button 
                onClick={() => onRoleSelect('admin')}
                className="w-full quiz-button-primary text-lg py-6"
              >
                Admin Login/Register
              </Button>
            </CardContent>
          </Card>

          {/* School Card */}
          <Card className="glass-card border-0 hover:scale-105 transition-all duration-300">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">School Participant</CardTitle>
                <CardDescription className="text-base">
                  Join live quizzes, answer questions in real-time, and compete with other schools
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 mb-6">
                <Badge variant="outline" className="w-full justify-center py-2">
                  <Users className="h-4 w-4 mr-2" />
                  4 schools currently online
                </Badge>
                <Badge variant="outline" className="w-full justify-center py-2">
                  <Play className="h-4 w-4 mr-2" />
                  Live quiz available
                </Badge>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="schoolName" className="text-base">School Name</Label>
                <Input
                  id="schoolName"
                  type="text"
                  placeholder="Enter your school name"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="text-base py-3"
                  onKeyPress={(e) => e.key === 'Enter' && handleSchoolJoin()}
                />
              </div>
              
              <Button 
                onClick={() => onRoleSelect('school')}
                className="w-full quiz-button-success text-lg py-6"
              >
                School Login/Register
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-semibold">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 space-y-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                <Play className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold">Real-time Sync</h3>
              <p className="text-sm text-muted-foreground">
                All participants see questions simultaneously with synchronized timers
              </p>
            </div>
            
            <div className="glass-card p-6 space-y-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold">Live Leaderboard</h3>
              <p className="text-sm text-muted-foreground">
                Track performance and rankings in real-time across all schools
              </p>
            </div>
            
            <div className="glass-card p-6 space-y-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold">Network Resilient</h3>
              <p className="text-sm text-muted-foreground">
                Automatic reconnection and local storage for uninterrupted experience
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}