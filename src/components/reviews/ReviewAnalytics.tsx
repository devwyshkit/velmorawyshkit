/**
 * Review Analytics Component
 * Feature 4: PROMPT 9
 * Charts and insights from reviews
 */

import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { getCommonComplaints } from "@/lib/reviews/sentiment";
import type { Review, ReviewStats } from "@/types/reviews";

interface ReviewAnalyticsProps {
  reviews: Review[];
  stats: ReviewStats;
}

export const ReviewAnalytics = ({ reviews, stats }: ReviewAnalyticsProps) => {
  const complaints = getCommonComplaints(reviews);

  return (
    <div className="space-y-6">
      {/* Sentiment Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sentiment Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Positive
                </span>
                <span className="text-sm text-muted-foreground">
                  {stats.sentiment.positive.toFixed(0)}%
                </span>
              </div>
              <Progress value={stats.sentiment.positive} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Neutral</span>
                <span className="text-sm text-muted-foreground">
                  {stats.sentiment.neutral.toFixed(0)}%
                </span>
              </div>
              <Progress value={stats.sentiment.neutral} className="h-2 [&>div]:bg-yellow-400" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  Negative
                </span>
                <span className="text-sm text-muted-foreground">
                  {stats.sentiment.negative.toFixed(0)}%
                </span>
              </div>
              <Progress value={stats.sentiment.negative} className="h-2 [&>div]:bg-destructive" />
            </div>
          </div>

          {/* Sentiment Interpretation */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">
              {stats.sentiment.positive >= 70 ? (
                <span className="text-green-700">
                  ✓ <strong>Excellent!</strong> Customers love your products.
                </span>
              ) : stats.sentiment.positive >= 50 ? (
                <span className="text-yellow-700">
                  ⚠ <strong>Good,</strong> but there's room for improvement.
                </span>
              ) : (
                <span className="text-red-700">
                  ⚠ <strong>Attention needed.</strong> Address negative feedback.
                </span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Common Complaints */}
      {complaints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Common Complaints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {complaints.map((complaint, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm">{complaint.issue}</span>
                  <Badge variant="outline">{complaint.count} mentions</Badge>
                </div>
              ))}
            </div>
            
            {complaints.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>Tip:</strong> Focus on addressing "{complaints[0].issue}" 
                  to improve overall satisfaction.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Response Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Response Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Response Rate</Label>
              <p className="text-2xl font-bold">{stats.response_rate}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.response_rate >= 80 ? 'Excellent!' : 'Aim for 80%+'}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Avg Response Time</Label>
              <p className="text-2xl font-bold">{stats.avg_response_time_hours}h</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.avg_response_time_hours <= 24 ? 'Great!' : 'Try to respond within 24h'}
              </p>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Did you know?</strong> Partners who respond to reviews see 20% higher customer trust.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Improvement Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Improvement Areas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {stats.response_rate < 80 && (
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-0.5">!</Badge>
                <p>Respond to more reviews to increase trust (target: 80%+)</p>
              </div>
            )}
            {stats.avg_response_time_hours > 24 && (
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-0.5">!</Badge>
                <p>Try to respond within 24 hours for better engagement</p>
              </div>
            )}
            {stats.overall_rating < 4.5 && (
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-0.5">!</Badge>
                <p>Focus on addressing negative feedback to improve overall rating</p>
              </div>
            )}
            {stats.response_rate >= 80 && stats.avg_response_time_hours <= 24 && stats.overall_rating >= 4.5 && (
              <div className="text-center py-4">
                <p className="text-green-700 font-medium">✓ You're doing great! Keep it up!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

