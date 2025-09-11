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

export function PodcastPlayer({ content, className }: PodcastPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([0.8]);
  const [currentParagraph, setCurrentParagraph] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Split transcript into paragraphs for scrolling
  const paragraphs = content.transcript.split('\n\n').filter(p => p.trim().length > 0);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', () => setIsPlaying(false));
    
    // Auto-scroll based on time
    const updateParagraph = () => {
      if (duration > 0) {
        const progress = audio.currentTime / duration;
        const newParagraph = Math.floor(progress * paragraphs.length);
        setCurrentParagraph(Math.min(newParagraph, paragraphs.length - 1));
      }
    };
    
    audio.addEventListener('timeupdate', updateParagraph);
    
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', () => setIsPlaying(false));
      audio.removeEventListener('timeupdate', updateParagraph);
    };
  }, [duration, paragraphs.length]);

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
    setCurrentParagraph(0);
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

        {/* Scrolling Transcript */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Transcript</h3>
          <div className="max-h-96 overflow-y-auto p-4 bg-muted/30 rounded-lg border" data-testid="container-transcript">
            <div className="space-y-4">
              {paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className={cn(
                    "text-sm leading-relaxed transition-all duration-300",
                    index === currentParagraph
                      ? "text-foreground bg-primary/10 p-3 rounded-md border-l-4 border-primary"
                      : "text-muted-foreground"
                  )}
                  data-testid={`text-paragraph-${index}`}
                >
                  {paragraph}
                </p>
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