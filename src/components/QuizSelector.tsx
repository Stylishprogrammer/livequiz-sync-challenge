import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Play, Settings, GraduationCap, Zap, Trophy, Shield, Globe } from 'lucide-react';

interface QuizSelectorProps {
  onRoleSelect: (role: 'admin' | 'school', schoolName?: string) => void;
}

export function QuizSelector({ onRoleSelect }: QuizSelectorProps) {
  const [schoolName, setSchoolName] = useState('');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleSchoolJoin = () => {
    if (schoolName.trim()) {
      onRoleSelect('school', schoolName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-6xl space-y-12">
          {/* Enhanced Header */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl mb-6 shadow-2xl">
              <Zap className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              QuizMaster Live
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              The next-generation real-time quiz platform transforming education through interactive competition
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
              
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              
              </div>
            </div>
          </div>

          {/* Enhanced Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Admin Card */}
            <Card 
              className="group relative bg-slate-800/50 backdrop-blur-xl border-slate-700/50 hover:border-purple-500/50 transition-all duration-500 overflow-hidden"
              onMouseEnter={() => setHoveredCard('admin')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              
              <CardHeader className="relative text-center space-y-6 pb-8">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                  <Settings className="h-10 w-10 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold text-white mb-3">Administrator</CardTitle>
                  <CardDescription className="text-lg text-slate-300 leading-relaxed">
                    Command center for creating immersive quiz experiences and managing global competitions
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="relative space-y-6">
                <div className="grid gap-4">
                  {[
                    { icon: Play, text: "Launch live quiz sessions", color: "text-purple-400" },
                    { icon: Users, text: "Monitor real-time participation", color: "text-blue-400" },
                    { icon: Trophy, text: "Manage global leaderboards", color: "text-yellow-400" },
                    { icon: Shield, text: "Advanced analytics dashboard", color: "text-green-400" }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 text-slate-300 group-hover:text-white transition-colors duration-300">
                      <feature.icon className={`h-5 w-5 ${feature.color}`} />
                      <span>{feature.text}</span>
                    </div>
                  ))}
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
            <Card 
              className="group relative bg-slate-800/50 backdrop-blur-xl border-slate-700/50 hover:border-green-500/50 transition-all duration-500 overflow-hidden"
              onMouseEnter={() => setHoveredCard('school')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-green-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              
              <CardHeader className="relative text-center space-y-6 pb-8">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                  <GraduationCap className="h-10 w-10 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold text-white mb-3">School Team</CardTitle>
                  <CardDescription className="text-lg text-slate-300 leading-relaxed">
                    Join the global competition and showcase your school's knowledge on the world stage
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="relative space-y-6">
                <div className="flex flex-wrap gap-3 justify-center mb-6">
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30 px-4 py-2">
                    <Users className="h-4 w-4 mr-2" />
                     Schools Interractions online
                  </Badge>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-4 py-2">
                    <Play className="h-4 w-4 mr-2" />
                     Live Quizzes
                  </Badge>
                  <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 px-4 py-2">
                    <Trophy className="h-4 w-4 mr-2" />
                    Championship Active
                  </Badge>
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

          {/* Enhanced Features Section */}
          <div className="text-center space-y-8">
            <h2 className="text-4xl font-bold text-white">Platform Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  icon: Zap,
                  title: "Lightning Fast",
                  description: "Sub-second response times with global CDN",
                  color: "from-yellow-400 to-orange-500",
                  bgColor: "bg-yellow-500/10"
                },
                {
                  icon: Globe,
                  title: "Global Scale",
                  description: "Connect schools worldwide in real-time",
                  color: "from-blue-400 to-purple-500",
                  bgColor: "bg-blue-500/10"
                },
                {
                  icon: Trophy,
                  title: "Live Rankings",
                  description: "Dynamic leaderboards with instant updates",
                  color: "from-green-400 to-teal-500",
                  bgColor: "bg-green-500/10"
                },
                {
                  icon: Shield,
                  title: "Enterprise Ready",
                  description: "Bank-grade security and 99.9% uptime",
                  color: "from-purple-400 to-pink-500",
                  bgColor: "bg-purple-500/10"
                }
              ].map((feature, index) => (
                <div key={index} className="group relative">
                  <div className={`absolute inset-0 ${feature.bgColor} rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100`}></div>
                  <Card className="relative bg-slate-800/50 backdrop-blur-xl border-slate-700/50 hover:border-slate-600 transition-all duration-300 group-hover:scale-105">
                    <CardContent className="p-8 text-center space-y-4">
                      <div className={`inline-flex w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl items-center justify-center shadow-2xl`}>
                        <feature.icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                      <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}