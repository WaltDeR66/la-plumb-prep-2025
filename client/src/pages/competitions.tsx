import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { Clock, Trophy, Users, Medal, Target, Calendar, Award } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export default function Competitions() {
  const { data: currentCompetition, isLoading: competitionLoading } = useQuery({
    queryKey: ["/api/competitions/current"],
  });

  const { data: userHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/competitions/history"],
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ["/api/leaderboard"],
    queryFn: () => fetch("/api/leaderboard").then(res => res.json()),
  });

  const { data: pointsSummary } = useQuery({
    queryKey: ["/api/points/summary"],
  });

  if (competitionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "upcoming": return "bg-blue-500";
      case "completed": return "bg-gray-500";
      default: return "bg-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "Live Now";
      case "upcoming": return "Coming Soon";
      case "completed": return "Completed";
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8" data-testid="competitions-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4" data-testid="page-title">
            Monthly Competitions
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-testid="page-description">
            Compete with fellow plumbers in monthly challenges. Win free subscription time and showcase your expertise!
          </p>
        </div>

        {/* Points Summary */}
        {pointsSummary && (
          <Card className="mb-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-6 h-6" />
                Your Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold" data-testid="total-points">
                    {pointsSummary.totalPoints}
                  </div>
                  <div className="text-sm opacity-90">Total Points</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold" data-testid="competitions-entered">
                    {pointsSummary.competitionsEntered || 0}
                  </div>
                  <div className="text-sm opacity-90">Competitions Entered</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold" data-testid="best-rank">
                    {pointsSummary.bestRank ? `#${pointsSummary.bestRank}` : "N/A"}
                  </div>
                  <div className="text-sm opacity-90">Best Rank</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Competition */}
        {currentCompetition && (
          <Card className="mb-8 border-2 border-primary shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl" data-testid="current-competition-title">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    {currentCompetition.title}
                  </CardTitle>
                  <CardDescription className="text-lg mt-2" data-testid="current-competition-description">
                    {currentCompetition.description}
                  </CardDescription>
                </div>
                <Badge 
                  className={`${getStatusColor(currentCompetition.status)} text-white px-4 py-2 text-sm`}
                  data-testid={`status-badge-${currentCompetition.status}`}
                >
                  {getStatusText(currentCompetition.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-semibold">Test Date</div>
                    <div className="text-sm text-gray-600" data-testid="competition-date">
                      {format(new Date(currentCompetition.startDate), "MMMM d, yyyy")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-semibold">Time Limit</div>
                    <div className="text-sm text-gray-600" data-testid="time-limit">
                      {currentCompetition.timeLimit} minutes
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-orange-500" />
                  <div>
                    <div className="font-semibold">Questions</div>
                    <div className="text-sm text-gray-600" data-testid="question-count">
                      {currentCompetition.questionCount} questions
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Medal className="w-5 h-5 text-purple-500" />
                  <div>
                    <div className="font-semibold">Rewards</div>
                    <div className="text-sm text-gray-600" data-testid="rewards">
                      1st: Free Month, 2nd: Half Month
                    </div>
                  </div>
                </div>
              </div>

              {currentCompetition.status === "active" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-green-800 mb-2">Competition is Live!</h4>
                  <p className="text-green-700 text-sm mb-3">
                    You have until {format(new Date(currentCompetition.endDate), "h:mm a")} to complete your test.
                  </p>
                  <Link href={`/competition/${currentCompetition.id}/test`}>
                    <Button className="bg-green-600 hover:bg-green-700" data-testid="start-competition-btn">
                      Start Competition Test
                    </Button>
                  </Link>
                </div>
              )}

              {currentCompetition.status === "upcoming" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Competition Starting Soon</h4>
                  <p className="text-blue-700 text-sm">
                    Competition begins {formatDistanceToNow(new Date(currentCompetition.startDate), { addSuffix: true })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/leaderboard">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
              <CardHeader className="text-center">
                <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                <CardTitle data-testid="leaderboard-link">View Leaderboard</CardTitle>
                <CardDescription>See top performers</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/achievements">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
              <CardHeader className="text-center">
                <Award className="w-12 h-12 text-purple-500 mx-auto mb-2" />
                <CardTitle data-testid="achievements-link">Your Achievements</CardTitle>
                <CardDescription>Track your progress</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Card className="h-full">
            <CardHeader className="text-center">
              <Users className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <CardTitle>Community</CardTitle>
              <CardDescription data-testid="total-participants">
                {leaderboard?.length || 0} active competitors
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Competition History */}
        {userHistory && userHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Competition History</CardTitle>
              <CardDescription>Track your previous performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userHistory.map((attempt: any) => (
                  <div key={attempt.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`history-item-${attempt.id}`}>
                    <div>
                      <h4 className="font-semibold">{attempt.competition?.title}</h4>
                      <p className="text-sm text-gray-600">
                        {format(new Date(attempt.completedAt), "MMMM d, yyyy")}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg" data-testid={`score-${attempt.id}`}>
                        {parseFloat(attempt.score).toFixed(1)}%
                      </div>
                      {attempt.rank && (
                        <div className="text-sm text-gray-600" data-testid={`rank-${attempt.id}`}>
                          Rank #{attempt.rank}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}