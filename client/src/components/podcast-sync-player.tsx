import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, SkipForward, RotateCcw, Volume2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PodcastSegment {
  start: number;
  end: number;
  text: string;
}

interface PodcastSyncPlayerProps {
  audioSrc?: string;
  transcript: string;
  segments?: PodcastSegment[];
  onProgressUpdate?: (currentTime: number, duration: number) => void;
}

export default function PodcastSyncPlayer({ 
  audioSrc, 
  transcript, 
  segments, 
  onProgressUpdate 
}: PodcastSyncPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(-1);
  const [parsedSegments, setParsedSegments] = useState<PodcastSegment[]>([]);
  const [currentSentence, setCurrentSentence] = useState("");
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [preGeneratedAudioUrl, setPreGeneratedAudioUrl] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<string>("");
  const [wantsAutoPlay, setWantsAutoPlay] = useState(false);

  // Parse transcript into sentences and create timing segments
  const parseTranscriptToSegments = useCallback((text: string, totalDuration: number): PodcastSegment[] => {
    if (!text) return [];

    // Use Intl.Segmenter if available, otherwise use regex
    let sentences: string[] = [];
    
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
      const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
      sentences = Array.from(segmenter.segment(text))
        .map(segment => segment.segment.trim())
        .filter(sentence => sentence.length > 0);
    } else {
      // Fallback regex for sentence splitting
      sentences = text
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }

    if (sentences.length === 0) return [];

    // Calculate timing based on word count proportions
    const totalWords = sentences.reduce((total, sentence) => {
      return total + sentence.split(/\s+/).length;
    }, 0);

    let cumulativeTime = 0;
    return sentences.map((sentence, index) => {
      const wordsInSentence = sentence.split(/\s+/).length;
      const segmentDuration = (wordsInSentence / totalWords) * totalDuration;
      const start = cumulativeTime;
      const end = cumulativeTime + segmentDuration;
      cumulativeTime = end;

      return {
        start,
        end,
        text: sentence
      };
    });
  }, []);

  // Pre-generate full audio from transcript
  useEffect(() => {
    if (transcript && !preGeneratedAudioUrl && !isGeneratingAudio) {
      generateFullAudio();
    }
  }, [transcript]);

  // Initialize segments when audio metadata loads
  useEffect(() => {
    if (segments) {
      setParsedSegments(segments);
    } else if (transcript) {
      // Use actual duration if available, otherwise estimate based on word count
      const estimatedDuration = duration > 0 ? duration : Math.max((transcript.split(/\s+/).length / 150) * 60, 300); // 150 WPM, minimum 5 minutes
      const generatedSegments = parseTranscriptToSegments(transcript, estimatedDuration);
      setParsedSegments(generatedSegments);
      
      // Update the duration state if we estimated it
      if (duration === 0) {
        setDuration(estimatedDuration);
      }
    }
  }, [segments, transcript, duration, parseTranscriptToSegments]);

  // Generate full audio file from complete transcript
  const generateFullAudio = async () => {
    if (!transcript || isGeneratingAudio) return;
    
    setIsGeneratingAudio(true);
    setGenerationProgress("Generating podcast audio...");
    
    try {
      console.log('Pre-generating full audio for transcript:', transcript.substring(0, 100) + '...');
      
      const response = await apiRequest("POST", "/api/openai/speech", {
        input: transcript,
        voice: "alloy",
        model: "tts-1"
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      setPreGeneratedAudioUrl(audioUrl);
      setGenerationProgress("Audio ready!");
      console.log('Pre-generation complete! Audio URL created:', audioUrl.substring(0, 50) + '...');
      
      // Auto-play if user pressed play during generation
      if (wantsAutoPlay && audioRef.current) {
        setTimeout(() => {
          audioRef.current?.play();
          setIsPlaying(true);
          setWantsAutoPlay(false);
        }, 100);
      }
      
    } catch (error) {
      console.error('Error pre-generating full audio:', error);
      setGenerationProgress("Audio generation failed");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Create audio using OpenAI TTS API
  const createOpenAIAudio = useCallback(async (text: string): Promise<string | null> => {
    try {
      setIsGeneratingAudio(true);
      const response = await apiRequest("POST", "/api/openai/speech", {
        input: text,
        voice: "alloy", // OpenAI voice options: alloy, echo, fable, onyx, nova, shimmer
        model: "tts-1"
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      // Convert the response to blob and create object URL
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      setIsGeneratingAudio(false);
      return audioUrl;
    } catch (error) {
      console.error('Error generating speech:', error);
      setIsGeneratingAudio(false);
      return null;
    }
  }, []);

  // Handle audio element events
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      onProgressUpdate?.(time, duration);

      // Find active segment
      const activeIndex = parsedSegments.findIndex(
        segment => time >= segment.start && time <= segment.end
      );
      
      if (activeIndex !== -1 && activeIndex !== activeSegmentIndex) {
        setActiveSegmentIndex(activeIndex);
        
        // Update the current sentence display
        if (parsedSegments[activeIndex]) {
          setCurrentSentence(parsedSegments[activeIndex].text);
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setActiveSegmentIndex(-1);
  };

  // Play/pause functionality - now using pre-generated audio
  const handlePlayPause = async () => {
    // Use original audioSrc if available, otherwise use pre-generated audio
    const effectiveAudioSrc = audioSrc || preGeneratedAudioUrl;
    
    if (effectiveAudioSrc && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // Set the audio source if it hasn't been set yet
        if (audioRef.current.src !== effectiveAudioSrc) {
          audioRef.current.src = effectiveAudioSrc;
        }
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else if (!preGeneratedAudioUrl && !isGeneratingAudio) {
      // If no audio is available and we're not already generating, start generation
      setWantsAutoPlay(true); // Remember user wants to play
      generateFullAudio();
    }
  };

  // Seek to specific sentence
  const handleSegmentClick = (segmentIndex: number) => {
    const segment = parsedSegments[segmentIndex];
    if (!segment || !audioRef.current || duration === 0) return;
    
    audioRef.current.currentTime = segment.start;
    setCurrentTime(segment.start);
    setActiveSegmentIndex(segmentIndex);
    setCurrentSentence(segment.text);
  };

  // Skip forward/backward
  const handleSkip = (seconds: number) => {
    if (audioRef.current && duration > 0) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Format time display
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Audio Player Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Audio element (hidden, for original audio or pre-generated audio) */}
            {(audioSrc || preGeneratedAudioUrl) && (
              <audio
                ref={audioRef}
                src={audioSrc || preGeneratedAudioUrl || undefined}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                className="hidden"
                data-testid="audio-element"
              />
            )}

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Volume2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Audio Lesson</h3>
                <p className="text-sm text-gray-600">
                  {isGeneratingAudio ? generationProgress : 
                   (audioSrc ? 'High Quality Audio' : 
                   (preGeneratedAudioUrl ? 'OpenAI Text-to-Speech Ready' : 'AI Text-to-Speech Available'))}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <Button
                onClick={handlePlayPause}
                variant="default"
                size="sm"
                className="flex items-center gap-2"
                disabled={isGeneratingAudio}
                data-testid="button-play-pause"
              >
                {isGeneratingAudio ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {isPlaying ? 'Pause' : 'Play'}
                  </>
                )}
              </Button>

              {(audioSrc || preGeneratedAudioUrl) && (
                <>
                  <Button
                    onClick={() => handleSkip(-10)}
                    variant="ghost"
                    size="sm"
                    data-testid="button-rewind"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => handleSkip(10)}
                    variant="ghost"
                    size="sm"
                    data-testid="button-skip-forward"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </>
              )}

              <div className="flex-1 flex items-center gap-2 text-sm text-gray-600">
                <span data-testid="time-current">{formatTime(currentTime)}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    data-testid="progress-bar"
                  />
                </div>
                <span data-testid="time-duration">{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Sentence Display */}
      <Card>
        <CardContent className="p-8">
          <div className="text-center min-h-[120px] flex items-center justify-center">
            {currentSentence ? (
              <p 
                className="text-lg leading-relaxed text-gray-800 max-w-3xl"
                data-testid="current-sentence"
              >
                {currentSentence}
              </p>
            ) : isGeneratingAudio ? (
              <div className="text-gray-500 text-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-base mb-2">{generationProgress}</p>
                <p className="text-sm">Please wait while we prepare your audio lesson...</p>
              </div>
            ) : (
              <div className="text-gray-500">
                <p className="text-base mb-2">Press Play to start the lesson</p>
                <p className="text-sm">Smooth continuous audio playback with synchronized text</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}