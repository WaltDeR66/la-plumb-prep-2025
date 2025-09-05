import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, BookOpen } from "lucide-react";
import { StudyPlanTimer } from "./StudyPlanTimer";

interface StudyPlan {
  id: string;
  title: string;
  content: string;
  duration: number;
}

interface StudyPlanSelectorProps {
  studyPlans: StudyPlan[];
  lessonTitle: string;
  onStartSession?: (studyPlan: StudyPlan) => void;
  onCompleteSession?: () => void;
}

export function StudyPlanSelector({ 
  studyPlans, 
  lessonTitle, 
  onStartSession, 
  onCompleteSession 
}: StudyPlanSelectorProps) {
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Group study plans by duration for easy selection
  const groupedPlans = studyPlans.reduce((acc, plan) => {
    const duration = plan.duration;
    if (!acc[duration]) acc[duration] = [];
    acc[duration].push(plan);
    return acc;
  }, {} as Record<number, StudyPlan[]>);

  const durations = Object.keys(groupedPlans).map(Number).sort((a, b) => a - b);

  const handleSelectPlan = (plan: StudyPlan) => {
    setSelectedPlan(plan);
    setIsTimerActive(true);
    if (onStartSession) {
      onStartSession(plan);
    }
  };

  const handleTimerComplete = () => {
    setIsTimerActive(false);
    setSelectedPlan(null);
    if (onCompleteSession) {
      onCompleteSession();
    }
  };

  if (isTimerActive && selectedPlan) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Active Study Session</h3>
          <Button 
            variant="outline" 
            onClick={() => setIsTimerActive(false)}
            data-testid="exit-timer"
          >
            Exit Timer
          </Button>
        </div>
        <StudyPlanTimer
          studyPlan={selectedPlan}
          onComplete={handleTimerComplete}
        />
      </div>
    );
  }

  if (studyPlans.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Study Plans Available</h3>
          <p className="text-muted-foreground">
            Study plans for this lesson haven't been created yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose Your Study Time</h3>
        <p className="text-muted-foreground">
          Select how much time you have to study <strong>{lessonTitle}</strong> today
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {durations.map(duration => {
          const plansForDuration = groupedPlans[duration];
          const primaryPlan = plansForDuration[0]; // Use first plan as primary
          
          return (
            <Card 
              key={duration}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleSelectPlan(primaryPlan)}
              data-testid={`study-plan-${duration}`}
            >
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">
                  {duration} minutes
                </CardTitle>
                <CardDescription>
                  Focused study session
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-3">
                  <Badge variant="outline" className="mb-2">
                    {plansForDuration.length} plan{plansForDuration.length > 1 ? 's' : ''} available
                  </Badge>
                  
                  <div className="text-sm text-muted-foreground">
                    {primaryPlan.title}
                  </div>
                  
                  <Button 
                    className="w-full flex items-center justify-center gap-2"
                    data-testid={`start-${duration}-min`}
                  >
                    <Play className="h-4 w-4" />
                    Start {duration}-Min Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Preview of Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available Study Plans</CardTitle>
          <CardDescription>
            Structured learning sessions tailored to your available time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {studyPlans.map((plan, index) => (
              <div
                key={plan.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                data-testid={`plan-preview-${index}`}
              >
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">
                    {plan.duration} min
                  </Badge>
                  <span className="font-medium text-sm">{plan.title}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSelectPlan(plan)}
                  className="flex items-center gap-1"
                >
                  <Play className="h-3 w-3" />
                  Start
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}