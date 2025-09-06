import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Upload, FileText, CheckCircle, AlertCircle, Mic } from "lucide-react";

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

  // Louisiana Plumbing Code sections data
  const sectionOptions = [
    { value: "101", label: "§101 - General" },
    { value: "102", label: "§102 - Applicability" },
    { value: "103", label: "§103 - Intent" },
    { value: "104", label: "§104 - Severability" },
    { value: "105", label: "§105 - Validity" },
    { value: "201", label: "§201 - General" },
    { value: "301", label: "§301 - General" },
    { value: "302", label: "§302 - Approval" },
    { value: "303", label: "§303 - Compliance with Codes" },
    { value: "304", label: "§304 - Connection to Public Sewer Required" },
    { value: "305", label: "§305 - Connection to Public Water Supply Required" },
    { value: "306", label: "§306 - Unsafe or Insanitary Plumbing" },
    { value: "307", label: "§307 - Excavations and Backfill" },
    { value: "308", label: "§308 - Piping Support" },
    { value: "309", label: "§309 - Trenching, Excavation and Tunneling" },
    { value: "310", label: "§310 - Cutting of Structural Members" },
    { value: "311", label: "§311 - Connections to Drainage System" },
    { value: "312", label: "§312 - Connections to Water Supply System" },
    { value: "313", label: "§313 - Inspection and Testing" },
    { value: "314", label: "§314 - Disinfection of Potable Water System" },
    { value: "315", label: "§315 - Air Test" },
    { value: "316", label: "§316 - Final Test" },
    { value: "317", label: "§317 - Drainage and Vent System Test" },
    { value: "318", label: "§318 - Water Supply System Test" },
    { value: "401", label: "§401 - General" },
    { value: "402", label: "§402 - Fixture Requirements" },
    { value: "403", label: "§403 - Minimum Number of Fixtures" },
    { value: "404", label: "§404 - Accessible Route" },
    { value: "405", label: "§405 - Installation" },
    { value: "406", label: "§406 - Access to Connections" },
    { value: "407", label: "§407 - Setting" },
    { value: "408", label: "§408 - Water Closets" },
    { value: "409", label: "§409 - Urinals" },
    { value: "410", label: "§410 - Lavatories" },
    { value: "411", label: "§411 - Bathtubs" },
    { value: "412", label: "§412 - Showers" },
    { value: "413", label: "§413 - Bidets" },
    { value: "414", label: "§414 - Kitchen Sinks" },
    { value: "415", label: "§415 - Laundry Tubs" },
    { value: "416", label: "§416 - Service Sinks" },
    { value: "417", label: "§417 - Drinking Fountains" },
    { value: "418", label: "§418 - Special Fixtures" },
    { value: "419", label: "§419 - Floor Drains" },
    { value: "420", label: "§420 - Faucets and Fittings" },
    { value: "501", label: "§501 - General" },
    { value: "502", label: "§502 - Installation" },
    { value: "503", label: "§503 - Connections" },
    { value: "504", label: "§504 - Safety Relief Valves" },
    { value: "505", label: "§505 - Requirements for All Water Heaters" },
    { value: "506", label: "§506 - Electric Water Heaters" },
    { value: "507", label: "§507 - Oil-Fired Water Heaters" },
    { value: "508", label: "§508 - Solid Fuel-Fired Water Heaters" },
    { value: "509", label: "§509 - Gas-Fired Water Heaters" },
    { value: "510", label: "§510 - Pool and Spa Heaters" },
    { value: "601", label: "§601 - General" },
    { value: "602", label: "§602 - Water Service" },
    { value: "603", label: "§603 - Water Service Pipe" },
    { value: "604", label: "§604 - Building Water Distribution" },
    { value: "605", label: "§605 - Hot Water Supply System" },
    { value: "606", label: "§606 - Solar Thermal Systems" },
    { value: "607", label: "§607 - Combined Hydronic Piping Systems" },
    { value: "608", label: "§608 - Backflow Protection" },
    { value: "609", label: "§609 - Health Care Facilities" },
    { value: "610", label: "§610 - Disinfection" },
    { value: "611", label: "§611 - Residential Fire Sprinkler Systems" },
    { value: "612", label: "§612 - Decorative Water Features" },
    { value: "613", label: "§613 - Swimming Pool Water Supply" },
    { value: "614", label: "§614 - Nonpotable Water Systems" },
    { value: "615", label: "§615 - Graywater Systems" },
    { value: "616", label: "§616 - Recycled Water Systems" },
    { value: "617", label: "§617 - Rainwater Systems" },
    { value: "618", label: "§618 - Cross Connection Control" },
    { value: "619", label: "§619 - Backflow Preventer Test Gauges" },
    { value: "701", label: "§701 - General" },
    { value: "702", label: "§702 - Materials" },
    { value: "703", label: "§703 - Building Drains and Building Sewers" },
    { value: "704", label: "§704 - Drainage Piping Installation" },
    { value: "705", label: "§705 - Joints and Connections" },
    { value: "706", label: "§706 - Changes in Direction" },
    { value: "707", label: "§707 - Cleanouts" },
    { value: "708", label: "§708 - Support of Drainage Piping" },
    { value: "709", label: "§709 - Drainage Piping Installation Requirements" },
    { value: "710", label: "§710 - Subsoil Drains" },
    { value: "711", label: "§711 - Sumps and Ejectors" }
  ];

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

  const isSectionValid = /^[1-9]\d{0,3}$/.test(selectedSection);

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
    
    // Split by episode markers (Episode 1:, Episode 2:, etc.)
    const episodeSections = text.split(/(?=Episode\s+\d+:)/i);
    
    episodeSections.forEach((section, index) => {
      const lines = section.trim().split('\n').filter(line => line.trim());
      if (lines.length < 3) return;
      
      // Extract episode title from first line
      const titleMatch = lines[0].match(/Episode\s+(\d+):\s*(.+)/i);
      if (!titleMatch) return;
      
      const episodeNumber = titleMatch[1];
      const title = titleMatch[2].trim();
      
      // Look for transcript content
      let transcriptStartIndex = -1;
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('transcript') || 
            lines[i].toLowerCase().includes('conversation') ||
            lines[i].toLowerCase().includes('dialogue')) {
          transcriptStartIndex = i + 1;
          break;
        }
      }
      
      if (transcriptStartIndex === -1) {
        // If no explicit transcript marker, use everything after title
        transcriptStartIndex = 1;
      }
      
      // Extract transcript content
      const transcript = lines.slice(transcriptStartIndex).join('\n').trim();
      
      if (title.length > 3 && transcript.length > 50) {
        episodes.push({
          id: crypto.randomUUID(),
          title: `Episode ${episodeNumber}: ${title}`,
          transcript: transcript,
          episodeNumber: parseInt(episodeNumber),
          duration: Math.floor(transcript.length / 10), // Rough estimate: 10 chars per second
          type: 'podcast',
          createdAt: new Date(),
        });
      }
    });
    
    // If no episode markers found, try parsing by paragraph structure
    if (episodes.length === 0) {
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
      
      paragraphs.forEach((paragraph, index) => {
        const lines = paragraph.trim().split('\n');
        if (lines.length < 2) return;
        
        // Use first line as title, rest as transcript
        const title = lines[0].trim();
        const transcript = lines.slice(1).join('\n').trim();
        
        if (title.length > 3 && transcript.length > 50) {
          episodes.push({
            id: crypto.randomUUID(),
            title: title,
            transcript: transcript,
            episodeNumber: index + 1,
            duration: Math.floor(transcript.length / 10),
            type: 'podcast',
            createdAt: new Date(),
          });
        }
      });
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
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    {sectionOptions.map((section) => (
                      <SelectItem key={section.value} value={section.value}>
                        {section.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy - Basic recall</SelectItem>
                    <SelectItem value="medium">Medium - Application</SelectItem>
                    <SelectItem value="hard">Hard - Analysis</SelectItem>
                    <SelectItem value="very_hard">Very Hard - Synthesis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Format Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Louisiana Plumbing Code Podcast Format
            </CardTitle>
            <CardDescription>Copy and paste episode content with conversation transcripts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Your Format: Episode titles followed by conversation transcripts</h4>
                <pre className="bg-muted p-3 rounded text-xs">
{`Episode 1: Understanding LSPC Adoption and Authority

Transcript:
Host: Welcome to Louisiana Plumbing Prep Podcast. Today we're discussing Chapter 1 of the Louisiana State Plumbing Code.
Expert: Thanks for having me. Let's start with how the LSPC is formally adopted.
Host: Can you explain who adopts the code?
Expert: The Department of Health and Hospitals, Office of Public Health, adopts Part XIV (Plumbing) of the Sanitary Code for Louisiana.

Episode 2: Authority Sources and Legal Framework

Transcript:
Host: In our last episode, we covered adoption. Now let's talk about the legal authority.
Expert: The primary authority comes from R.S. 36:258(B), but there are additional provisions in Title 40...`}
                </pre>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Format requirements:</strong> Episode number and title, followed by "Transcript:" and conversation content. Separate episodes with blank lines.
                </AlertDescription>
              </Alert>
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
Episode 1: Understanding LSPC Adoption and Authority

Transcript:
Host: Welcome to Louisiana Plumbing Prep Podcast. Today we're discussing Chapter 1 of the Louisiana State Plumbing Code.
Expert: Thanks for having me. Let's start with how the LSPC is formally adopted.
Host: Can you explain who adopts the code?
Expert: The Department of Health and Hospitals, Office of Public Health, adopts Part XIV (Plumbing) of the Sanitary Code for Louisiana.

Episode 2: Authority Sources and Legal Framework

Transcript:
Host: In our last episode, we covered adoption. Now let's talk about the legal authority.
Expert: The primary authority comes from R.S. 36:258(B), but there are additional provisions in Title 40...`}
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
      </div>
    </div>
  );
}