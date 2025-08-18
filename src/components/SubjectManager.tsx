import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export function SubjectManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast({
        title: "Error",
        description: "Subject name is required",
        variant: "destructive"
      });
      return;
    }

    if (editingSubject) {
      // Update existing subject
      const { error } = await supabase
        .from('subjects')
        .update({
          name: form.name,
          description: form.description
        })
        .eq('id', editingSubject.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update subject",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Subject updated successfully"
      });
    } else {
      // Create new subject
      const { error } = await supabase
        .from('subjects')
        .insert({
          name: form.name,
          description: form.description
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create subject",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Subject created successfully"
      });
    }

    setForm({ name: '', description: '' });
    setShowForm(false);
    setEditingSubject(null);
    fetchSubjects();
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setForm({
      name: subject.name,
      description: subject.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (subject: Subject) => {
    if (!confirm(`Are you sure you want to delete "${subject.name}"?`)) {
      return;
    }

    const { error } = await supabase
      .from('subjects')
      .update({ is_active: false })
      .eq('id', subject.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete subject",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Subject deleted successfully"
    });

    fetchSubjects();
  };

  const handleCancel = () => {
    setForm({ name: '', description: '' });
    setShowForm(false);
    setEditingSubject(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Subject Management</h2>
          <p className="text-muted-foreground">Organize your quiz questions by subjects</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="quiz-button-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Subject
        </Button>
      </div>

      {/* Subject Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingSubject ? 'Edit Subject' : 'Create New Subject'}</CardTitle>
            <CardDescription>
              {editingSubject ? 'Update the subject details' : 'Add a new subject to organize your questions'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Subject Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  placeholder="e.g., Mathematics, Physics, History..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="Brief description of the subject..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="quiz-button-primary">
                  {editingSubject ? 'Update Subject' : 'Create Subject'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Subjects List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Subjects ({subjects.filter(s => s.is_active).length})
        </h3>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjects
            .filter(subject => subject.is_active)
            .map((subject) => (
              <Card key={subject.id} className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">{subject.name}</h4>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  
                  {subject.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {subject.description}
                    </p>
                  )}
                  
                  <div className="text-xs text-muted-foreground mb-4">
                    Created: {new Date(subject.created_at).toLocaleDateString()}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEdit(subject)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDelete(subject)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        {subjects.filter(s => s.is_active).length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-semibold mb-2">No subjects yet</h4>
              <p className="text-muted-foreground mb-4">
                Create your first subject to start organizing quiz questions
              </p>
              <Button onClick={() => setShowForm(true)} className="quiz-button-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add First Subject
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}