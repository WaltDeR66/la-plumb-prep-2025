import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PodcastPlayer } from '@/components/PodcastPlayer';
import { Headphones, Clock, FileText, Volume2 } from 'lucide-react';
import { useState } from 'react';

interface PodcastEpisode {
  id: string;
  title: string;
  type: string;
  chapter: number;
  section: number;
  content: {
    title: string;
    transcript: string;
    audioUrl?: string;
    duration?: number;
    segments?: any[];
  };
  duration: number; // in minutes
  difficulty: 'easy' | 'hard' | 'very_hard';
}

export function PodcastsPage() {
  const [selectedEpisode, setSelectedEpisode] = useState<PodcastEpisode | null>(null);

  const { data: episodes, isLoading } = useQuery({
    queryKey: ['/api/courses/b83c6ebe-f5bd-4787-8fd5-e3b177d9e79b/content'],
    select: (data: any[]) => data.filter((item: any) => item.type === 'podcast')
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'hard': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'very_hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (selectedEpisode) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setSelectedEpisode(null)}
            data-testid="button-back-to-episodes"
          >
            ← Back to Episodes
          </Button>
        </div>
        
        <PodcastPlayer content={selectedEpisode.content} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Headphones className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            Louisiana Plumbing Podcasts
          </h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Listen to expert discussions on Louisiana plumbing code requirements. 
          Each episode includes audio with synchronized scrolling text for optimal learning.
        </p>
      </div>

      {/* Episodes List */}
      {episodes && episodes.length > 0 ? (
        <div className="grid gap-6 max-w-4xl mx-auto">
          {episodes.map((episode: PodcastEpisode) => (
            <Card 
              key={episode.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedEpisode(episode)}
              data-testid={`card-episode-${episode.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <CardTitle className="text-lg leading-tight" data-testid={`text-episode-title-${episode.id}`}>
                      {episode.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span data-testid={`text-chapter-${episode.id}`}>
                        Chapter {episode.chapter} • Section {episode.section}
                      </span>
                    </div>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={getDifficultyColor(episode.difficulty)}
                    data-testid={`badge-difficulty-${episode.id}`}
                  >
                    {episode.difficulty.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Episode Stats */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span data-testid={`text-duration-${episode.id}`}>
                      {episode.duration} min
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>Full Transcript</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {episode.content.audioUrl ? (
                      <>
                        <Volume2 className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">Audio Available</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-4 w-4 text-yellow-600" />
                        <span className="text-yellow-600">Audio Generating</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Transcript Preview */}
                <div className="bg-muted/30 p-3 rounded border-l-4 border-primary/30">
                  <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-preview-${episode.id}`}>
                    {episode.content.transcript.slice(0, 150)}...
                  </p>
                </div>

                {/* Listen Button */}
                <Button 
                  className="w-full" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEpisode(episode);
                  }}
                  data-testid={`button-listen-${episode.id}`}
                >
                  <Headphones className="h-4 w-4 mr-2" />
                  {episode.content.audioUrl ? 'Listen Now' : 'Read Transcript'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 space-y-4">
          <Headphones className="h-16 w-16 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-semibold" data-testid="text-no-episodes">
            No Podcast Episodes Available
          </h3>
          <p className="text-muted-foreground">
            Podcast episodes are being prepared. Check back soon for educational content 
            about Louisiana plumbing code requirements.
          </p>
        </div>
      )}
    </div>
  );
}