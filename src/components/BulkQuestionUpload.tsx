import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

interface ParsedQuestion {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  hasErrors: boolean;
  errorMessage?: string;
}

export function BulkQuestionUpload() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [questionText, setQuestionText] = useState<string>('');
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLimit, setTimeLimit] = useState<number>(60);
  const { toast } = useToast();

  React.useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch subjects",
        variant: "destructive",
      });
    }
  };

  const parseQuestions = () => {
    const lines = questionText.split('\n').filter(line => line.trim());
    const questions: ParsedQuestion[] = [];
    let currentQuestion: Partial<ParsedQuestion> = {};
    let questionNumber = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if line starts with a number (new question)
      if (line.match(/^\d+\./)) {
        // Save previous question if exists
        if (currentQuestion.questionText) {
          const question = finalizeQuestion(currentQuestion);
          questions.push(question);
        }
        
        // Start new question
        currentQuestion = {
          questionText: line.replace(/^\d+\.\s*/, ''),
          options: [],
          correctAnswerIndex: -1,
          hasErrors: false
        };
        questionNumber++;
      }
      // Check if line is an option (a., b., c., d.)
      else if (line.match(/^[a-d]\./)) {
        if (!currentQuestion.options) currentQuestion.options = [];
        
        const optionText = line.replace(/^[a-d]\.\s*/, '');
        const isCorrect = optionText.includes('*');
        const cleanOptionText = optionText.replace('*', '').trim();
        
        currentQuestion.options.push(cleanOptionText);
        
        if (isCorrect) {
          currentQuestion.correctAnswerIndex = currentQuestion.options.length - 1;
        }
      }
      // Continue question text if it doesn't match option pattern
      else if (currentQuestion.questionText && !line.match(/^[a-d]\./)) {
        currentQuestion.questionText += ' ' + line;
      }
    }

    // Add the last question
    if (currentQuestion.questionText) {
      const question = finalizeQuestion(currentQuestion);
      questions.push(question);
    }

    setParsedQuestions(questions);
  };

  const finalizeQuestion = (question: Partial<ParsedQuestion>): ParsedQuestion => {
    const errors: string[] = [];
    
    if (!question.questionText?.trim()) {
      errors.push('Missing question text');
    }
    
    if (!question.options || question.options.length < 2) {
      errors.push('Need at least 2 options');
    }
    
    if (question.correctAnswerIndex === -1) {
      errors.push('No correct answer marked with *');
    }

    return {
      questionText: question.questionText || '',
      options: question.options || [],
      correctAnswerIndex: question.correctAnswerIndex || -1,
      hasErrors: errors.length > 0,
      errorMessage: errors.join(', ')
    };
  };

  const uploadQuestions = async () => {
    if (!selectedSubject) {
      toast({
        title: "Error",
        description: "Please select a subject",
        variant: "destructive",
      });
      return;
    }

    const validQuestions = parsedQuestions.filter(q => !q.hasErrors);
    if (validQuestions.length === 0) {
      toast({
        title: "Error",
        description: "No valid questions to upload",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Insert questions
      for (const question of validQuestions) {
        const { data: questionData, error: questionError } = await supabase
          .from('questions')
          .insert({
            subject_id: selectedSubject,
            question_text: question.questionText,
            question_type: 'multiple_choice',
            correct_answer_index: question.correctAnswerIndex,
            time_limit: timeLimit,
            created_by: userData.user.id,
          })
          .select()
          .single();

        if (questionError) throw questionError;

        // Insert options
        const optionsToInsert = question.options.map((optionText, index) => ({
          question_id: questionData.id,
          option_index: index,
          option_text: optionText,
        }));

        const { error: optionsError } = await supabase
          .from('question_options')
          .insert(optionsToInsert);

        if (optionsError) throw optionsError;
      }

      toast({
        title: "Success",
        description: `Uploaded ${validQuestions.length} questions successfully`,
      });

      // Reset form
      setQuestionText('');
      setParsedQuestions([]);
      setSelectedSubject('');
    } catch (error) {
      console.error('Error uploading questions:', error);
      toast({
        title: "Error",
        description: "Failed to upload questions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Bulk Question Upload
          </CardTitle>
          <CardDescription>
            Upload multiple questions at once using the text format. Mark correct answers with * after the option.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
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
            <div>
              <label className="text-sm font-medium">Time Limit (seconds)</label>
              <Select value={timeLimit.toString()} onValueChange={(value) => setTimeLimit(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">60 seconds</SelectItem>
                  <SelectItem value="90">90 seconds</SelectItem>
                  <SelectItem value="120">2 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Questions Text</label>
            <Textarea
              placeholder={`Paste your questions here in this format:

1. What is 2 + 2?
a. 3
b. 4*
c. 5
d. 6

2. What is the capital of France?
a. London
b. Berlin
c. Paris*
d. Madrid`}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={10}
              className="mt-1"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={parseQuestions} variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Parse Questions
            </Button>
            {parsedQuestions.length > 0 && (
              <Button 
                onClick={uploadQuestions} 
                disabled={isLoading || !selectedSubject}
                className="ml-auto"
              >
                Upload {parsedQuestions.filter(q => !q.hasErrors).length} Questions
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {parsedQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Parsed Questions Preview</CardTitle>
            <CardDescription>
              {parsedQuestions.filter(q => !q.hasErrors).length} valid questions, {parsedQuestions.filter(q => q.hasErrors).length} with errors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {parsedQuestions.map((question, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    {question.hasErrors ? (
                      <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">Question {index + 1}</p>
                      <p className="text-sm text-muted-foreground mt-1">{question.questionText}</p>
                    </div>
                  </div>
                  
                  {question.hasErrors ? (
                    <Badge variant="destructive" className="mb-2">
                      {question.errorMessage}
                    </Badge>
                  ) : (
                    <div className="ml-7 space-y-1">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {String.fromCharCode(97 + optionIndex)}.
                          </span>
                          <span className={`text-sm ${optionIndex === question.correctAnswerIndex ? 'font-semibold text-green-600' : ''}`}>
                            {option}
                          </span>
                          {optionIndex === question.correctAnswerIndex && (
                            <Badge variant="secondary" className="text-xs">Correct</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {index < parsedQuestions.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}