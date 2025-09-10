import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ChevronRight, HelpCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";

// Map friendly course identifiers to database UUIDs
function getCourseUUID(courseSlug: string): string {
  const courseMapping: { [key: string]: string } = {
    'journeyman-prep': 'b83c6ebe-f5bd-4787-8fd5-e3b177d9e79b',
    'backflow-prevention': 'b06e5cc6-3cec-4fe6-81ae-5f7cf5ade62e',
    'natural-gas': 'ce9dfb3e-f6ef-40ed-b578-25bff53eb2dc',
    'medical-gas': '547ca2fb-e3b3-46c7-a3ef-9e082401b510',
    'master-plumber': '2b8778aa-c3ec-43cd-887a-77ca0824a294'
  };
  return courseMapping[courseSlug] || courseSlug;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface CourseContent {
  id: string;
  title: string;
  type: string;
  chapter: number;
  section: string;
  content: any;
  duration?: number;
  isActive: boolean;
  sortOrder: number;
}

export default function LessonQuiz() {
  const [match, params] = useRoute("/course/:courseId/lesson/:section/quiz");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const courseId = params?.courseId;
  const section = params?.section;
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);

  if (!courseId || !section) {
    return <div>Lesson not found</div>;
  }

  // Resolve friendly course ID to UUID for API calls
  const resolvedCourseId = getCourseUUID(courseId);

  // Fetch course content for this section
  const { data: content, isLoading: isContentLoading } = useQuery({
    queryKey: [`/api/courses/${resolvedCourseId}/content`],
    enabled: !!resolvedCourseId,
  });

  // Find quiz content for this section
  const quizContent = Array.isArray(content) ? content.find((item: CourseContent) => 
    String(item.section) === section && 
    (item.type === 'quiz' || item.title?.toLowerCase().includes('quiz'))
  ) : undefined;

  const questions: QuizQuestion[] = quizContent?.content?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  // Timer effect
  useEffect(() => {
    if (!isSubmitted) {
      const interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isSubmitted]);

  // Submit quiz mutation
  const submitQuizMutation = useMutation({
    mutationFn: async (answers: { [key: number]: number }) => {
      const response = await apiRequest("POST", "/api/quiz/submit", {
        courseId: resolvedCourseId,
        section: parseInt(section),
        contentId: quizContent?.id,
        answers,
        timeElapsed
      });
      return response.json();
    },
    onSuccess: (data) => {
      setQuizResults(data);
      setIsSubmitted(true);
      trackProgress(true);
      toast({
        title: data.passed ? "Quiz Passed!" : "Quiz Completed",
        description: `Score: ${data.score}% (${data.correctAnswers}/${data.totalQuestions})`,
        variant: data.passed ? "default" : "destructive",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Track lesson step progress
  const trackProgress = async (completed = false) => {
    try {
      await apiRequest("POST", "/api/lesson-progress/track", {
        courseId: resolvedCourseId,
        section: parseInt(section),
        stepType: "quiz",
        stepIndex: 5,
        isCompleted: completed,
        currentPosition: { 
          questionIndex: currentQuestionIndex, 
          totalQuestions: questions.length,
          timeElapsed 
        }
      });
    } catch (error) {
      console.error("Failed to track progress:", error);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (!isSubmitted) {
      setUserAnswers(prev => ({
        ...prev,
        [currentQuestionIndex]: answerIndex
      }));
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = () => {
    if (Object.keys(userAnswers).length === questions.length) {
      submitQuizMutation.mutate(userAnswers);
    } else {
      toast({
        title: "Incomplete Quiz",
        description: "Please answer all questions before submitting.",
        variant: "destructive",
      });
    }
  };

  const handleContinue = () => {
    navigate(`/course/${courseId}/lesson/${section}`);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (isContentLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href={`/course/${courseId}/lesson/${section}`}>
              <Button variant="ghost" size="sm" data-testid="button-back-lesson-flow">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Lesson Flow
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold">Section {section} Quiz</h1>
              <Badge variant="secondary">Step 6 of 6</Badge>
            </div>
          </div>
          
          {!isSubmitted && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatTime(timeElapsed)}</span>
            </div>
          )}
        </div>

        {/* Quiz Results */}
        {isSubmitted && quizResults && (
          <Card className="mb-8 border-2 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-green-800">
                {quizResults.passed ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
                Quiz {quizResults.passed ? "Passed" : "Failed"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-700">{quizResults.score}%</div>
                  <div className="text-sm text-green-600">Final Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-700">{quizResults.correctAnswers}</div>
                  <div className="text-sm text-blue-600">Correct Answers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-700">{quizResults.totalQuestions}</div>
                  <div className="text-sm text-purple-600">Total Questions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-700">{formatTime(timeElapsed)}</div>
                  <div className="text-sm text-orange-600">Time Taken</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quiz Content */}
        {questions.length > 0 ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <HelpCircle className="h-5 w-5 text-red-600" />
                  </div>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </div>
                
                {!isSubmitted && (
                  <Badge variant="outline">
                    {Object.keys(userAnswers).length}/{questions.length} answered
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentQuestion && (
                <div className="space-y-6">
                  {/* Question */}
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <p className="text-lg font-medium text-blue-900 leading-relaxed">
                      {currentQuestion.question}
                    </p>
                  </div>

                  {/* Answer Options */}
                  <RadioGroup
                    value={userAnswers[currentQuestionIndex]?.toString()}
                    onValueChange={(value) => handleAnswerSelect(parseInt(value))}
                    disabled={isSubmitted}
                  >
                    {currentQuestion.options.map((option, index) => {
                      const isSelected = userAnswers[currentQuestionIndex] === index;
                      const isCorrect = index === currentQuestion.correctAnswer;
                      const showResults = isSubmitted;
                      
                      return (
                        <div
                          key={index}
                          className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors ${
                            showResults
                              ? isCorrect
                                ? 'border-green-300 bg-green-50'
                                : isSelected && !isCorrect
                                ? 'border-red-300 bg-red-50'
                                : 'border-gray-200 bg-gray-50'
                              : isSelected
                              ? 'border-blue-300 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          data-testid={`option-${index}`}
                        >
                          <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                          <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <span>{option}</span>
                              {showResults && isCorrect && (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              )}
                              {showResults && isSelected && !isCorrect && (
                                <XCircle className="h-5 w-5 text-red-600" />
                              )}
                            </div>
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>

                  {/* Explanation (shown after submission) */}
                  {isSubmitted && currentQuestion.explanation && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                      <h4 className="font-semibold text-yellow-800 mb-2">Explanation:</h4>
                      <p className="text-yellow-700">{currentQuestion.explanation}</p>
                    </div>
                  )}

                  {/* Question Navigation */}
                  <div className="flex justify-between items-center pt-4">
                    <Button
                      variant="outline"
                      onClick={handlePrevQuestion}
                      disabled={currentQuestionIndex === 0}
                      data-testid="button-prev-question"
                    >
                      Previous
                    </Button>

                    <div className="flex gap-2">
                      {!isSubmitted && currentQuestionIndex === questions.length - 1 && (
                        <Button
                          onClick={handleSubmitQuiz}
                          disabled={submitQuizMutation.isPending}
                          data-testid="button-submit-quiz"
                        >
                          {submitQuizMutation.isPending ? "Submitting..." : "Submit Quiz"}
                        </Button>
                      )}
                      
                      {currentQuestionIndex < questions.length - 1 && (
                        <Button
                          onClick={handleNextQuestion}
                          data-testid="button-next-question"
                        >
                          Next
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardContent className="text-center py-12">
              <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <p className="text-muted-foreground">Quiz for Section {section} is being prepared.</p>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Link href={`/course/${courseId}/lesson/${section}`}>
            <Button variant="outline" data-testid="button-back-lesson-flow-bottom">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lesson Flow
            </Button>
          </Link>
          
          {isSubmitted && (
            <Button onClick={handleContinue} data-testid="button-complete-lesson">
              Complete Lesson
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}