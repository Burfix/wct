import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { ZoneRiskMetrics } from "@/lib/risk-radar";

interface RiskRadarProps {
  zones: ZoneRiskMetrics[];
}

export function RiskRadar({ zones }: RiskRadarProps) {
  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-red-500 text-white";
    if (rank === 2) return "bg-orange-500 text-white";
    return "bg-yellow-500 text-white";
  };

  const getTrendIcon = (direction: "up" | "down" | "stable") => {
    if (direction === "up") return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (direction === "down") return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getTrendColor = (direction: "up" | "down" | "stable") => {
    if (direction === "up") return "text-red-600";
    if (direction === "down") return "text-green-600";
    return "text-gray-500";
  };

  const buildFilterUrl = (zone: string) => {
    // Build URL with filters for this zone's risk factors
    return `/stores?zone=${encodeURIComponent(zone)}&status=RED`;
  };

  return (
    <Card className="border-2 border-orange-200 bg-gradient-to-br from-white to-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-xl font-bold">Risk Radar — Top Zones Today</CardTitle>
          </div>
          <Link
            href="/stores"
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            View all zones →
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Based on Restaurant Criticals, High-footfall Reds, and Next 72h risk
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {zones.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No critical risk zones detected</p>
            <p className="text-xs mt-1">All zones are performing well</p>
          </div>
        ) : (
          zones.map((zone, index) => (
            <Link
              key={zone.zone}
              href={buildFilterUrl(zone.zone)}
              className="block border rounded-lg p-4 hover:bg-white hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                {/* Rank Badge */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankBadgeColor(
                    index + 1
                  )}`}
                >
                  {index + 1}
                </div>

                {/* Zone Info */}
                <div className="flex-1 space-y-2">
                  {/* Zone Name & Score */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
                        {zone.zone}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {zone.drivingFactors}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-600">
                        {zone.riskScore}
                      </div>
                      <div className="text-xs text-muted-foreground">risk score</div>
                    </div>
                  </div>

                  {/* Metrics Breakdown */}
                  <div className="flex flex-wrap gap-2">
                    {zone.restaurantCriticals > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        RC: {zone.restaurantCriticals}
                      </Badge>
                    )}
                    {zone.highFootfallReds > 0 && (
                      <Badge variant="destructive" className="text-xs bg-orange-600">
                        HF: {zone.highFootfallReds}
                      </Badge>
                    )}
                    {zone.next72HoursRisk > 0 && (
                      <Badge variant="destructive" className="text-xs bg-yellow-600">
                        72h: {zone.next72HoursRisk}
                      </Badge>
                    )}
                    {zone.overdueCriticalActions > 0 && (
                      <Badge variant="outline" className="text-xs border-red-300 text-red-700">
                        {zone.overdueCriticalActions} overdue
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {zone.totalReds} total REDs
                    </Badge>
                  </div>

                  {/* Trend */}
                  <div className="flex items-center gap-2">
                    {getTrendIcon(zone.trend.direction)}
                    <span className={`text-xs font-medium ${getTrendColor(zone.trend.direction)}`}>
                      {zone.trend.direction === "stable"
                        ? "No change"
                        : zone.trend.direction === "up"
                        ? `+${zone.trend.delta} (worse)`
                        : `${zone.trend.delta} (better)`}{" "}
                      vs last 7 days
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
