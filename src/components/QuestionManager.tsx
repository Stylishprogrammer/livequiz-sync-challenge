import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface Question {
  id: string;
  subject_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  correct_answer_index?: number;
  correct_answer_text?: string;
  time_limit: number;
  is_active: boolean;
  subject?: Subject;
  question_options?: QuestionOption[];
}

interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  option_index: number;
}

export function QuestionManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const { toast } = useToast();

  const [questionForm, setQuestionForm] = useState({
    subject_id: '',
    question_text: '',
    question_type: 'multiple_choice' as const,
    correct_answer_index: 0,
    correct_answer_text: '',
    time_limit: 60,
    options: ['', '', '', '']
  });

  useEffect(() => {
    fetchSubjects();
    fetchQuestions();
  }, []);

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch subjects",
        variant: "destructive"
      });
    } else {
      setSubjects(data || []);
    }
  };

  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from('questions')
      .select(`
        *,
        subject:subjects(*),
        question_options(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch questions",
        variant: "destructive"
      });
    } else {
      setQuestions(data || []);
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!questionForm.subject_id || !questionForm.question_text) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create questions",
        variant: "destructive"
      });
      return;
    }

    // Insert question
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .insert({
        subject_id: questionForm.subject_id,
        question_text: questionForm.question_text,
        question_type: questionForm.question_type,
        correct_answer_index: questionForm.question_type === 'multiple_choice' ? questionForm.correct_answer_index : null,
        correct_answer_text: questionForm.question_type !== 'multiple_choice' ? questionForm.correct_answer_text : null,
        time_limit: questionForm.time_limit,
        created_by: user.id
      })
      .select()
      .single();

    if (questionError) {
      toast({
        title: "Error",
        description: "Failed to create question",
        variant: "destructive"
      });
      return;
    }

    // Insert options for multiple choice questions
    if (questionForm.question_type === 'multiple_choice' && question) {
      const options = questionForm.options
        .filter(opt => opt.trim())
        .map((opt, index) => ({
          question_id: question.id,
          option_text: opt,
          option_index: index
        }));

      const { error: optionsError } = await supabase
        .from('question_options')
        .insert(options);

      if (optionsError) {
        toast({
          title: "Error",
          description: "Failed to create question options",
          variant: "destructive"
        });
        return;
      }
    }

    toast({
      title: "Success",
      description: "Question created successfully"
    });

    setQuestionForm({
      subject_id: '',
      question_text: '',
      question_type: 'multiple_choice',
      correct_answer_index: 0,
      correct_answer_text: '',
      time_limit: 60,
      options: ['', '', '', '']
    });
    setShowQuestionForm(false);
    fetchQuestions();
  };

    const filteredQuestions = selectedSubject === 'all' 
      ? questions 
      : questions.filter(q => q.subject_id === selectedSubject);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Question Management</h2>
          <p className="text-muted-foreground">Create and manage quiz questions by subject</p>
        </div>
        <Button 
          onClick={() => setShowQuestionForm(true)}
          className="quiz-button-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>

      {/* Subject Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Filter by Subject
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger>
              <SelectValue placeholder="All subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subjects</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Question Form */}
      {showQuestionForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Question</CardTitle>
            <CardDescription>Add a new question to the quiz bank</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitQuestion} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select 
                    value={questionForm.subject_id} 
                    onValueChange={(value) => setQuestionForm({...questionForm, subject_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Question Type</Label>
                  <Select 
                    value={questionForm.question_type} 
                    onValueChange={(value: any) => setQuestionForm({...questionForm, question_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="true_false">True/False</SelectItem>
                      <SelectItem value="short_answer">Short Answer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="question">Question Text</Label>
                <Textarea
                  id="question"
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm({...questionForm, question_text: e.target.value})}
                  placeholder="Enter your question here..."
                  required
                />
              </div>

              {questionForm.question_type === 'multiple_choice' && (
                <div className="space-y-2">
                  <Label>Answer Options</Label>
                  {questionForm.options.map((option, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...questionForm.options];
                          newOptions[index] = e.target.value;
                          setQuestionForm({...questionForm, options: newOptions});
                        }}
                        placeholder={`Option ${index + 1}`}
                      />
                      <input
                        type="radio"
                        name="correct"
                        checked={questionForm.correct_answer_index === index}
                        onChange={() => setQuestionForm({...questionForm, correct_answer_index: index})}
                      />
                      <span className="text-sm text-muted-foreground">Correct</span>
                    </div>
                  ))}
                </div>
              )}

              {questionForm.question_type !== 'multiple_choice' && (
                <div className="space-y-2">
                  <Label htmlFor="answer">Correct Answer</Label>
                  <Input
                    id="answer"
                    value={questionForm.correct_answer_text}
                    onChange={(e) => setQuestionForm({...questionForm, correct_answer_text: e.target.value})}
                    placeholder="Enter the correct answer..."
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  value={questionForm.time_limit}
                  onChange={(e) => setQuestionForm({...questionForm, time_limit: parseInt(e.target.value)})}
                  min="10"
                  max="300"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="quiz-button-primary">
                  Create Question
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowQuestionForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Questions ({filteredQuestions.length})
        </h3>
        
        {filteredQuestions.map((question) => (
          <Card key={question.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">
                      {question.subject?.name || 'Unknown Subject'}
                    </Badge>
                    <Badge variant="secondary">
                      {question.question_type.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {question.time_limit}s
                    </span>
                  </div>
                  <h4 className="font-semibold mb-2">{question.question_text}</h4>
                  
                  {question.question_options && question.question_options.length > 0 && (
                    <div className="space-y-1">
                      {question.question_options
                        .sort((a, b) => a.option_index - b.option_index)
                        .map((option, index) => (
                          <div key={option.id} className="flex items-center gap-2">
                            <span className={`text-sm px-2 py-1 rounded ${
                              question.correct_answer_index === index 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {String.fromCharCode(65 + index)}
                            </span>
                            <span className="text-sm">{option.option_text}</span>
                          </div>
                        ))}
                    </div>
                  )}
                  
                  {question.correct_answer_text && (
                    <div className="mt-2">
                      <span className="text-sm font-medium">Answer: </span>
                      <span className="text-sm text-green-600">{question.correct_answer_text}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}