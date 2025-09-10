import { useState } from "react";
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
import { Upload, FileText, CheckCircle, AlertCircle, Mic } from "lucide-react";
import { PLUMBING_CODE_SECTIONS } from "@/lib/plumbing-code-sections";

export default function BulkPodcastImport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("medium");
  const [podcastText, setPodcastText] = useState("");
  const [previewEpisodes, setPreviewEpisodes] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState<"idle" | "parsing" | "previewing" | "importing" | "success">("idle");
  
  // QuizGecko URL extraction
  const [quizGeckoUrls, setQuizGeckoUrls] = useState("");
  const [extractionStatus, setExtractionStatus] = useState<"idle" | "extracting" | "success">("idle");


  // Fetch courses
  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (data: any) => await apiRequest("POST", "/api/admin/podcast/bulk-import", data),
    onSuccess: (result: any) => {
      const { imported, duplicatesSkipped, totalSubmitted } = result;
      
      if (duplicatesSkipped > 0) {
        toast({ 
          title: "Import completed with duplicates detected", 
          description: `Added ${imported} new podcast episodes. Skipped ${duplicatesSkipped} duplicates out of ${totalSubmitted} total.`,
          variant: "default"
        });
      } else {
        toast({ 
          title: "All podcast episodes imported successfully!", 
          description: `Added ${imported} new episodes to the course.`
        });
      }
      
      setImportStatus("success");
      setPodcastText("");
      setPreviewEpisodes([]);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/course-content"] });
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import podcast episodes",
        variant: "destructive"
      });
      setImportStatus("idle");
    }
  });

  // Audio generation mutation
  const generateAudioMutation = useMutation({
    mutationFn: async () => await apiRequest("POST", "/api/admin/generate-podcast-audio", {}),
    onSuccess: (result: any) => {
      const successCount = result.results?.filter((r: any) => r.success).length || 0;
      const totalCount = result.results?.length || 0;
      
      toast({ 
        title: "Audio generation completed!", 
        description: `Generated audio for ${successCount}/${totalCount} podcast episodes. Students can now listen to the audio content.`,
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Audio generation failed",
        description: error.message || "Failed to generate podcast audio",
        variant: "destructive"
      });
    }
  });

  // QuizGecko URL extraction mutation
  const extractFromQuizGeckoMutation = useMutation({
    mutationFn: async (data: any) => await apiRequest("POST", "/api/admin/extract-quizgecko-content", data),
    onSuccess: (result: any) => {
      toast({ 
        title: "Successfully extracted QuizGecko content!", 
        description: `Extracted ${result.episodes?.length || 0} podcast episodes from your QuizGecko URLs.`,
        variant: "default"
      });
      setExtractionStatus("success");
      setQuizGeckoUrls("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/course-content"] });
    },
    onError: (error: any) => {
      toast({
        title: "Extraction failed",
        description: error.message || "Failed to extract content from QuizGecko URLs",
        variant: "destructive"
      });
      setExtractionStatus("idle");
    }
  });

  const parsePodcasts = () => {
    if (!podcastText.trim()) {
      toast({
        title: "No content",
        description: "Please enter podcast content to parse",
        variant: "destructive"
      });
      return;
    }

    setImportStatus("parsing");

    try {
      const parsed = parsePodcastsFromText(podcastText);
      if (parsed.length === 0) {
        throw new Error("No valid podcast episodes found. Please check the format.");
      }
      
      setPreviewEpisodes(parsed);
      setImportStatus("previewing");
      toast({
        title: "Podcast episodes parsed successfully!",
        description: `Found ${parsed.length} episodes ready for import.`
      });
    } catch (error: any) {
      toast({
        title: "Parse error",
        description: error.message,
        variant: "destructive"
      });
      setImportStatus("idle");
    }
  };

  const isSectionValid = selectedSection && selectedSection.trim().length > 0;

  const importPodcasts = () => {
    if (!selectedCourse) {
      toast({
        title: "No course selected",
        description: "Please select a course first",
        variant: "destructive"
      });
      return;
    }

    if (!selectedChapter || !selectedSection) {
      toast({
        title: "Chapter and Section required",
        description: "Please select both chapter and section for organization",
        variant: "destructive"
      });
      return;
    }

    if (!isSectionValid) {
      toast({
        title: "Invalid section number",
        description: "Enter a valid section number (e.g., 101)",
        variant: "destructive"
      });
      return;
    }

    // Update episodes with current chapter and section values to prevent stale data
    const payloadEpisodes = previewEpisodes.map(episode => ({
      ...episode,
      chapter: selectedChapter,
      category: selectedChapter,
      section: selectedSection,
      codeReference: `${selectedChapter} - Section ${selectedSection}`,
      difficulty: selectedDifficulty
    }));

    setImportStatus("importing");
    bulkImportMutation.mutate({
      courseId: selectedCourse,
      episodes: payloadEpisodes
    });
  };

  const parsePodcastsFromText = (text: string) => {
    const episodes: any[] = [];
    
    // Split by titles that start with "Louisiana State Plumbing Code" or similar patterns
    const episodeSections = text.split(/(?=Louisiana State Plumbing Code|LSPC)/i);
    
    episodeSections.forEach((section, index) => {
      const lines = section.trim().split('\n').filter(line => line.trim());
      if (lines.length < 10) return; // Need substantial conversation content
      
      // Extract title from first line (typically "Louisiana State Plumbing Code §XXX Topic")
      const title = lines[0].trim();
      if (!title || title.length < 10) return;
      
      // The conversation starts from the second line onwards
      const conversation = lines.slice(1).join('\n').trim();
      
      // Check if this looks like a host-guest conversation format
      const conversationLines = conversation.split('\n');
      const hasConversationPattern = conversationLines.some(line => 
        line.includes('?') || // Questions from host
        line.toLowerCase().includes('yes,') ||
        line.toLowerCase().includes('indeed,') ||
        line.toLowerCase().includes('absolutely') ||
        line.toLowerCase().includes('right,') ||
        line.toLowerCase().includes('exactly')
      );
      
      if (hasConversationPattern && conversation.length > 200) {
        // Calculate estimated duration (average speaking rate: ~150 words per minute)
        const wordCount = conversation.split(/\s+/).length;
        const estimatedDuration = Math.floor((wordCount / 150) * 60); // seconds
        
        episodes.push({
          id: crypto.randomUUID(),
          title: title,
          transcript: conversation,
          episodeNumber: index + 1,
          duration: estimatedDuration,
          wordCount: wordCount,
          type: 'podcast',
          createdAt: new Date(),
        });
      }
    });
    
    // If no clear sections found, treat entire text as one episode
    if (episodes.length === 0) {
      const lines = text.trim().split('\n').filter(line => line.trim());
      if (lines.length > 10) {
        const title = lines[0].trim() || "Louisiana Plumbing Code Discussion";
        const conversation = lines.slice(1).join('\n').trim();
        
        const wordCount = conversation.split(/\s+/).length;
        const estimatedDuration = Math.floor((wordCount / 150) * 60);
        
        episodes.push({
          id: crypto.randomUUID(),
          title: title,
          transcript: conversation,
          episodeNumber: 1,
          duration: estimatedDuration,
          wordCount: wordCount,
          type: 'podcast',
          createdAt: new Date(),
        });
      }
    }
    
    return episodes;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Bulk Podcast Episodes Import</h1>
          <p className="text-muted-foreground">
            Import conversation content to create podcast episodes with transcripts
          </p>
        </div>

        {/* Course and Chapter/Section Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Course & Louisiana Plumbing Code Organization</CardTitle>
            <CardDescription>Choose course, chapter, section and difficulty level for all podcast episodes in this batch</CardDescription>
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
                  placeholder="Enter section number (e.g., 101, 103, 105...)"
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


        {/* Podcast Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Paste Your Podcast Episodes</CardTitle>
            <CardDescription>Copy and paste podcast episodes with conversation transcripts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="podcasts">Podcast Episodes Content</Label>
                <Textarea
                  id="podcasts"
                  value={podcastText}
                  onChange={(e) => setPodcastText(e.target.value)}
                  rows={15}
                  placeholder={`Paste your podcast episodes here...

Example:
Louisiana State Plumbing Code §101 Administration
Did you know that the state of Louisiana operates under a very specific set of plumbing regulations? It's grounded in a comprehensive sanitary code designed to protect public health.
Yes, it's officially called the Louisiana State Plumbing Code, or LSPC. It's actually Part XIV of Louisiana's Sanitary Code, which is fascinatingly detailed.
Right, so anytime you see references to 'this code' or 'Part XIV', they're all pointing to this singular, authoritative document governing plumbing practices statewide.
And what gives this code its legal teeth? Is there a specific legislative act that enables its creation and enforcement?
Indeed, its authority primarily stems from R.S. 36:258(B), with further support from various chapters and sections within Title 40 of the Louisiana Revised Statutes.

Louisiana State Plumbing Code §302 Approval
The approval process for plumbing installations is quite structured, isn't it?
Absolutely! The code establishes clear requirements for how plumbing systems must be approved before installation...`}
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={parsePodcasts}
                  disabled={!podcastText.trim() || importStatus === "parsing"}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {importStatus === "parsing" ? "Parsing..." : "Parse Episodes"}
                </Button>
                
                {previewEpisodes.length > 0 && (
                  <Button 
                    onClick={importPodcasts}
                    disabled={!selectedCourse || importStatus === "importing"}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {importStatus === "importing" ? "Importing..." : `Import ${previewEpisodes.length} Episodes`}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {previewEpisodes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Preview ({previewEpisodes.length} podcast episodes found)
              </CardTitle>
              <CardDescription>Review the parsed episodes before importing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {previewEpisodes.map((episode, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-blue-600 mb-1">Episode Title</h4>
                          <p className="text-sm bg-blue-50 p-2 rounded font-medium">
                            {episode.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                          <Mic className="h-3 w-3" />
                          ~{Math.floor(episode.duration / 60)}m
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-600 mb-2">Transcript Preview</h4>
                        <div className="text-sm bg-green-50 p-3 rounded whitespace-pre-line max-h-32 overflow-y-auto">
                          {episode.transcript.substring(0, 500)}{episode.transcript.length > 500 ? "..." : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {importStatus === "success" && (
          <Alert className="mt-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Podcast episodes imported successfully! You can now view them in the Content Management section.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Audio Generation Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Generate Audio from Existing Scripts
            </CardTitle>
            <CardDescription>
              Convert your existing podcast scripts into high-quality audio files using OpenAI's text-to-speech technology.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>What this does:</strong> This will take all your existing podcast scripts in the database and generate actual MP3 audio files using OpenAI's professional text-to-speech. Students will then be able to listen to the audio content instead of seeing "Coming Soon."
                </p>
              </div>
              
              <Button
                onClick={() => generateAudioMutation.mutate()}
                disabled={generateAudioMutation.isPending}
                className="w-full"
                data-testid="generate-audio-button"
              >
                {generateAudioMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Audio Files...
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Generate Audio Files from Scripts
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}