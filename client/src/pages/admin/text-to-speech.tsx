import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Play, Download, Volume2, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TextToSpeech() {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioResult, setAudioResult] = useState<{
    audioUrl: string;
    title: string;
    duration: number;
    contentId: string;
  } | null>(null);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError("Please enter text content to convert to speech");
      return;
    }

    if (text.length > 4096) {
      setError("Text content must be 4096 characters or less");
      return;
    }

    setIsGenerating(true);
    setError("");
    setAudioResult(null);

    try {
      const response = await apiRequest("POST", "/api/text-to-speech", {
        text, 
        title: title || "Generated Audio"
      });
      const result = await response.json();

      if (result.success) {
        setAudioResult({
          audioUrl: result.audioUrl,
          title: result.title,
          duration: result.duration,
          contentId: result.contentId
        });
        toast({
          title: "Audio Generated Successfully",
          description: `Generated ${Math.floor(result.duration / 60)}:${(result.duration % 60).toString().padStart(2, '0')} of audio`,
        });
      } else {
        setError(result.message || "Failed to generate audio");
      }
    } catch (error: any) {
      setError(error.message || "Failed to generate audio");
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to convert text to speech",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (audioResult) {
      const link = document.createElement('a');
      link.href = audioResult.audioUrl;
      link.download = `${audioResult.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleClear = () => {
    setText("");
    setTitle("");
    setAudioResult(null);
    setError("");
  };

  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = text.length;
  const estimatedDuration = Math.ceil(wordCount / 2.5); // ~2.5 words per second

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Volume2 className="h-8 w-8 text-blue-600" />
            Text-to-Speech Converter
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Convert your scripts and content into high-quality audio using AI-powered text-to-speech
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Script Input
              </CardTitle>
              <CardDescription>
                Enter your script or content to convert to audio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Audio Title (Optional)</Label>
                <Input
                  id="title"
                  data-testid="input-title"
                  placeholder="Enter title for your audio file"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="script">Script Content</Label>
                <Textarea
                  id="script"
                  data-testid="input-script"
                  placeholder="Paste your script or content here... HTML tags will be automatically removed for clean audio."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={12}
                  className="min-h-[300px] font-mono text-sm"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Words: {wordCount} | Characters: {charCount}/4096</span>
                  <span>Est. Duration: ~{estimatedDuration}s</span>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !text.trim()}
                  className="flex-1"
                  data-testid="button-generate"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Audio...
                    </>
                  ) : (
                    <>
                      <Volume2 className="mr-2 h-4 w-4" />
                      Generate Audio
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClear}
                  disabled={isGenerating}
                  data-testid="button-clear"
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Generated Audio
              </CardTitle>
              <CardDescription>
                Your converted audio will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              {audioResult ? (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
                      ✅ Audio Generated Successfully
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      <strong>Title:</strong> {audioResult.title}<br />
                      <strong>Duration:</strong> {Math.floor(audioResult.duration / 60)}:{(audioResult.duration % 60).toString().padStart(2, '0')}<br />
                      <strong>File ID:</strong> {audioResult.contentId}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <audio
                      controls
                      className="w-full"
                      data-testid="audio-player"
                    >
                      <source src={audioResult.audioUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>

                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      className="w-full"
                      data-testid="button-download"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download MP3
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Volume2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No audio generated yet</p>
                  <p className="text-sm">Enter script and click "Generate Audio" to create your audio file</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Usage Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">📝 1. Prepare Content</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Paste your script or content. HTML tags will be automatically removed for clean audio output.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">🎙️ 2. Generate Audio</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Click "Generate Audio" to convert your text using high-quality AI voice synthesis.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">⬇️ 3. Download & Use</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Listen to preview and download the MP3 file for use in your projects.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}