import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Clock, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CompetitionTest() {
  const { competitionId } = useParams<{ competitionId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [startTime] = useState(Date.now());

  // Start competition attempt
  const { data: attempt, isLoading } = useQuery({
    queryKey: [`/api/competitions/${competitionId}/start`],
    queryFn: async () => {
      const response = await fetch(`/api/competitions/${competitionId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to start competition");
      return response.json();
    },
    enabled: !!competitionId,
  });

  // Submit competition attempt
  const submitMutation = useMutation({
    mutationFn: async (submissionData: any) => {
      const response = await fetch(`/api/competitions/${competitionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });
      if (!response.ok) throw new Error("Failed to submit competition");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/competitions/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points/summary"] });
      
      toast({
        title: "Competition Submitted!",
        description: `You scored ${data.score}% and earned ${data.pointsEarned} points!`,
      });
      
      setLocation("/competitions");
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Timer effect
  useEffect(() => {
    if (!attempt) return;
    
    const competition = attempt.competition;
    const timeLimitMs = competition.timeLimit * 60 * 1000;
    const endTime = startTime + timeLimitMs;
    
    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        handleSubmit();
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [attempt, startTime]);

  const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const handleSubmit = () => {
    if (!attempt) return;
    
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const questions = attempt.questions.map((q: any, index: number) => ({
      ...q,
      userAnswer: answers[index] ?? null
    }));
    
    submitMutation.mutate({
      questions,
      timeSpent
    });
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-6 h-6" />
                Competition Not Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>This competition is not currently available or you may have already completed it.</p>
              <Button onClick={() => setLocation("/competitions")} className="mt-4">
                Return to Competitions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const questions = attempt.questions;
  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8" data-testid="competition-test">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold" data-testid="competition-title">
              {attempt.competition.title}
            </h1>
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Clock className="w-5 h-5" />
              <span data-testid="time-remaining" className={timeRemaining < 300000 ? "text-red-600" : ""}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span data-testid="answered-count">{answeredCount} answered</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg" data-testid="question-text">
              {currentQ.question}
            </CardTitle>
            {currentQ.category && (
              <p className="text-sm text-gray-600" data-testid="question-category">
                Category: {currentQ.category}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={answers[currentQuestion]?.toString()} 
              onValueChange={(value) => handleAnswerChange(currentQuestion, parseInt(value))}
            >
              {currentQ.options.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={index.toString()} 
                    id={`option-${index}`}
                    data-testid={`option-${index}`}
                  />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            data-testid="prev-question"
          >
            Previous
          </Button>
          
          <div className="text-sm text-gray-600">
            {answers[currentQuestion] !== undefined && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                Answered
              </span>
            )}
          </div>
          
          <Button
            onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
            disabled={currentQuestion === questions.length - 1}
            data-testid="next-question"
          >
            Next
          </Button>
        </div>

        {/* Question Navigation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Question Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-10 gap-2">
              {questions.map((_: any, index: number) => (
                <Button
                  key={index}
                  variant={currentQuestion === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-10 h-10 ${
                    answers[index] !== undefined 
                      ? "bg-green-100 border-green-300 text-green-700" 
                      : ""
                  }`}
                  data-testid={`nav-question-${index}`}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit Section */}
        <Card>
          <CardHeader>
            <CardTitle>Submit Competition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600" data-testid="total-questions">
                    {questions.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Questions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600" data-testid="answered-questions">
                    {answeredCount}
                  </div>
                  <div className="text-sm text-gray-600">Answered</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600" data-testid="unanswered-questions">
                    {questions.length - answeredCount}
                  </div>
                  <div className="text-sm text-gray-600">Remaining</div>
                </div>
              </div>
              
              {questions.length - answeredCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    You have {questions.length - answeredCount} unanswered questions. 
                    You can submit now or continue answering.
                  </p>
                </div>
              )}
              
              <Button 
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                className="w-full"
                data-testid="submit-competition"
              >
                {submitMutation.isPending ? "Submitting..." : "Submit Competition"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}