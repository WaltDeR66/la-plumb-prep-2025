import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ArrowLeft, Mic, Upload, Play, User, UserCheck, Save } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function PodcastImport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [podcastData, setPodcastData] = useState({
    title: "",
    description: "",
    hostName: "Host",
    guestName: "Guest",
    content: ""
  });

  const [parsedSegments, setParsedSegments] = useState<Array<{
    speaker: "host" | "guest";
    text: string;
  }>>([]);

  const createPodcastMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/admin/podcasts", data);
    },
    onSuccess: () => {
      toast({
        title: "Podcast Created",
        description: "Your podcast has been successfully imported and is ready to publish.",
      });
      setPodcastData({
        title: "",
        description: "",
        hostName: "Host",
        guestName: "Guest",
        content: ""
      });
      setParsedSegments([]);
      queryClient.invalidateQueries({ queryKey: ["/api/podcasts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create podcast. Please try again.",
        variant: "destructive",
      });
    },
  });

  const parseContent = () => {
    if (!podcastData.content.trim()) {
      toast({
        title: "No Content",
        description: "Please paste your podcast content first.",
        variant: "destructive",
      });
      return;
    }

    const lines = podcastData.content.split('\n').filter(line => line.trim());
    const segments: Array<{ speaker: "host" | "guest"; text: string }> = [];
    
    // Parse alternating host/guest format
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        // Alternate between host (even indices) and guest (odd indices)
        const speaker = index % 2 === 0 ? "host" : "guest";
        segments.push({
          speaker,
          text: trimmedLine
        });
      }
    });

    setParsedSegments(segments);
    
    toast({
      title: "Content Parsed",
      description: `Found ${segments.length} segments (${segments.filter(s => s.speaker === 'host').length} host, ${segments.filter(s => s.speaker === 'guest').length} guest)`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!podcastData.title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please enter a podcast title.",
        variant: "destructive",
      });
      return;
    }

    if (parsedSegments.length === 0) {
      toast({
        title: "No Segments",
        description: "Please parse your content first to create segments.",
        variant: "destructive",
      });
      return;
    }

    createPodcastMutation.mutate({
      title: podcastData.title,
      description: podcastData.description,
      hostName: podcastData.hostName,
      guestName: podcastData.guestName,
      segments: parsedSegments,
      totalSegments: parsedSegments.length,
      duration: Math.round(parsedSegments.length * 15), // Estimate 15 seconds per segment
      status: "draft"
    });
  };

  const updateField = (field: string, value: string) => {
    setPodcastData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="podcast-import-title">
              Podcast Import
            </h1>
            <p className="text-muted-foreground">
              Import conversation content to create podcast episodes with host and guest segments
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Podcast Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Podcast Details
              </CardTitle>
              <CardDescription>
                Enter the basic information for your podcast episode
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Episode Title *</Label>
                <Input
                  id="title"
                  value={podcastData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="e.g., Louisiana State Plumbing Code §101 Administration"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Episode Description</Label>
                <Textarea
                  id="description"
                  value={podcastData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Brief description of what this episode covers..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hostName">Host Name</Label>
                  <Input
                    id="hostName"
                    value={podcastData.hostName}
                    onChange={(e) => updateField("hostName", e.target.value)}
                    placeholder="Host"
                  />
                </div>
                <div>
                  <Label htmlFor="guestName">Guest Name</Label>
                  <Input
                    id="guestName"
                    value={podcastData.guestName}
                    onChange={(e) => updateField("guestName", e.target.value)}
                    placeholder="Guest"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Import */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Content Import
              </CardTitle>
              <CardDescription>
                Paste your alternating host/guest conversation content. Each line will alternate between host and guest automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="content">Conversation Content</Label>
                <Textarea
                  id="content"
                  value={podcastData.content}
                  onChange={(e) => updateField("content", e.target.value)}
                  placeholder="Paste your conversation content here... First line = Host, Second line = Guest, Third line = Host, etc."
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Format: Line 1 (Host) → Line 2 (Guest) → Line 3 (Host) → Line 4 (Guest)...
                </p>
              </div>

              <Button 
                type="button" 
                onClick={parseContent}
                variant="outline"
                disabled={!podcastData.content.trim()}
              >
                <Play className="h-4 w-4 mr-2" />
                Parse Content
              </Button>
            </CardContent>
          </Card>

          {/* Preview Segments */}
          {parsedSegments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Content Preview</CardTitle>
                <CardDescription>
                  Review the parsed segments before creating the podcast
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {parsedSegments.map((segment, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border ${
                        segment.speaker === 'host' 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {segment.speaker === 'host' ? (
                          <User className="h-4 w-4 text-blue-600" />
                        ) : (
                          <UserCheck className="h-4 w-4 text-green-600" />
                        )}
                        <Badge variant={segment.speaker === 'host' ? 'default' : 'secondary'}>
                          {segment.speaker === 'host' ? podcastData.hostName : podcastData.guestName}
                        </Badge>
                        <span className="text-sm text-muted-foreground">#{index + 1}</span>
                      </div>
                      <p className="text-sm">{segment.text}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total Segments:</span>
                      <p className="text-lg">{parsedSegments.length}</p>
                    </div>
                    <div>
                      <span className="font-medium">Host Lines:</span>
                      <p className="text-lg text-blue-600">
                        {parsedSegments.filter(s => s.speaker === 'host').length}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Guest Lines:</span>
                      <p className="text-lg text-green-600">
                        {parsedSegments.filter(s => s.speaker === 'guest').length}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={createPodcastMutation.isPending || parsedSegments.length === 0}
              className="w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              {createPodcastMutation.isPending ? "Creating Podcast..." : "Create Podcast"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}