import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, Award, Crown, Target, TrendingUp } from "lucide-react";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["/api/leaderboard"],
    queryFn: () => fetch("/api/leaderboard").then(res => res.json()),
  });

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2: return <Trophy className="w-6 h-6 text-gray-400" />;
      case 3: return <Medal className="w-6 h-6 text-orange-500" />;
      default: return <Award className="w-6 h-6 text-blue-500" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
      case 2: return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
      case 3: return "bg-gradient-to-r from-orange-400 to-orange-600 text-white";
      default: return "bg-white border";
    }
  };

  const getInitials = (firstName?: string, lastName?: string, username?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (username) {
      return username.slice(0, 2).toUpperCase();
    }
    return "??";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8" data-testid="leaderboard-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4" data-testid="page-title">
            Competition Leaderboard
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto" data-testid="page-description">
            See how you rank against other Louisiana plumbing professionals
          </p>
        </div>

        {/* Top 3 Podium */}
        {leaderboard && leaderboard.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* 2nd Place */}
              {leaderboard[1] && (
                <Card className={`${getRankColor(2)} transform md:-translate-y-4`}>
                  <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-2">
                      {getRankIcon(2)}
                    </div>
                    <div className="text-lg font-bold" data-testid="rank-2-name">
                      {leaderboard[1].firstName} {leaderboard[1].lastName}
                    </div>
                    <div className="text-sm opacity-90">2nd Place</div>
                  </CardHeader>
                  <CardContent className="text-center pt-0">
                    <div className="text-2xl font-bold" data-testid="rank-2-points">
                      {leaderboard[1].totalPoints}
                    </div>
                    <div className="text-sm opacity-90">Total Points</div>
                  </CardContent>
                </Card>
              )}

              {/* 1st Place */}
              {leaderboard[0] && (
                <Card className={`${getRankColor(1)} transform md:-translate-y-8`}>
                  <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-2">
                      {getRankIcon(1)}
                    </div>
                    <div className="text-xl font-bold" data-testid="rank-1-name">
                      {leaderboard[0].firstName} {leaderboard[0].lastName}
                    </div>
                    <div className="text-sm opacity-90">Champion</div>
                  </CardHeader>
                  <CardContent className="text-center pt-0">
                    <div className="text-3xl font-bold" data-testid="rank-1-points">
                      {leaderboard[0].totalPoints}
                    </div>
                    <div className="text-sm opacity-90">Total Points</div>
                  </CardContent>
                </Card>
              )}

              {/* 3rd Place */}
              {leaderboard[2] && (
                <Card className={`${getRankColor(3)} transform md:-translate-y-4`}>
                  <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-2">
                      {getRankIcon(3)}
                    </div>
                    <div className="text-lg font-bold" data-testid="rank-3-name">
                      {leaderboard[2].firstName} {leaderboard[2].lastName}
                    </div>
                    <div className="text-sm opacity-90">3rd Place</div>
                  </CardHeader>
                  <CardContent className="text-center pt-0">
                    <div className="text-2xl font-bold" data-testid="rank-3-points">
                      {leaderboard[2].totalPoints}
                    </div>
                    <div className="text-sm opacity-90">Total Points</div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Full Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!leaderboard || leaderboard.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No competition data yet. Be the first to compete!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((user: any, index: number) => {
                  const rank = index + 1;
                  const isCurrentUser = currentUser && user.id === currentUser.id;
                  
                  return (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                        isCurrentUser 
                          ? "bg-blue-50 border-2 border-blue-200" 
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                      data-testid={`leaderboard-row-${rank}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10">
                          {rank <= 3 ? (
                            getRankIcon(rank)
                          ) : (
                            <div className="text-lg font-bold text-gray-600" data-testid={`rank-${rank}`}>
                              #{rank}
                            </div>
                          )}
                        </div>
                        
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(user.firstName, user.lastName, user.username)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="font-semibold flex items-center gap-2" data-testid={`user-name-${rank}`}>
                            {user.firstName} {user.lastName}
                            {isCurrentUser && (
                              <Badge variant="secondary" className="text-xs">You</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600" data-testid={`user-subscription-${rank}`}>
                            {user.subscriptionTier} member
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary" data-testid={`user-points-${rank}`}>
                          {user.totalPoints}
                        </div>
                        <div className="text-sm text-gray-600">points</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current User Position (if not in top visible) */}
        {currentUser && leaderboard && leaderboard.length > 10 && (
          <Card className="mt-6 border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">Your Position</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  Your position will be calculated after competitions
                </div>
                <p className="text-gray-600">Participate in monthly competitions to see your ranking</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}