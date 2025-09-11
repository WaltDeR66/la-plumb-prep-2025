import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Play, Download, Volume2, FileText, Pause } from "lucide-react";
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [frozenSentences, setFrozenSentences] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const textScrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Parse text into sentences with timing estimates
  const parseTextIntoSentences = (text: string) => {
    if (!text) return [];
    
    // Split by sentence endings, keeping the punctuation
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

  // Use frozen sentences for synchronization if audio exists, otherwise parse current text for preview
  const sentences = audioResult ? frozenSentences : parseTextIntoSentences(text);

  // Audio event handlers
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
      
      // Find current sentence based on time
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
      
      // If actual duration differs from reported, rescale frozen sentences
      if (audioResult && frozenSentences.length > 0 && Math.abs(actualDuration - audioResult.duration) > 0.1) {
        const rescaleFactor = actualDuration / audioResult.duration;
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

  // Auto-scroll to current sentence
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
        // Freeze sentences for this audio and normalize timing to actual duration
        const generatedSentences = parseTextIntoSentences(text);
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
    setFrozenSentences([]);
    setCurrentSentenceIndex(0);
    setCurrentTime(0);
    setIsPlaying(false);
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
                  placeholder="Paste your script or content here... Text will be cleaned for optimal audio generation."
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

                  {/* Custom Audio Player with Controls */}
                  <div className="space-y-4">
                    <audio
                      ref={audioRef}
                      src={audioResult.audioUrl}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />

                    {/* Audio Controls */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center gap-4 mb-3">
                        <Button
                          onClick={handlePlayPause}
                          size="sm"
                          data-testid="button-play-pause"
                          className="flex items-center gap-2"
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          {isPlaying ? 'Pause' : 'Play'}
                        </Button>
                        
                        <div className="flex-1 text-sm text-gray-600 dark:text-gray-300">
                          {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')} / {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
                        </div>

                        <Button
                          onClick={handleDownload}
                          variant="outline"
                          size="sm"
                          data-testid="button-download"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>

                      {/* Seekable Progress Bar */}
                      <div 
                        className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 cursor-pointer"
                        onClick={(e) => {
                          if (audioRef.current && duration) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left;
                            const percentage = clickX / rect.width;
                            const newTime = percentage * duration;
                            audioRef.current.currentTime = newTime;
                            setCurrentTime(newTime);
                            
                            // Update sentence highlight for paused seeking
                            const newSentenceIndex = sentences.findIndex(s => 
                              newTime >= s.startTime && newTime < s.endTime
                            );
                            if (newSentenceIndex !== -1) {
                              setCurrentSentenceIndex(newSentenceIndex);
                            }
                          }
                        }}
                        data-testid="progress-bar"
                      >
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Synchronized Text Display */}
                    {sentences.length > 0 && (
                      <div className="bg-white dark:bg-gray-900 border rounded-lg p-4">
                        <h4 className="font-medium mb-3 text-gray-900 dark:text-white">
                          📖 Follow Along Text (Click any sentence to jump)
                        </h4>
                        <div 
                          ref={textScrollRef}
                          className="max-h-64 overflow-y-auto space-y-2"
                        >
                          {sentences.map((sentence, index) => (
                            <div
                              key={index}
                              data-sentence={index}
                              data-testid={`sentence-${index}`}
                              onClick={() => handleSentenceClick(index)}
                              className={`p-3 rounded cursor-pointer transition-all duration-300 ${
                                index === currentSentenceIndex
                                  ? 'bg-blue-100 dark:bg-blue-900/40 border-l-4 border-blue-500 font-medium text-blue-900 dark:text-blue-100 shadow-sm'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <span className="text-xs text-gray-500 mt-1 min-w-[3rem]">
                                  {Math.floor(sentence.startTime / 60)}:{Math.floor(sentence.startTime % 60).toString().padStart(2, '0')}
                                </span>
                                <span className={index === currentSentenceIndex ? 'text-blue-900 dark:text-blue-100' : ''}>
                                  {sentence.text}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                          💡 Tip: Click on any sentence to jump to that part of the audio
                        </div>
                      </div>
                    )}
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