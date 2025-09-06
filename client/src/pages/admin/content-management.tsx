import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, BookOpen, HelpCircle, FileText, Video, Headphones, Upload, Mic, Clock, Brain } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ContentManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState("");

  // Fetch courses
  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
  });

  // Fetch course content based on selected course
  const { data: courseContent } = useQuery({
    queryKey: ["/api/admin/course-content", selectedCourse],
    enabled: !!selectedCourse,
  });

  const safeContent = courseContent || { lessons: [], chapters: [], questions: [] };

  const addLessonMutation = useMutation({
    mutationFn: async (data: any) => await apiRequest("POST", "/api/admin/lessons", data),
    onSuccess: () => {
      toast({ title: "Lesson added successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/course-content"] });
    },
  });

  const addQuestionMutation = useMutation({
    mutationFn: async (data: any) => await apiRequest("POST", "/api/admin/questions", data),
    onSuccess: () => {
      toast({ title: "Question added successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/course-content"] });
    },
  });

  const addChapterMutation = useMutation({
    mutationFn: async (data: any) => await apiRequest("POST", "/api/admin/chapters", data),
    onSuccess: () => {
      toast({ title: "Chapter added successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/course-content"] });
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Content Management</h1>
          <p className="text-muted-foreground">
            Create and manage course content, lessons, and questions
          </p>
        </div>

        {/* Course Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Course</CardTitle>
            <CardDescription>Choose which course to manage</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Select a course to manage" />
              </SelectTrigger>
              <SelectContent>
                {(courses as any[])?.map((course: any) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedCourse && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="lessons">Lessons</TabsTrigger>
              <TabsTrigger value="chapters">Chapters</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="imports">Bulk Imports</TabsTrigger>
            </TabsList>

            <TabsContent value="lessons">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Lessons</CardTitle>
                    <CardDescription>Manage course lessons and content</CardDescription>
                  </div>
                  <AddLessonDialog 
                    courseId={selectedCourse} 
                    onAdd={addLessonMutation.mutate}
                    isPending={addLessonMutation.isPending}
                  />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {safeContent.lessons?.map((lesson: any) => (
                      <div key={lesson.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{lesson.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              Chapter {lesson.chapterNumber} • {lesson.duration} minutes
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm bg-muted px-2 py-1 rounded">
                              {lesson.type}
                            </span>
                            <Button variant="outline" size="sm">Edit</Button>
                          </div>
                        </div>
                      </div>
                    )) || <p className="text-muted-foreground">No lessons found. Add your first lesson!</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chapters">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Chapters</CardTitle>
                    <CardDescription>Organize lessons into chapters</CardDescription>
                  </div>
                  <AddChapterDialog 
                    courseId={selectedCourse} 
                    onAdd={addChapterMutation.mutate}
                    isPending={addChapterMutation.isPending}
                  />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {safeContent.chapters?.map((chapter: any) => (
                      <div key={chapter.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">Chapter {chapter.number}: {chapter.title}</h3>
                            <p className="text-sm text-muted-foreground">{chapter.description}</p>
                          </div>
                          <Button variant="outline" size="sm">Edit</Button>
                        </div>
                      </div>
                    )) || <p className="text-muted-foreground">No chapters found. Add your first chapter!</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="questions">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Practice Questions</CardTitle>
                    <CardDescription>Create practice questions for lessons and tests</CardDescription>
                  </div>
                  <AddQuestionDialog 
                    courseId={selectedCourse} 
                    onAdd={addQuestionMutation.mutate}
                    isPending={addQuestionMutation.isPending}
                  />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {safeContent.questions?.map((question: any) => (
                      <div key={question.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-2">{question.questionText}</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {question.options?.map((option: string, idx: number) => (
                                <span key={idx} className={`px-2 py-1 rounded text-xs ${
                                  idx === question.correctAnswer 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-muted'
                                }`}>
                                  {option}
                                </span>
                              ))}
                            </div>
                          </div>
                          <Button variant="outline" size="sm">Edit</Button>
                        </div>
                      </div>
                    )) || <p className="text-muted-foreground">No questions found. Add your first question!</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="overview">
              <div className="space-y-6">
                {/* Content Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
                      <BookOpen className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{safeContent.lessons?.length || 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Chapters</CardTitle>
                      <FileText className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{safeContent.chapters?.length || 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
                      <HelpCircle className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{safeContent.questions?.length || 0}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Create content individually or use bulk import tools</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <AddLessonDialog 
                        courseId={selectedCourse} 
                        onAdd={addLessonMutation.mutate}
                        isPending={addLessonMutation.isPending}
                      />
                      <AddChapterDialog 
                        courseId={selectedCourse} 
                        onAdd={addChapterMutation.mutate}
                        isPending={addChapterMutation.isPending}
                      />
                      <AddQuestionDialog 
                        courseId={selectedCourse} 
                        onAdd={addQuestionMutation.mutate}
                        isPending={addQuestionMutation.isPending}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="imports">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Bulk Import Tools</CardTitle>
                    <CardDescription>
                      Import multiple pieces of content at once to quickly build your course
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <Link href={`/admin/bulk-import?courseId=${selectedCourse}`}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                              <Upload className="h-5 w-5" />
                              Bulk Questions
                            </CardTitle>
                            <CardDescription>
                              Import multiple practice questions using text format
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      </Link>

                      <Link href={`/admin/flashcard-import?courseId=${selectedCourse}`}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                              <Upload className="h-5 w-5" />
                              Bulk Flashcards
                            </CardTitle>
                            <CardDescription>
                              Import flashcards with terms and definitions
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      </Link>

                      <Link href={`/admin/study-notes-import?courseId=${selectedCourse}`}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                              <BookOpen className="h-5 w-5" />
                              Study Notes
                            </CardTitle>
                            <CardDescription>
                              Import structured study notes with headings
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      </Link>

                      <Link href={`/admin/study-plan-import?courseId=${selectedCourse}`}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                              <Clock className="h-5 w-5" />
                              Study Plans
                            </CardTitle>
                            <CardDescription>
                              Import adaptive study plans with time-based sessions
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      </Link>

                      <Link href={`/admin/podcast-import?courseId=${selectedCourse}`}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                              <Mic className="h-5 w-5" />
                              Podcast Episodes
                            </CardTitle>
                            <CardDescription>
                              Import conversation content to create podcast episodes
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      </Link>

                      <Link href={`/admin/content-import?courseId=${selectedCourse}`}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                              <Brain className="h-5 w-5" />
                              AI Chat Content
                            </CardTitle>
                            <CardDescription>
                              Import educational content for the AI mentor chat system
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

function AddLessonDialog({ courseId, onAdd, isPending }: { courseId: string; onAdd: (data: any) => void; isPending: boolean }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    type: "text",
    duration: "",
    chapterNumber: "1"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ ...formData, courseId });
    setOpen(false);
    setFormData({ title: "", description: "", content: "", type: "text", duration: "", chapterNumber: "1" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Lesson
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Lesson</DialogTitle>
          <DialogDescription>Create a new lesson for this course</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Lesson Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Content Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text Content</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="chapter">Chapter Number</Label>
              <Input
                id="chapter"
                type="number"
                value={formData.chapterNumber}
                onChange={(e) => setFormData({ ...formData, chapterNumber: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={8}
              placeholder="Enter the lesson content here..."
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add Lesson"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddChapterDialog({ courseId, onAdd, isPending }: { courseId: string; onAdd: (data: any) => void; isPending: boolean }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    number: "1"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ ...formData, courseId });
    setOpen(false);
    setFormData({ title: "", description: "", number: "1" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Chapter
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Chapter</DialogTitle>
          <DialogDescription>Create a new chapter for this course</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="number">Chapter Number</Label>
            <Input
              id="number"
              type="number"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="title">Chapter Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add Chapter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddQuestionDialog({ courseId, onAdd, isPending }: { courseId: string; onAdd: (data: any) => void; isPending: boolean }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    questionText: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
    difficulty: "medium"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ ...formData, courseId });
    setOpen(false);
    setFormData({
      questionText: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
      difficulty: "medium"
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Practice Question</DialogTitle>
          <DialogDescription>Create a new practice question for this course</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="question">Question Text</Label>
            <Textarea
              id="question"
              value={formData.questionText}
              onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
              rows={3}
              required
            />
          </div>
          <div>
            <Label>Answer Options</Label>
            <div className="space-y-2">
              {formData.options.map((option, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct"
                    checked={formData.correctAnswer === idx}
                    onChange={() => setFormData({ ...formData, correctAnswer: idx })}
                  />
                  <Input
                    placeholder={`Option ${idx + 1}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...formData.options];
                      newOptions[idx] = e.target.value;
                      setFormData({ ...formData, options: newOptions });
                    }}
                    required
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="explanation">Explanation</Label>
            <Textarea
              id="explanation"
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              rows={3}
              placeholder="Explain why this is the correct answer..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add Question"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}