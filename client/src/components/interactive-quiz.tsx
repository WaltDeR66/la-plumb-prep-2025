import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  BookOpen,
  RotateCcw,
  ArrowRight,
  MessageCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  codeReference?: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'very_hard';
}

interface QuizAttempt {
  id: string;
  questions: QuizQuestion[];
  userAnswers: { [questionIndex: number]: number };
  score?: number;
  passed?: boolean;
  incorrectQuestions?: QuizQuestion[];
}

interface InteractiveQuizProps {
  section: string;
  contentId: string;
  title?: string;
  onComplete?: () => void;
}

export default function InteractiveQuiz({ section, contentId, title, onComplete }: InteractiveQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [startTime] = useState(Date.now());
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Fetch quiz questions for this section
  const { data: quizData, isLoading } = useQuery<QuizAttempt>({
    queryKey: [`/api/quiz/${section}/start`],
    queryFn: async () => {
      const response = await fetch(`/api/quiz/${section}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to start quiz");
      return response.json();
    },
  });

  // Submit quiz mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const questionsWithAnswers = quizData?.questions.map((q, index) => ({
        id: q.id,
        question: q.question,  // Keep consistent field naming
        userAnswer: answers[index] ?? null,
        correctAnswer: q.correctAnswer,
        isCorrect: answers[index] === q.correctAnswer
      }));

      return await apiRequest("POST", `/api/quiz/${section}/submit`, {
        contentId,
        questions: questionsWithAnswers,
        timeSpent
      });
    },
    onSuccess: (result: any) => {
      setIsSubmitted(true);
      queryClient.invalidateQueries({ queryKey: [`/api/quiz/${section}`] });
      
      if (result.passed) {
        toast({
          title: "Congratulations!",
          description: `You passed with ${result.score}%! Moving to next section.`,
        });
        setTimeout(() => onComplete?.(), 2000);
      } else {
        toast({
          title: "Keep studying!",
          description: `You scored ${result.score}%. Let's review your mistakes with AI help.`,
          variant: "destructive",
        });
        // Automatically redirect to AI chat instead of showing review
        handleGetAIHelp();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading quiz questions...</p>
        </div>
      </div>
    );
  }

  if (!quizData?.questions?.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No questions available for this section.</p>
        </CardContent>
      </Card>
    );
  }

  const questions = quizData.questions;
  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  const handleAnswerChange = (answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: answerIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleQuestionJump = (questionIndex: number) => {
    setCurrentQuestion(questionIndex);
  };

  const handleSubmit = () => {
    if (!allAnswered) {
      toast({
        title: "Incomplete Quiz",
        description: "Please answer all questions before submitting.",
        variant: "destructive",
      });
      return;
    }
    submitMutation.mutate();
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setIsSubmitted(false);
    setShowReview(false);
    queryClient.invalidateQueries({ queryKey: [`/api/quiz/${section}`] });
  };

  const handleGetAIHelp = () => {
    // Calculate results for AI context
    const incorrectQuestions = questions.filter((_, index) => 
      answers[index] !== undefined && answers[index] !== questions[index].correctAnswer
    );
    const score = Math.round((Object.keys(answers).length - incorrectQuestions.length) / questions.length * 100);

    // Create a summary of incorrect questions for AI context
    const incorrectQuestionsText = incorrectQuestions.map((question, index) => {
      const originalIndex = questions.findIndex(q => q.id === question.id);
      const userAnswer = answers[originalIndex];
      const correctAnswer = question.correctAnswer;
      
      return `Question ${originalIndex + 1}: ${question.question}\n` +
        `Your answer: ${question.options[userAnswer]}\n` +
        `Correct answer: ${question.options[correctAnswer]}\n` +
        `${question.explanation ? `Explanation: ${question.explanation}\n` : ''}` +
        `${question.codeReference ? `Code Reference: ${question.codeReference}\n` : ''}`;
    }).join('\n---\n');

    // Navigate to AI mentor with context about incorrect questions
    const aiContext = {
      type: 'quiz_review',
      section: section,
      title: title || `Section ${section} Quiz`,
      incorrectCount: incorrectQuestions.length,
      totalQuestions: questions.length,
      score: score,
      questions: incorrectQuestionsText
    };

    // Store context in session storage for the AI mentor to use
    sessionStorage.setItem('aiMentorContext', JSON.stringify(aiContext));
    
    // Navigate to study companion (AI mentor)
    setLocation('/study-companion');
  };

  // Calculate results for completion check
  const score = Math.round((answeredCount - questions.filter((_, index) => 
    answers[index] !== undefined && answers[index] !== questions[index].correctAnswer
  ).length) / questions.length * 100);
  
  // Check if this is a chapter review (requires 80%) or regular quiz (requires 70%)
  const isChapterReview = title?.toLowerCase().includes('chapter review') || false;
  const requiredScore = isChapterReview ? 80 : 70;
  const passed = score >= requiredScore;

  if (isSubmitted && passed) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-green-700">Congratulations!</h2>
            <p className="text-lg">You passed with {score}%</p>
            <p className="text-muted-foreground">
              You can now proceed to the next section.
            </p>
          </div>
          
          <Button onClick={() => onComplete?.()} className="w-full max-w-sm">
            <ArrowRight className="w-4 h-4 mr-2" />
            Continue to Next Section
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress and Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Section {section} Quiz</CardTitle>
            <Badge variant="secondary">
              Question {currentQuestion + 1} of {questions.length}
            </Badge>
          </div>
          <Progress value={progress} className="w-full" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress: {Math.round(progress)}%</span>
            <span>Answered: {answeredCount}/{questions.length}</span>
          </div>
        </CardHeader>
      </Card>

      {/* Question Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {questions.map((_, index) => (
              <Button
                key={index}
                variant={
                  index === currentQuestion 
                    ? "default" 
                    : answers[index] !== undefined 
                    ? "secondary" 
                    : "outline"
                }
                size="sm"
                onClick={() => handleQuestionJump(index)}
                className="w-10 h-10"
                data-testid={`question-nav-${index + 1}`}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Question {currentQuestion + 1}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg font-medium">{currentQ.question}</p>
          
          <RadioGroup
            value={answers[currentQuestion]?.toString() || ""}
            onValueChange={(value) => handleAnswerChange(parseInt(value))}
          >
            {currentQ.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 rounded border hover:bg-gray-50">
                <RadioGroupItem 
                  value={index.toString()} 
                  id={`option-${index}`}
                  data-testid={`answer-option-${String.fromCharCode(65 + index)}`}
                />
                <Label 
                  htmlFor={`option-${index}`} 
                  className="flex-1 cursor-pointer"
                >
                  <span className="font-medium mr-2">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Navigation Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              data-testid="button-previous-question"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              {currentQuestion < questions.length - 1 ? (
                <Button
                  onClick={handleNext}
                  data-testid="button-next-question"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!allAnswered || submitMutation.isPending}
                  variant={allAnswered ? "default" : "secondary"}
                  data-testid="button-submit-quiz"
                >
                  {submitMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Quiz
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Answer Summary */}
      {answeredCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Answer Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {answeredCount} of {questions.length} questions answered
              {!allAnswered && (
                <span className="text-orange-600 ml-2">
                  ({questions.length - answeredCount} remaining)
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}