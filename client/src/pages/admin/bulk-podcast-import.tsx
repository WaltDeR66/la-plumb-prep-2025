import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Mic, Volume2, Play, Pause, Download, Save, CheckCircle } from "lucide-react";

export default function BulkPodcastImport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("hard");
  
  // TTS Integration for podcast creation
  const [ttsTitle, setTtsTitle] = useState("");
  const [ttsContent, setTtsContent] = useState("");
  const [ttsError, setTtsError] = useState("");
  const [ttsAudioResult, setTtsAudioResult] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [frozenSentences, setFrozenSentences] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const textScrollRef = useRef<HTMLDivElement>(null);

  // Parse text into sentences with timing estimates for TTS
  const parseTextIntoSentences = (text: string) => {
    if (!text) return [];
    
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    const wordsPerSecond = 2.5; // Average speech rate
    let currentStartTime = 0;
    
    return sentences.map((sentence, index) => {
      const wordCount = sentence.split(/\s+/).filter(w => w.length > 0).length;
      const duration = wordCount / wordsPerSecond;
      const startTime = currentStartTime;
      currentStartTime += duration;
      
      return {
        index,
        text: sentence.trim(),
        startTime,
        endTime: currentStartTime,
        duration,
        wordCount
      };
    });
  };

  const sentences = ttsAudioResult ? frozenSentences : parseTextIntoSentences(ttsContent);

  // TTS Audio event handlers
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => {
          console.error('Audio play failed:', error);
          setIsPlaying(false);
        });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      
      const currentSentence = sentences.findIndex(s => 
        time >= s.startTime && time < s.endTime
      );
      if (currentSentence !== -1 && currentSentence !== currentSentenceIndex) {
        setCurrentSentenceIndex(currentSentence);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const actualDuration = audioRef.current.duration;
      setDuration(actualDuration);
      
      if (ttsAudioResult && frozenSentences.length > 0 && Math.abs(actualDuration - ttsAudioResult.duration) > 0.1) {
        const rescaleFactor = actualDuration / ttsAudioResult.duration;
        const rescaledSentences = frozenSentences.map(sentence => ({
          ...sentence,
          startTime: sentence.startTime * rescaleFactor,
          endTime: sentence.endTime * rescaleFactor,
          duration: sentence.duration * rescaleFactor
        }));
        setFrozenSentences(rescaledSentences);
      }
    }
  };

  const handleSentenceClick = (sentenceIndex: number) => {
    if (audioRef.current && sentences[sentenceIndex]) {
      audioRef.current.currentTime = sentences[sentenceIndex].startTime;
      setCurrentSentenceIndex(sentenceIndex);
    }
  };

  useEffect(() => {
    if (textScrollRef.current && sentences.length > 0) {
      const currentElement = textScrollRef.current.querySelector(`[data-sentence="${currentSentenceIndex}"]`);
      if (currentElement) {
        currentElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }
  }, [currentSentenceIndex]);

  // TTS Generation mutation
  const generateTTSMutation = useMutation({
    mutationFn: async (data: { text: string; title: string }) => {
      const response = await apiRequest("POST", "/api/text-to-speech", data);
      return response.json();
    },
    onSuccess: (result: any) => {
      if (result.success) {
        const generatedSentences = parseTextIntoSentences(ttsContent);
        const totalEstimatedDuration = generatedSentences.reduce((sum, s) => sum + s.duration, 0);
        const scaleFactor = result.duration / totalEstimatedDuration;
        
        const normalizedSentences = generatedSentences.map(sentence => ({
          ...sentence,
          startTime: sentence.startTime * scaleFactor,
          endTime: sentence.endTime * scaleFactor,
          duration: sentence.duration * scaleFactor
        }));
        
        setFrozenSentences(normalizedSentences);
        setCurrentSentenceIndex(0);
        setCurrentTime(0);
        
        setTtsAudioResult({
          audioUrl: result.audioUrl,
          title: result.title,
          duration: result.duration,
          contentId: result.contentId
        });
        
        toast({
          title: "Audio Generated Successfully!",
          description: `Generated ${Math.floor(result.duration / 60)}:${(result.duration % 60).toString().padStart(2, '0')} of audio`,
        });
      } else {
        setTtsError(result.message || "Failed to generate audio");
      }
    },
    onError: (error: any) => {
      setTtsError(error.message || "Failed to generate audio");
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to convert text to speech",
        variant: "destructive",
      });
    }
  });

  const handleTTSGenerate = () => {
    if (!ttsContent.trim()) {
      setTtsError("Please enter content to convert to speech");
      return;
    }

    if (ttsContent.length > 4096) {
      setTtsError("Content must be 4096 characters or less");
      return;
    }

    setTtsError("");
    generateTTSMutation.mutate({
      text: ttsContent,
      title: ttsTitle || "Generated Podcast Audio"
    });
  };

  const handleTTSClear = () => {
    setTtsTitle("");
    setTtsContent("");
    setTtsAudioResult(null);
    setTtsError("");
    setFrozenSentences([]);
    setCurrentSentenceIndex(0);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleTTSDownload = () => {
    if (ttsAudioResult) {
      const link = document.createElement('a');
      link.href = ttsAudioResult.audioUrl;
      link.download = `${ttsAudioResult.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Save TTS episode to podcast system
  const saveTTSEpisodeMutation = useMutation({
    mutationFn: async (episodeData: any) => {
      const response = await apiRequest("POST", "/api/admin/podcast/create-episode", episodeData);
      return response.json();
    },
    onSuccess: (result: any) => {
      toast({
        title: "Episode Saved Successfully!",
        description: `"${ttsTitle || 'Generated Episode'}" has been added to the course and is now available to students.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/course-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      
      // Clear the TTS form after successful save
      handleTTSClear();
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save episode to course",
        variant: "destructive",
      });
    }
  });

  const handleSaveTTSEpisode = () => {
    if (!ttsAudioResult) {
      toast({
        title: "No Audio Generated",
        description: "Please generate audio first before saving the episode",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCourse) {
      toast({
        title: "No Course Selected",
        description: "Please select a course before saving the episode",
        variant: "destructive",
      });
      return;
    }

    if (!selectedChapter || !selectedSection) {
      toast({
        title: "Missing Organization",
        description: "Please select both chapter and section before saving",
        variant: "destructive",
      });
      return;
    }

    const episodeData = {
      courseId: selectedCourse,
      chapter: selectedChapter,
      section: selectedSection,
      difficulty: selectedDifficulty,
      title: ttsTitle || "Generated Podcast Episode",
      transcript: ttsContent,
      audioUrl: ttsAudioResult.audioUrl,
      duration: ttsAudioResult.duration,
      contentId: ttsAudioResult.contentId,
      type: 'podcast'
    };

    saveTTSEpisodeMutation.mutate(episodeData);
  };

  // Fetch courses
  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
  });


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Podcast Import with Text-to-Speech</h1>
          <p className="text-muted-foreground">
            Create podcast episodes with synchronized audio and scrolling text
          </p>
        </div>

        {/* Course Organization */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Course & Louisiana Plumbing Code Organization</CardTitle>
            <CardDescription>Choose course, chapter, section and difficulty level for your podcast episode</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="course">Select Course</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {(courses as any[])?.map((course: any) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="chapter">Chapter</Label>
                <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chapter 1">Chapter 1 - Administration</SelectItem>
                    <SelectItem value="Chapter 2">Chapter 2 - Definitions</SelectItem>
                    <SelectItem value="Chapter 3">Chapter 3 - General Regulations</SelectItem>
                    <SelectItem value="Chapter 4">Chapter 4 - Fixtures, Faucets and Fittings</SelectItem>
                    <SelectItem value="Chapter 5">Chapter 5 - Water Heaters</SelectItem>
                    <SelectItem value="Chapter 6">Chapter 6 - Water Supply and Distribution</SelectItem>
                    <SelectItem value="Chapter 7">Chapter 7 - Sanitary Drainage</SelectItem>
                    <SelectItem value="Chapter 8">Chapter 8 - Indirect/Special Waste</SelectItem>
                    <SelectItem value="Chapter 9">Chapter 9 - Vents</SelectItem>
                    <SelectItem value="Chapter 10">Chapter 10 - Traps, Interceptors and Separators</SelectItem>
                    <SelectItem value="Chapter 11">Chapter 11 - Storm Drainage</SelectItem>
                    <SelectItem value="Chapter 12">Chapter 12 - Special Piping and Storage Systems</SelectItem>
                    <SelectItem value="Chapter 13">Chapter 13 - Health Care Facilities and Other Special Occupancies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  placeholder="Enter section number (e.g., 101)"
                  disabled={!selectedChapter}
                />
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy - Basic recall</SelectItem>
                    <SelectItem value="hard">Hard - Analysis</SelectItem>
                    <SelectItem value="very_hard">Very Hard - Synthesis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Individual Podcast Episode with Text-to-Speech */}
        <Card className="border-purple-200 bg-purple-50 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Mic className="h-5 w-5" />
              Create Individual Podcast Episode with Text-to-Speech
            </CardTitle>
            <CardDescription className="text-purple-700">
              Create a single podcast episode with synchronized audio generation. Perfect for testing or creating individual content pieces.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tts-title">Episode Title</Label>
              <Input
                id="tts-title"
                value={ttsTitle}
                onChange={(e) => setTtsTitle(e.target.value)}
                placeholder="Louisiana State Plumbing Code §101 Administration"
                className="bg-white"
              />
            </div>

            <div>
              <Label htmlFor="tts-content">Episode Content</Label>
              <Textarea
                id="tts-content"
                value={ttsContent}
                onChange={(e) => setTtsContent(e.target.value)}
                placeholder="Enter your podcast content here... This will be converted to audio with synchronized text display for students."
                rows={8}
                className="bg-white"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>Words: {ttsContent.split(/\s+/).filter(w => w.length > 0).length} | Characters: {ttsContent.length}/4096</span>
                <span>Est. Duration: ~{Math.round(ttsContent.split(/\s+/).filter(w => w.length > 0).length / 150 * 60)}s</span>
              </div>
            </div>

            {ttsError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{ttsError}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleTTSGenerate}
                disabled={generateTTSMutation.isPending || !ttsContent.trim()}
                className="flex-1"
              >
                <Volume2 className="h-4 w-4 mr-2" />
                {generateTTSMutation.isPending ? "Generating Audio..." : "Generate Audio"}
              </Button>
              <Button variant="outline" onClick={handleTTSClear}>
                Clear
              </Button>
            </div>

            {/* Audio Player with Scrolling Text */}
            {ttsAudioResult && (
              <div className="space-y-4 p-4 bg-white rounded-lg border">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-green-700">✓ Ready to Generate Audio</h4>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleTTSDownload}>
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>

                <audio 
                  ref={audioRef}
                  src={ttsAudioResult.audioUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full"
                  controls
                />

                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Click on sentences below to jump to that part of the audio
                  </p>
                </div>

                {/* Scrolling Text Display */}
                <div 
                  ref={textScrollRef}
                  className="max-h-64 overflow-y-auto p-4 bg-gray-50 rounded border"
                >
                  {sentences.map((sentence, index) => (
                    <span
                      key={index}
                      data-sentence={index}
                      onClick={() => handleSentenceClick(index)}
                      className={`cursor-pointer transition-all duration-300 ${
                        index === currentSentenceIndex
                          ? 'bg-blue-200 text-blue-900 font-medium'
                          : 'hover:bg-gray-200'
                      }`}
                      style={{ display: 'inline' }}
                    >
                      {sentence.text}{' '}
                    </span>
                  ))}
                </div>

                <div className="flex justify-center">
                  <Button 
                    onClick={handleSaveTTSEpisode}
                    disabled={saveTTSEpisodeMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saveTTSEpisodeMutation.isPending ? "Saving Episode..." : "Save Episode to Course"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}