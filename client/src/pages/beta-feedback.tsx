import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Star, MessageSquare, Building2 } from "lucide-react";
import { useForm } from "react-hook-form";

interface FeedbackQuestion {
  id: string;
  questionText: string;
  questionType: string;
  options?: string[];
  isRequired: boolean;
}

interface FeedbackCampaign {
  id: string;
  title: string;
  description: string;
  monthYear: string;
  dueDate: string;
}

export default function BetaFeedback() {
  const [location] = useLocation();
  const [campaign, setCampaign] = useState<FeedbackCampaign | null>(null);
  const [questions, setQuestions] = useState<FeedbackQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm();

  const token = new URLSearchParams(location.split('?')[1] || '').get('token');

  useEffect(() => {
    if (!token) {
      toast({
        title: "Invalid Link",
        description: "This feedback link is invalid or expired",
        variant: "destructive",
      });
      return;
    }
    loadFeedbackForm();
  }, [token]);

  const loadFeedbackForm = async () => {
    try {
      const response = await apiRequest("GET", `/api/beta-feedback/${token}`);
      const data = await response.json();
      setCampaign(data.campaign);
      setQuestions(data.questions);
    } catch (error: any) {
      console.error("Error loading feedback form:", error);
      toast({
        title: "Error Loading Form",
        description: "Unable to load the feedback form. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    if (!token || !campaign) return;
    
    setIsSubmitting(true);
    try {
      const responses: Record<string, any> = {};
      
      // Process form data into responses object
      Object.keys(data).forEach(key => {
        if (key.startsWith('question_')) {
          const questionId = key.replace('question_', '');
          responses[questionId] = data[key];
        }
      });

      await apiRequest("POST", `/api/beta-feedback/${token}/submit`, {
        responses
      });

      setIsSubmitted(true);
      toast({
        title: "Feedback Submitted!",
        description: "Thank you for helping us improve LA Plumb Prep",
      });
    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Submission Error",
        description: "There was an error submitting your feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: FeedbackQuestion, index: number) => {
    const fieldName = `question_${question.id}`;
    
    switch (question.questionType) {
      case 'text':
        return (
          <div key={question.id} className="space-y-2">
            <Label htmlFor={fieldName} className="text-sm font-medium">
              {question.questionText}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              {...register(fieldName, { required: question.isRequired })}
              placeholder="Type your answer here..."
              data-testid={`feedback-input-${index}`}
            />
            {errors[fieldName] && (
              <p className="text-sm text-red-500">This field is required</p>
            )}
          </div>
        );
        
      case 'textarea':
        return (
          <div key={question.id} className="space-y-2">
            <Label htmlFor={fieldName} className="text-sm font-medium">
              {question.questionText}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={fieldName}
              {...register(fieldName, { required: question.isRequired })}
              placeholder="Please share your detailed thoughts..."
              rows={4}
              data-testid={`feedback-textarea-${index}`}
            />
            {errors[fieldName] && (
              <p className="text-sm text-red-500">This field is required</p>
            )}
          </div>
        );
        
      case 'rating':
        return (
          <div key={question.id} className="space-y-3">
            <Label className="text-sm font-medium">
              {question.questionText}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup 
              onValueChange={(value) => setValue(fieldName, value)}
              data-testid={`feedback-rating-${index}`}
            >
              {[1, 2, 3, 4, 5].map((rating) => (
                <div key={rating} className="flex items-center space-x-2">
                  <RadioGroupItem value={rating.toString()} id={`${fieldName}_${rating}`} />
                  <Label htmlFor={`${fieldName}_${rating}`} className="flex items-center cursor-pointer">
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm">
                      {rating === 1 && "Poor"}
                      {rating === 2 && "Fair"}
                      {rating === 3 && "Good"}
                      {rating === 4 && "Very Good"}
                      {rating === 5 && "Excellent"}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {errors[fieldName] && (
              <p className="text-sm text-red-500">Please select a rating</p>
            )}
          </div>
        );
        
      case 'multiple_choice':
        return (
          <div key={question.id} className="space-y-3">
            <Label className="text-sm font-medium">
              {question.questionText}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup 
              onValueChange={(value) => setValue(fieldName, value)}
              data-testid={`feedback-choice-${index}`}
            >
              {question.options?.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${fieldName}_${optionIndex}`} />
                  <Label htmlFor={`${fieldName}_${optionIndex}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {errors[fieldName] && (
              <p className="text-sm text-red-500">Please select an option</p>
            )}
          </div>
        );
        
      case 'boolean':
        return (
          <div key={question.id} className="space-y-3">
            <Label className="text-sm font-medium">
              {question.questionText}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup 
              onValueChange={(value) => setValue(fieldName, value === 'true')}
              data-testid={`feedback-boolean-${index}`}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id={`${fieldName}_yes`} />
                <Label htmlFor={`${fieldName}_yes`} className="cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id={`${fieldName}_no`} />
                <Label htmlFor={`${fieldName}_no`} className="cursor-pointer">No</Label>
              </div>
            </RadioGroup>
            {errors[fieldName] && (
              <p className="text-sm text-red-500">Please select an option</p>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold mb-2">Loading Feedback Form...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-primary">LA Plumb Prep</h1>
              <p className="text-xs text-muted-foreground">Beta Feedback Program</p>
            </div>
          </div>
          
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <h2 className="text-3xl font-bold text-foreground mb-4">Thank You!</h2>
          <p className="text-muted-foreground mb-8">
            Your feedback has been submitted successfully. Your insights help us improve LA Plumb Prep for all users.
          </p>
          
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <p className="text-blue-800">
                <strong>Remember:</strong> As long as you continue as an active student and complete these monthly feedback surveys, your beta pricing is locked in for all current and future courses.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Feedback Form Not Found</h2>
          <p className="text-muted-foreground">This feedback link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-primary">LA Plumb Prep</h1>
              <p className="text-xs text-muted-foreground">Beta Feedback Program</p>
            </div>
          </div>
          
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-6 h-6 text-blue-600" />
          </div>
          
          <h2 className="text-3xl font-bold text-foreground mb-2" data-testid="feedback-title">
            {campaign.title}
          </h2>
          {campaign.description && (
            <p className="text-muted-foreground mb-4">
              {campaign.description}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Due Date: {new Date(campaign.dueDate).toLocaleDateString()}
          </p>
        </div>

        {/* Beta Info Card */}
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 text-lg">Beta Tester Benefits</CardTitle>
          </CardHeader>
          <CardContent className="text-orange-700">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <span>Keep your discounted beta pricing forever</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <span>Help shape the future of plumbing education</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <span>Access to new features before anyone else</span>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-orange-100 rounded border border-orange-300">
              <p className="text-xs font-medium">
                <strong>Important:</strong> Complete this monthly survey to maintain your beta status and locked pricing.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Feedback</CardTitle>
              <CardDescription>
                Your responses help us improve the platform for all users.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.map((question, index) => renderQuestion(question, index))}
            </CardContent>
          </Card>
          
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={isSubmitting}
            data-testid="submit-feedback"
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </form>
      </div>
    </div>
  );
}