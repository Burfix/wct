import { prisma } from "@/lib/db";
import { subDays } from "date-fns";

export interface ZoneRiskMetrics {
  zone: string;
  riskScore: number;
  restaurantCriticals: number;
  highFootfallReds: number;
  next72HoursRisk: number;
  overdueCriticalActions: number;
  totalReds: number;
  trend: {
    delta: number;
    direction: "up" | "down" | "stable";
    percentage: number;
  };
  drivingFactors: string;
}

/**
 * Calculate composite risk score for a zone
 */
function calculateRiskScore(metrics: {
  restaurantCriticals: number;
  highFootfallReds: number;
  next72HoursRisk: number;
  overdueCriticalActions: number;
  totalReds: number;
}): number {
  return (
    metrics.restaurantCriticals * 5 +
    metrics.highFootfallReds * 4 +
    metrics.next72HoursRisk * 4 +
    metrics.overdueCriticalActions * 3 +
    metrics.totalReds * 2
  );
}

/**
 * Get driving factors description for a zone
 */
function getDrivingFactors(metrics: {
  restaurantCriticals: number;
  highFootfallReds: number;
  next72HoursRisk: number;
  zone: string;
}): string {
  const factors: string[] = [];
  
  if (metrics.restaurantCriticals > 0) {
    factors.push(`${metrics.restaurantCriticals} Restaurant Critical${metrics.restaurantCriticals !== 1 ? 's' : ''}`);
  }
  if (metrics.highFootfallReds > 0) {
    factors.push(`${metrics.highFootfallReds} High-footfall Red${metrics.highFootfallReds !== 1 ? 's' : ''}`);
  }
  if (metrics.next72HoursRisk > 0) {
    factors.push(`${metrics.next72HoursRisk} 72h expir${metrics.next72HoursRisk !== 1 ? 'ies' : 'y'}`);
  }

  return factors.length > 0 
    ? `${metrics.zone}: ${factors.join(" + ")}`
    : `${metrics.zone}: All clear`;
}

/**
 * Calculate zone risk metrics for a given time window
 */
async function calculateZoneMetrics(
  startDate: Date,
  endDate: Date
): Promise<Map<string, Omit<ZoneRiskMetrics, "trend" | "drivingFactors">>> {
  const now72HoursFromNow = new Date();
  now72HoursFromNow.setHours(now72HoursFromNow.getHours() + 72);

  // Get all stores grouped by zone with their metrics
  const stores = await prisma.store.findMany({
    where: {
      status: "active",
      updatedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      zone: true,
      storeType: true,
      highFootTraffic: true,
      overallStatus: true,
      complianceItems: {
        where: {
          status: "RED",
        },
        select: {
          id: true,
          status: true,
          category: true,
          expiryDate: true,
        },
      },
      correctiveActions: {
        where: {
          status: {
            in: ["IN_PROGRESS"],
          },
          dueDate: {
            lt: new Date(),
          },
          severity: "CRITICAL",
        },
        select: {
          id: true,
        },
      },
    },
  });

  const zoneMetrics = new Map<string, Omit<ZoneRiskMetrics, "trend" | "drivingFactors">>();

  for (const store of stores) {
    const zone = store.zone;
    const existing = zoneMetrics.get(zone) || {
      zone,
      riskScore: 0,
      restaurantCriticals: 0,
      highFootfallReds: 0,
      next72HoursRisk: 0,
      overdueCriticalActions: 0,
      totalReds: 0,
    };

    // Restaurant Criticals: F&B stores with RED extraction/suppression/fire equipment
    const isRestaurantCritical =
      store.storeType === "FB" &&
      store.complianceItems.some(
        (item: { status: string; category: string }) =>
          item.status === "RED" &&
          (item.category === "EXTRACTION_CERT" ||
            item.category === "FIRE_SUPPRESSION_CERT" ||
            item.category === "FIRE_EQUIPMENT")
      );
    if (isRestaurantCritical) {
      existing.restaurantCriticals++;
    }

    // High-footfall Reds
    if (store.highFootTraffic && store.overallStatus === "RED") {
      existing.highFootfallReds++;
    }

    // Next 72 Hours Risk (items expiring in 72h)
    const has72HourRisk = store.complianceItems.some(
      (item: { expiryDate: Date | null; status: string }) =>
        item.expiryDate &&
        item.expiryDate <= now72HoursFromNow &&
        item.expiryDate > new Date() &&
        item.status !== "GREEN"
    );
    if (has72HourRisk) {
      existing.next72HoursRisk++;
    }

    // Overdue Critical Actions
    if (store.correctiveActions.length > 0) {
      existing.overdueCriticalActions += store.correctiveActions.length;
    }

    // Total Reds
    if (store.overallStatus === "RED") {
      existing.totalReds++;
    }

    zoneMetrics.set(zone, existing);
  }

  // Calculate risk scores
  for (const [, metrics] of zoneMetrics.entries()) {
    metrics.riskScore = calculateRiskScore(metrics);
  }

  return zoneMetrics;
}

/**
 * Get top 3 zones with highest risk scores
 */
export async function getRiskRadarTop3(
  timeWindowDays: number = 7
): Promise<ZoneRiskMetrics[]> {
  const now = new Date();
  const currentWindowStart = subDays(now, timeWindowDays);
  const previousWindowStart = subDays(now, timeWindowDays * 2);
  const previousWindowEnd = currentWindowStart;

  // Calculate metrics for current and previous windows
  const [currentMetrics, previousMetrics] = await Promise.all([
    calculateZoneMetrics(currentWindowStart, now),
    calculateZoneMetrics(previousWindowStart, previousWindowEnd),
  ]);

  // Combine and calculate trends
  const zoneRiskData: ZoneRiskMetrics[] = [];

  for (const [zone, current] of currentMetrics.entries()) {
    const previous = previousMetrics.get(zone);
    const previousScore = previous?.riskScore || 0;
    const delta = current.riskScore - previousScore;
    const percentage =
      previousScore > 0 ? Math.round((delta / previousScore) * 100) : 0;

    zoneRiskData.push({
      ...current,
      trend: {
        delta,
        direction:
          delta > 0 ? "up" : delta < 0 ? "down" : "stable",
        percentage,
      },
      drivingFactors: getDrivingFactors({
        restaurantCriticals: current.restaurantCriticals,
        highFootfallReds: current.highFootfallReds,
        next72HoursRisk: current.next72HoursRisk,
        zone,
      }),
    });
  }

  // Sort by risk score descending and return top 3
  return zoneRiskData
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 3);
}
