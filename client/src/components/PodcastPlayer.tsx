import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PodcastSegment {
  speaker: string;
  text: string;
  startTime?: number;
  endTime?: number;
}

interface PodcastContent {
  title: string;
  transcript: string;
  audioUrl?: string;
  duration?: number;
  segments?: PodcastSegment[];
}

interface PodcastPlayerProps {
  content: PodcastContent;
  className?: string;
}

interface Sentence {
  index: number;
  text: string;
  startTime: number;
  endTime: number;
  duration: number;
  wordCount: number;
}

export function PodcastPlayer({ content, className }: PodcastPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([0.8]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const textScrollRef = useRef<HTMLDivElement>(null);
  
  // Parse text into sentences with timing estimates
  const parseTextIntoSentences = (text: string, audioDuration: number): Sentence[] => {
    if (!text) return [];
    
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    const wordsPerSecond = 2.5; // Average speech rate
    
    // Calculate total estimated time
    const totalWords = sentences.reduce((sum, sentence) => {
      return sum + sentence.split(/\s+/).filter(w => w.length > 0).length;
    }, 0);
    
    const totalEstimatedTime = totalWords / wordsPerSecond;
    const scaleFactor = audioDuration > 0 ? audioDuration / totalEstimatedTime : 1;
    
    let currentStartTime = 0;
    
    return sentences.map((sentence, index) => {
      const wordCount = sentence.split(/\s+/).filter(w => w.length > 0).length;
      const estimatedDuration = (wordCount / wordsPerSecond) * scaleFactor;
      const startTime = currentStartTime;
      currentStartTime += estimatedDuration;
      
      return {
        index,
        text: sentence.trim(),
        startTime,
        endTime: currentStartTime,
        duration: estimatedDuration,
        wordCount
      };
    });
  };

  const sentences = parseTextIntoSentences(content.transcript, duration);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      
      // Find current sentence based on time
      const currentSentence = sentences.findIndex(s => 
        time >= s.startTime && time < s.endTime
      );
      if (currentSentence !== -1 && currentSentence !== currentSentenceIndex) {
        setCurrentSentenceIndex(currentSentence);
      }
    };
    
    const updateDuration = () => setDuration(audio.duration || 0);
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', () => setIsPlaying(false));
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));
    
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', () => setIsPlaying(false));
      audio.removeEventListener('play', () => setIsPlaying(true));
      audio.removeEventListener('pause', () => setIsPlaying(false));
    };
  }, [sentences, currentSentenceIndex]);

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

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0];
    }
  }, [volume]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const resetAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = 0;
    setCurrentTime(0);
    setCurrentSentenceIndex(0);
  };

  const handleSentenceClick = (sentenceIndex: number) => {
    if (audioRef.current && sentences[sentenceIndex]) {
      audioRef.current.currentTime = sentences[sentenceIndex].startTime;
      setCurrentSentenceIndex(sentenceIndex);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={cn("w-full max-w-4xl mx-auto", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold" data-testid="text-podcast-title">
          {content.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Audio Element */}
        {content.audioUrl && (
          <audio
            ref={audioRef}
            src={content.audioUrl}
            preload="metadata"
            className="hidden"
            data-testid="audio-player"
          />
        )}
        
        {/* Audio Controls */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <Button
            variant="outline"
            size="sm"
            onClick={resetAudio}
            disabled={!content.audioUrl}
            data-testid="button-reset-audio"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={togglePlayPause}
            disabled={!content.audioUrl}
            data-testid="button-play-pause"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <div className="flex-1 space-y-2">
            <Slider
              value={[currentTime]}
              onValueChange={handleSeek}
              max={duration}
              step={1}
              className="w-full"
              disabled={!content.audioUrl}
              data-testid="slider-progress"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span data-testid="text-current-time">{formatTime(currentTime)}</span>
              <span data-testid="text-total-duration">{formatTime(duration)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-32">
            <Volume2 className="h-4 w-4" />
            <Slider
              value={volume}
              onValueChange={setVolume}
              max={1}
              step={0.1}
              className="flex-1"
              data-testid="slider-volume"
            />
          </div>
        </div>

        {/* Scrolling Transcript with Sentence-by-Sentence Highlighting */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Transcript</h3>
          <div className="text-center text-sm text-muted-foreground mb-2">
            Click on any sentence to jump to that part of the audio
          </div>
          <div 
            ref={textScrollRef}
            className="max-h-96 overflow-y-auto p-4 bg-muted/30 rounded-lg border" 
            data-testid="container-transcript"
          >
            <div className="space-y-1">
              {sentences.map((sentence, index) => (
                <span
                  key={index}
                  data-sentence={index}
                  onClick={() => handleSentenceClick(index)}
                  className={cn(
                    "cursor-pointer transition-all duration-300 inline-block leading-relaxed",
                    index === currentSentenceIndex
                      ? "bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 font-medium px-2 py-1 rounded"
                      : "hover:bg-gray-200 dark:hover:bg-gray-700 text-muted-foreground px-1"
                  )}
                  data-testid={`text-sentence-${index}`}
                >
                  {sentence.text}{' '}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Audio Status */}
        {!content.audioUrl && (
          <div className="text-center p-8 text-muted-foreground" data-testid="status-no-audio">
            <p>Audio not yet generated for this episode.</p>
            <p className="text-sm mt-2">The transcript is available for reading above.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}