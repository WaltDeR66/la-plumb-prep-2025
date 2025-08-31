import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Square } from "lucide-react";

interface PodcastPlayerProps {
  content: string;
  autoStart?: boolean;
}

export default function PodcastPlayer({ content, autoStart = false }: PodcastPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSentence, setCurrentSentence] = useState('');
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, []);

  // Auto-start only when autoStart prop is true (when user clicked Review)
  useEffect(() => {
    if (autoStart && content && speechSynthesis && !isPlaying) {
      setTimeout(() => {
        startPodcast();
      }, 500);
    }
  }, [autoStart, content, speechSynthesis]);

  const cleanText = (text: string) => {
    return text
      .replace(/\*\[This would be.*?\]\*/g, '')
      .replace(/\\n\\n/g, '. ')
      .replace(/\\n/g, '. ')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/### (.*$)/gm, '$1. ')
      .replace(/## (.*$)/gm, '$1. ')
      .replace(/# (.*$)/gm, '$1. ')
      .replace(/\(\d{1,2}:\d{2}-\d{1,2}:\d{2}\)/g, '')
      .replace(/###\s*/g, '')
      .replace(/\?\s+/g, '? ')
      .replace(/\.\s*\./g, '.')
      .replace(/\s+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1. $2')
      .trim();
  };

  const startPodcast = () => {
    if (!speechSynthesis || !content) return;

    const processedText = cleanText(content);
    const sentences = processedText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    console.log('Total sentences found:', sentences.length);
    console.log('First few sentences:', sentences.slice(0, 3));

    let currentIndex = 0;

    const speakNextSentence = () => {
      if (currentIndex >= sentences.length) {
        console.log('Reached end of all sentences - podcast complete!');
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentUtterance(null);
        setCurrentSentence('');
        return;
      }

      const sentence = sentences[currentIndex].trim();
      if (!sentence) {
        currentIndex++;
        speakNextSentence();
        return;
      }

      setCurrentSentence(sentence);
      console.log(`Finished sentence ${currentIndex + 1}/${sentences.length}: "${sentence.substring(0, 50)}..."`);
      
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.rate = 0.85;
      utterance.pitch = 1.05;
      utterance.volume = 0.85;

      utterance.onend = () => {
        console.log(`Moving to sentence ${currentIndex + 2}`);
        currentIndex++;
        setTimeout(speakNextSentence, 300);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        setCurrentUtterance(null);
      };

      setCurrentUtterance(utterance);
      speechSynthesis.speak(utterance);
    };

    setIsPlaying(true);
    setIsPaused(false);
    speakNextSentence();
  };

  const pausePodcast = () => {
    if (speechSynthesis && isPlaying) {
      speechSynthesis.pause();
      setIsPlaying(false);
      setIsPaused(true);
    }
  };

  const resumePodcast = () => {
    if (speechSynthesis && currentUtterance) {
      speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
    }
  };

  const stopPodcast = () => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentUtterance(null);
      setCurrentSentence('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-4">🎧 Audio Lesson</h3>
        
        {/* Scrolling sentence display */}
        {currentSentence && (
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-4">📖 Now Reading:</div>
                <div className="text-xl font-medium text-gray-800 leading-relaxed animate-in slide-in-from-bottom-4 duration-500">
                  {currentSentence}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Audio controls */}
        <div className="flex justify-center space-x-4 mt-6">
          {!isPlaying && !isPaused && (
            <Button
              onClick={startPodcast}
              size="lg"
              className="flex items-center space-x-2"
              data-testid="button-start-podcast"
            >
              <Play className="w-5 h-5" />
              <span>Start Podcast</span>
            </Button>
          )}
          
          {(isPlaying || isPaused) && (
            <>
              <Button
                onClick={isPaused ? resumePodcast : pausePodcast}
                size="lg"
                className="flex items-center space-x-2"
                data-testid="button-pause-resume"
              >
                {isPaused ? (
                  <>
                    <Play className="w-5 h-5" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-5 h-5" />
                    <span>Pause</span>
                  </>
                )}
              </Button>
              
              <Button
                onClick={stopPodcast}
                variant="outline"
                size="lg"
                className="flex items-center space-x-2"
                data-testid="button-stop"
              >
                <Square className="w-5 h-5" />
                <span>Stop</span>
              </Button>
            </>
          )}
        </div>

        {/* Content text for reference */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <div 
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}