import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, Star, Trophy, Target, Zap, Medal, Calendar, Book, Users } from "lucide-react";

export default function Achievements() {
  const { data: userAchievements, isLoading } = useQuery({
    queryKey: ["/api/achievements/user"],
  });

  const { data: pointsSummary } = useQuery({
    queryKey: ["/api/points/summary"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // All possible achievements with their requirements
  const allAchievements = [
    {
      id: "first_competition",
      title: "First Competition",
      description: "Complete your first monthly competition",
      icon: Trophy,
      category: "competition",
      difficulty: "bronze",
      points: 100,
      requirement: "Complete 1 competition"
    },
    {
      id: "competition_veteran",
      title: "Competition Veteran", 
      description: "Complete 5 monthly competitions",
      icon: Medal,
      category: "competition",
      difficulty: "silver",
      points: 300,
      requirement: "Complete 5 competitions"
    },
    {
      id: "competition_master",
      title: "Competition Master",
      description: "Complete 10 monthly competitions",
      icon: Star,
      category: "competition", 
      difficulty: "gold",
      points: 500,
      requirement: "Complete 10 competitions"
    },
    {
      id: "perfect_score",
      title: "Perfect Score",
      description: "Achieve 100% on a competition",
      icon: Target,
      category: "performance",
      difficulty: "gold",
      points: 500,
      requirement: "Score 100% on any competition"
    },
    {
      id: "top_performer",
      title: "Top Performer",
      description: "Finish in the top 3 of a competition",
      icon: Award,
      category: "performance",
      difficulty: "silver",
      points: 250,
      requirement: "Rank in top 3"
    },
    {
      id: "speed_demon",
      title: "Speed Demon",
      description: "Complete a competition in under 60 minutes",
      icon: Zap,
      category: "performance",
      difficulty: "silver",
      points: 200,
      requirement: "Complete in under 60 minutes"
    },
    {
      id: "early_bird",
      title: "Early Bird",
      description: "Join a competition within the first hour",
      icon: Calendar,
      category: "participation",
      difficulty: "bronze",
      points: 50,
      requirement: "Join within first hour"
    },
    {
      id: "knowledge_seeker",
      title: "Knowledge Seeker", 
      description: "Answer 100 questions correctly across all competitions",
      icon: Book,
      category: "knowledge",
      difficulty: "silver",
      points: 300,
      requirement: "100 correct answers total"
    },
    {
      id: "community_member",
      title: "Community Member",
      description: "Be part of the plumbing community",
      icon: Users,
      category: "community",
      difficulty: "bronze",
      points: 50,
      requirement: "Register and complete profile"
    }
  ];

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      Trophy, Star, Medal, Target, Zap, Award, Calendar, Book, Users
    };
    return iconMap[iconName] || Award;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "bronze": return "bg-orange-100 text-orange-800 border-orange-200";
      case "silver": return "bg-gray-100 text-gray-800 border-gray-200";
      case "gold": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "competition": return "from-blue-500 to-blue-600";
      case "performance": return "from-green-500 to-green-600";
      case "participation": return "from-purple-500 to-purple-600";
      case "knowledge": return "from-orange-500 to-orange-600";
      case "community": return "from-pink-500 to-pink-600";
      default: return "from-gray-500 to-gray-600";
    }
  };

  // Check if user has earned each achievement
  const getUserAchievementStatus = (achievementId: string) => {
    if (!userAchievements) return { earned: false, progress: 0 };
    
    const userAchievement = userAchievements.find((a: any) => a.achievementId === achievementId);
    if (userAchievement) {
      return { earned: true, progress: 100, earnedAt: userAchievement.earnedAt };
    }
    
    // Calculate progress based on user stats
    const progress = calculateProgress(achievementId);
    return { earned: false, progress };
  };

  const calculateProgress = (achievementId: string) => {
    if (!pointsSummary) return 0;
    
    switch (achievementId) {
      case "first_competition":
        return pointsSummary.competitionsEntered >= 1 ? 100 : (pointsSummary.competitionsEntered * 100);
      case "competition_veteran":
        return Math.min(100, (pointsSummary.competitionsEntered / 5) * 100);
      case "competition_master":
        return Math.min(100, (pointsSummary.competitionsEntered / 10) * 100);
      case "community_member":
        return 100; // Earned by being registered
      default:
        return 0;
    }
  };

  const earnedAchievements = allAchievements.filter(achievement => 
    getUserAchievementStatus(achievement.id).earned
  );

  const totalPoints = earnedAchievements.reduce((sum, achievement) => sum + achievement.points, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8" data-testid="achievements-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4" data-testid="page-title">
            Your Achievements
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-testid="page-description">
            Track your progress and unlock badges as you advance in your plumbing certification journey
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6 text-center">
              <Award className="w-8 h-8 mx-auto mb-2 opacity-90" />
              <div className="text-3xl font-bold" data-testid="total-achievements">
                {earnedAchievements.length}
              </div>
              <div className="text-sm opacity-90">Achievements Earned</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6 text-center">
              <Star className="w-8 h-8 mx-auto mb-2 opacity-90" />
              <div className="text-3xl font-bold" data-testid="achievement-points">
                {totalPoints}
              </div>
              <div className="text-sm opacity-90">Achievement Points</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 opacity-90" />
              <div className="text-3xl font-bold" data-testid="competitions-completed">
                {pointsSummary?.competitionsEntered || 0}
              </div>
              <div className="text-sm opacity-90">Competitions</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-90" />
              <div className="text-3xl font-bold" data-testid="completion-rate">
                {Math.round((earnedAchievements.length / allAchievements.length) * 100)}%
              </div>
              <div className="text-sm opacity-90">Completion Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allAchievements.map((achievement) => {
            const status = getUserAchievementStatus(achievement.id);
            const IconComponent = getIconComponent(achievement.icon.name);
            
            return (
              <Card 
                key={achievement.id}
                className={`relative overflow-hidden transition-all duration-200 ${
                  status.earned 
                    ? "ring-2 ring-green-400 shadow-lg transform hover:scale-105" 
                    : "hover:shadow-md opacity-80"
                }`}
                data-testid={`achievement-${achievement.id}`}
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getCategoryColor(achievement.category)}`} />
                
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${getCategoryColor(achievement.category)} text-white`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getDifficultyColor(achievement.difficulty)} data-testid={`difficulty-${achievement.id}`}>
                        {achievement.difficulty}
                      </Badge>
                      {status.earned && (
                        <Badge className="bg-green-100 text-green-800 border-green-200" data-testid={`earned-badge-${achievement.id}`}>
                          ✓ Earned
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <CardTitle className="text-lg" data-testid={`title-${achievement.id}`}>
                    {achievement.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600" data-testid={`description-${achievement.id}`}>
                    {achievement.description}
                  </p>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Requirement:</span>
                      <span className="font-medium" data-testid={`requirement-${achievement.id}`}>
                        {achievement.requirement}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Points:</span>
                      <span className="font-bold text-blue-600" data-testid={`points-${achievement.id}`}>
                        {achievement.points}
                      </span>
                    </div>
                    
                    {!status.earned && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress:</span>
                          <span data-testid={`progress-text-${achievement.id}`}>
                            {Math.round(status.progress)}%
                          </span>
                        </div>
                        <Progress 
                          value={status.progress} 
                          className="h-2"
                          data-testid={`progress-bar-${achievement.id}`}
                        />
                      </div>
                    )}
                    
                    {status.earned && status.earnedAt && (
                      <div className="text-sm text-green-600 font-medium" data-testid={`earned-date-${achievement.id}`}>
                        Earned: {new Date(status.earnedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}