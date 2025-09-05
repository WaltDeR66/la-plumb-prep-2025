import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Play, Pause, RotateCcw, CheckCircle, AlertCircle, SkipForward } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StudyPlanTimerProps {
  studyPlan: {
    id: string;
    title: string;
    content: string;
    duration: number;
  };
  onComplete?: () => void;
  onTimeUpdate?: (remainingSeconds: number) => void;
}

interface StudySection {
  title: string;
  content: string;
  startMinute: number;
  endMinute: number;
  completed: boolean;
}

export function StudyPlanTimer({ studyPlan, onComplete, onTimeUpdate }: StudyPlanTimerProps) {
  const { toast } = useToast();
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(studyPlan.duration * 60); // Convert to seconds
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [sections, setSections] = useState<StudySection[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Parse study plan content into timed sections
  useEffect(() => {
    const parsedSections = parseStudyPlanSections(studyPlan.content, studyPlan.duration);
    setSections(parsedSections);
  }, [studyPlan]);

  // Timer logic
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prevTime) => {
          const newTime = prevTime - 1;
          onTimeUpdate?.(newTime);
          
          // Check if we should move to next section
          const currentMinute = studyPlan.duration - Math.floor(newTime / 60);
          const currentSection = sections.find((section, index) => 
            currentMinute >= section.startMinute && currentMinute < section.endMinute && index === currentSectionIndex
          );
          
          if (!currentSection && currentSectionIndex < sections.length - 1) {
            const nextSectionIndex = sections.findIndex((section, index) => 
              currentMinute >= section.startMinute && currentMinute < section.endMinute && index > currentSectionIndex
            );
            
            if (nextSectionIndex !== -1) {
              setCurrentSectionIndex(nextSectionIndex);
              markSectionComplete(currentSectionIndex);
              toast({
                title: "Section Complete!",
                description: `Moving to: ${sections[nextSectionIndex].title}`,
              });
            }
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
  }, [isActive, currentSectionIndex, sections, onTimeUpdate, studyPlan.duration, toast]);

  // Handle timer completion
  useEffect(() => {
    if (timeRemaining === 0) {
      setIsActive(false);
      markSectionComplete(currentSectionIndex);
      toast({
        title: "Study Session Complete!",
        description: `You've completed the ${studyPlan.duration}-minute study plan.`,
        duration: 5000,
      });
      onComplete?.();
    }
  }, [timeRemaining, currentSectionIndex, studyPlan.duration, toast, onComplete]);

  const parseStudyPlanSections = (content: string, totalDuration: number): StudySection[] => {
    const lines = content.split('\n');
    const sectionMatches: StudySection[] = [];
    
    // Look for "Minutes X-Y:" patterns
    lines.forEach((line, index) => {
      const minuteMatch = line.match(/Minutes?\s+(\d+)-(\d+):\s*(.+)/i);
      if (minuteMatch) {
        const startMinute = parseInt(minuteMatch[1]);
        const endMinute = parseInt(minuteMatch[2]);
        const title = minuteMatch[3].trim();
        
        // Get content for this section (next few lines until next section or end)
        let sectionContent = "";
        for (let i = index + 1; i < lines.length; i++) {
          if (lines[i].match(/Minutes?\s+\d+-\d+:/i)) break;
          sectionContent += lines[i] + "\n";
        }
        
        sectionMatches.push({
          title,
          content: sectionContent.trim(),
          startMinute,
          endMinute,
          completed: false
        });
      }
    });
    
    // If no minute patterns found, create sections based on duration
    if (sectionMatches.length === 0) {
      const defaultSections = Math.max(3, Math.floor(totalDuration / 5)); // 5-minute sections minimum
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

  const markSectionComplete = (sectionIndex: number) => {
    setSections(prev => prev.map((section, index) => 
      index === sectionIndex ? { ...section, completed: true } : section
    ));
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimeRemaining(studyPlan.duration * 60);
    setCurrentSectionIndex(0);
    setSections(prev => prev.map(section => ({ ...section, completed: false })));
  };

  const skipToNextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      markSectionComplete(currentSectionIndex);
      setCurrentSectionIndex(currentSectionIndex + 1);
      toast({
        title: "Skipped to Next Section",
        description: sections[currentSectionIndex + 1]?.title,
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentSection = sections[currentSectionIndex];
  const progressPercentage = ((studyPlan.duration * 60 - timeRemaining) / (studyPlan.duration * 60)) * 100;
  const completedSections = sections.filter(s => s.completed).length;

  return (
    <div className="space-y-6">
      {/* Timer Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {studyPlan.title}
          </CardTitle>
          <CardDescription>
            {studyPlan.duration}-minute focused study session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold text-primary" data-testid="timer-display">
              {formatTime(timeRemaining)}
            </div>
            
            <Progress value={progressPercentage} className="h-3" />
            
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>{completedSections} of {sections.length} sections completed</span>
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
              
              {currentSectionIndex < sections.length - 1 && (
                <Button
                  onClick={skipToNextSection}
                  variant="outline"
                  className="flex items-center gap-2"
                  data-testid="timer-skip"
                >
                  <SkipForward className="h-4 w-4" />
                  Skip Section
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Section */}
      {currentSection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className={`h-5 w-5 ${currentSection.completed ? 'text-green-600' : 'text-muted-foreground'}`} />
                Current Focus: {currentSection.title}
              </span>
              <Badge variant="outline">
                Minutes {currentSection.startMinute}-{currentSection.endMinute}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-line text-sm leading-relaxed">
              {currentSection.content}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Study Plan Sections</CardTitle>
          <CardDescription>Track your progress through each focus area</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sections.map((section, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  index === currentSectionIndex 
                    ? 'border-primary bg-primary/5' 
                    : section.completed 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200'
                }`}
                data-testid={`section-${index}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    section.completed 
                      ? 'bg-green-600 text-white' 
                      : index === currentSectionIndex 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    {section.completed ? <CheckCircle className="h-3 w-3" /> : index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{section.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Minutes {section.startMinute}-{section.endMinute}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {section.completed && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Complete
                    </Badge>
                  )}
                  {index === currentSectionIndex && !section.completed && (
                    <Badge variant="default">
                      Current
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}