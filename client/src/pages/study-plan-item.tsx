import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  ArrowLeft, 
  CheckCircle, 
  Play, 
  Pause, 
  RotateCcw,
  ArrowRight,
  BookOpen
} from "lucide-react";

// Map friendly course identifiers to database UUIDs
function getCourseUUID(courseSlug: string): string {
  const courseMapping: { [key: string]: string } = {
    'journeyman-prep': '5f02238b-afb2-4e7f-a488-96fb471fee56',
    'backflow-prevention': 'b1f02238b-afb2-4e7f-a488-96fb471fee57',
    'natural-gas': 'c2f02238b-afb2-4e7f-a488-96fb471fee58',
    'medical-gas': 'd3f02238b-afb2-4e7f-a488-96fb471fee59',
    'master-plumber': 'e4f02238b-afb2-4e7f-a488-96fb471fee60'
  };
  return courseMapping[courseSlug] || courseSlug;
}

interface StudyPlan {
  id: string;
  title: string;
  content: string;
  duration: number;
}

interface StudySection {
  title: string;
  content: string;
  startMinute: number;
  endMinute: number;
  completed: boolean;
}

export default function StudyPlanItem() {
  const [match, params] = useRoute("/study-plans/:courseId/:duration/:itemIndex");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const courseId = params?.courseId;
  const duration = params?.duration ? parseInt(params.duration) : 0;
  const itemIndex = params?.itemIndex ? parseInt(params.itemIndex) : 0;

  if (!courseId || !duration) {
    return <div>Study plan not found</div>;
  }

  // Resolve friendly course ID to UUID for API calls
  const resolvedCourseId = getCourseUUID(courseId);

  const { data: studyPlans } = useQuery<StudyPlan[]>({
    queryKey: [`/api/courses/${resolvedCourseId}/study-plans`],
    enabled: !!resolvedCourseId,
  });

  // Find the study plan for this duration
  const studyPlan = studyPlans?.find(plan => plan.duration === duration);

  // Parse study plan sections
  const parseStudyPlanSections = (content: string, totalDuration: number): StudySection[] => {
    const lines = content.split('\n');
    const sectionMatches: StudySection[] = [];
    
    let currentTitle = '';
    let currentContent = '';
    let currentStartMinute = 0;
    let currentEndMinute = 0;
    
    lines.forEach((line, index) => {
      const minuteMatch = line.match(/\*\*Minutes (\d+)-(\d+): (.+)\*\*/);
      
      if (minuteMatch) {
        // If we have a previous section, save it
        if (currentTitle) {
          sectionMatches.push({
            title: currentTitle,
            content: currentContent.trim(),
            startMinute: currentStartMinute,
            endMinute: currentEndMinute,
            completed: false
          });
        }
        
        // Start new section
        currentStartMinute = parseInt(minuteMatch[1]);
        currentEndMinute = parseInt(minuteMatch[2]);
        currentTitle = minuteMatch[3];
        currentContent = '';
      } else if (line.startsWith('**Minutes') && line.includes(':')) {
        // Handle next section start
        if (currentTitle) {
          sectionMatches.push({
            title: currentTitle,
            content: currentContent.trim(),
            startMinute: currentStartMinute,
            endMinute: currentEndMinute,
            completed: false
          });
        }
      } else if (currentTitle && line.trim()) {
        // Add content to current section
        currentContent += line + '\n';
      }
    });
    
    // Add the last section
    if (currentTitle) {
      sectionMatches.push({
        title: currentTitle,
        content: currentContent.trim(),
        startMinute: currentStartMinute,
        endMinute: currentEndMinute,
        completed: false
      });
    }
    
    // If no sections found, create default sections
    if (sectionMatches.length === 0 && content) {
      const defaultSections = Math.max(3, Math.floor(totalDuration / 5));
      const sectionDuration = totalDuration / defaultSections;
      
      for (let i = 0; i < defaultSections; i++) {
        sectionMatches.push({
          title: `Section ${i + 1}`,
          content: content.substring(i * 100, (i + 1) * 100) + "...",
          startMinute: Math.floor(i * sectionDuration),
          endMinute: Math.floor((i + 1) * sectionDuration),
          completed: false
        });
      }
    }
    
    return sectionMatches;
  };

  const [sections, setSections] = useState<StudySection[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(itemIndex);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize sections when study plan loads
  useEffect(() => {
    if (studyPlan) {
      const parsedSections = parseStudyPlanSections(studyPlan.content, studyPlan.duration);
      setSections(parsedSections);
      
      // Set timer for current section
      if (parsedSections[itemIndex]) {
        const sectionDuration = (parsedSections[itemIndex].endMinute - parsedSections[itemIndex].startMinute) * 60;
        setTimeRemaining(sectionDuration);
      }
    }
  }, [studyPlan, itemIndex]);

  // Timer logic
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prevTime) => {
          const newTime = prevTime - 1;
          if (newTime <= 0) {
            setIsActive(false);
            toast({
              title: "Section Complete!",
              description: "Time's up for this section. Great job!",
              duration: 3000,
            });
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, timeRemaining, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentSection = sections[currentSectionIndex];
  const isLastSection = currentSectionIndex >= sections.length - 1;
  const nextSectionIndex = currentSectionIndex + 1;

  const handleComplete = () => {
    if (isLastSection) {
      // Return to study plans page when finished
      toast({
        title: "Study Plan Complete!",
        description: "Congratulations! You've completed the entire study plan.",
        duration: 5000,
      });
      navigate(`/study-plans/${courseId}`);
    } else {
      // Go to next section
      navigate(`/study-plans/${courseId}/${duration}/${nextSectionIndex}`);
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    if (currentSection) {
      const sectionDuration = (currentSection.endMinute - currentSection.startMinute) * 60;
      setTimeRemaining(sectionDuration);
    }
  };

  if (!studyPlan || !currentSection) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Study plan section not found</h1>
          <Button asChild>
            <Link href={`/study-plans/${courseId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Study Plans
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const progressPercentage = currentSection ? 
    (((currentSection.endMinute - currentSection.startMinute) * 60 - timeRemaining) / 
     ((currentSection.endMinute - currentSection.startMinute) * 60)) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" asChild data-testid="back-to-study-plans">
          <Link href={`/study-plans/${courseId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Study Plans
          </Link>
        </Button>
        
        <div className="text-center">
          <Badge variant="outline" className="bg-primary/10 text-primary">
            {duration === 60 ? '1 Hour' : `${duration} Minutes`} Study Plan
          </Badge>
          <p className="text-sm text-muted-foreground mt-1">
            Section {currentSectionIndex + 1} of {sections.length}
          </p>
        </div>
      </div>

      {/* Timer Card */}
      <Card className="mb-6">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Clock className="h-5 w-5" />
            {currentSection.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Minutes {currentSection.startMinute}-{currentSection.endMinute}
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold text-primary" data-testid="timer-display">
              {formatTime(timeRemaining)}
            </div>
            
            <Progress value={progressPercentage} className="h-3" />
            
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "Active" : "Paused"}
              </Badge>
            </div>
            
            <div className="flex justify-center gap-2">
              <Button
                onClick={toggleTimer}
                variant={isActive ? "secondary" : "default"}
                className="flex items-center gap-2"
                data-testid="timer-toggle"
              >
                {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isActive ? "Pause" : "Start"}
              </Button>
              
              <Button
                onClick={resetTimer}
                variant="outline"
                className="flex items-center gap-2"
                data-testid="timer-reset"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Study Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-line text-sm leading-relaxed">
            {currentSection.content || "Study content for this section is being prepared."}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Progress: {currentSectionIndex + 1} of {sections.length} sections
        </div>
        
        <Button 
          onClick={handleComplete}
          size="lg"
          className="flex items-center gap-2"
          data-testid="complete-section-button"
        >
          <CheckCircle className="h-4 w-4" />
          {isLastSection ? "Complete Study Plan" : "Complete & Continue"}
          {!isLastSection && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}