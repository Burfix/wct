"use server";

import { prisma } from "@/lib/db";
import { calculateStoreOverallStatus, calculatePriorityScore, DEFAULT_EXPIRY_THRESHOLD_DAYS } from "@/lib/compliance";
import type { StoreData } from "@/lib/compliance";
import { ComplianceStatus, ActionStatus, StoreType } from "@prisma/client";

export async function getDashboardStats() {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    totalStores,
    storesByStatus,
    expiringIn30,
    expiringIn14,
    expiringIn7,
    overdueActions,
    criticalOverdueActions,
  ] = await Promise.all([
    prisma.store.count({ where: { status: "active" } }),
    
    prisma.store.groupBy({
      by: ["overallStatus"],
      where: { status: "active" },
      _count: true,
    }),

    prisma.complianceItem.count({
      where: {
        expiryDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
        status: "ORANGE",
      },
    }),

    prisma.complianceItem.count({
      where: {
        expiryDate: {
          gte: now,
          lte: fourteenDaysFromNow,
        },
        status: "ORANGE",
      },
    }),

    prisma.complianceItem.count({
      where: {
        expiryDate: {
          gte: now,
          lte: sevenDaysFromNow,
        },
        status: "ORANGE",
      },
    }),

    prisma.correctiveAction.count({
      where: {
        dueDate: { lt: now },
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
    }),

    prisma.correctiveAction.count({
      where: {
        dueDate: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
    }),
  ]);

  const statusMap = storesByStatus.reduce((acc, item) => {
    acc[item.overallStatus] = item._count;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalStores,
    green: statusMap.GREEN || 0,
    orange: statusMap.ORANGE || 0,
    red: statusMap.RED || 0,
    grey: statusMap.GREY || 0,
    expiringIn30,
    expiringIn14,
    expiringIn7,
    overdueActions,
    criticalOverdueActions,
  };
}

export async function getPriorityStores(limit: number = 20) {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Optimized: Use SQL aggregations instead of loading all stores
  const topStores = await prisma.$queryRaw<Array<{
    id: string;
    storeCode: string;
    name: string;
    zone: string;
    floor: string | null;
    storeType: StoreType;
    overallStatus: ComplianceStatus;
    highFootTraffic: boolean;
    redCount: bigint;
    orangeCount: bigint;
    criticalOverdueCount: bigint;
    overdueCount: bigint;
    openActionsCount: bigint;
    expiringIn7DaysCount: bigint;
  }>>`
    SELECT 
      s.id,
      s."storeCode",
      s.name,
      s.zone,
      s.floor,
      s."storeType",
      s."overallStatus",
      s."highFootTraffic",
      COUNT(CASE WHEN ci.status = 'RED' THEN 1 END) as "redCount",
      COUNT(CASE WHEN ci.status = 'ORANGE' THEN 1 END) as "orangeCount",
      COUNT(CASE WHEN ca.severity = 'CRITICAL' AND ca."dueDate" < ${now} AND ca.status IN ('OPEN', 'IN_PROGRESS') THEN 1 END) as "criticalOverdueCount",
      COUNT(CASE WHEN ca."dueDate" < ${now} AND ca.status IN ('OPEN', 'IN_PROGRESS') THEN 1 END) as "overdueCount",
      COUNT(CASE WHEN ca.status IN ('OPEN', 'IN_PROGRESS') THEN 1 END) as "openActionsCount",
      COUNT(CASE WHEN ci."expiryDate" BETWEEN ${now} AND ${sevenDaysFromNow} AND ci.status = 'ORANGE' THEN 1 END) as "expiringIn7DaysCount"
    FROM stores s
    LEFT JOIN "ComplianceItem" ci ON ci."storeId" = s.id
    LEFT JOIN "CorrectiveAction" ca ON ca."storeId" = s.id
    WHERE s.status = 'active'
    GROUP BY s.id, s."storeCode", s.name, s.zone, s.floor, s."storeType", s."overallStatus", s."highFootTraffic"
    ORDER BY 
      COUNT(CASE WHEN ci.status = 'RED' THEN 1 END) DESC,
      COUNT(CASE WHEN ca.severity = 'CRITICAL' AND ca."dueDate" < ${now} THEN 1 END) DESC,
      COUNT(CASE WHEN ci."expiryDate" BETWEEN ${now} AND ${sevenDaysFromNow} THEN 1 END) DESC,
      s."highFootTraffic" DESC
    LIMIT ${limit}
  `;

  // Get assigned officers for top stores
  const storeIds = topStores.map(s => s.id);
  const assignments = await prisma.storeAssignment.findMany({
    where: {
      storeId: { in: storeIds },
      active: true,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const assignmentMap = new Map(
    assignments.map(a => [a.storeId, a.user])
  );

  return topStores.map(store => ({
    id: store.id,
    storeCode: store.storeCode,
    name: store.name,
    zone: store.zone,
    floor: store.floor,
    storeType: store.storeType,
    overallStatus: store.overallStatus,
    highFootTraffic: store.highFootTraffic,
    priorityScore: 
      Number(store.redCount) * 10 + 
      Number(store.criticalOverdueCount) * 8 +
      Number(store.expiringIn7DaysCount) * 5 +
      Number(store.orangeCount) * 3 +
      (store.highFootTraffic ? 5 : 0),
    priorityReasons: [
      ...(Number(store.redCount) > 0 ? [`${store.redCount} RED compliance items`] : []),
      ...(Number(store.criticalOverdueCount) > 0 ? [`${store.criticalOverdueCount} critical overdue actions`] : []),
      ...(Number(store.expiringIn7DaysCount) > 0 ? [`${store.expiringIn7DaysCount} items expiring in 7 days`] : []),
      ...(Number(store.orangeCount) > 0 ? [`${store.orangeCount} ORANGE items`] : []),
      ...(store.highFootTraffic ? ['High foot traffic'] : []),
    ],
    calculatedStatus: store.overallStatus,
    assignedOfficer: assignmentMap.get(store.id) || null,
    correctiveActions: { length: Number(store.openActionsCount) },
  }));
}

export async function getZoneHotspots() {
  // Optimized: Use SQL aggregation for zone statistics
  const zoneStats = await prisma.$queryRaw<Array<{
    zone: string;
    total: bigint;
    green: bigint;
    orange: bigint;
    red: bigint;
    grey: bigint;
  }>>`
    SELECT 
      zone,
      COUNT(*) as total,
      COUNT(CASE WHEN "overallStatus" = 'GREEN' THEN 1 END) as green,
      COUNT(CASE WHEN "overallStatus" = 'ORANGE' THEN 1 END) as orange,
      COUNT(CASE WHEN "overallStatus" = 'RED' THEN 1 END) as red,
      COUNT(CASE WHEN "overallStatus" = 'GREY' THEN 1 END) as grey
    FROM stores
    WHERE status = 'active'
    GROUP BY zone
    ORDER BY 
      COUNT(CASE WHEN "overallStatus" = 'RED' THEN 1 END) DESC,
      COUNT(CASE WHEN "overallStatus" = 'ORANGE' THEN 1 END) DESC
  `;

  return zoneStats.map(zone => ({
    zone: zone.zone,
    total: Number(zone.total),
    green: Number(zone.green),
    orange: Number(zone.orange),
    red: Number(zone.red),
    grey: Number(zone.grey),
    riskScore: Number(zone.red) * 10 + Number(zone.orange) * 5,
    avgPriorityScore: Number(zone.red) > 0 ? Math.round((Number(zone.red) * 10 + Number(zone.orange) * 5) / Number(zone.total) * 10) : 0,
  }));
}

export async function getCategoryBreakdown() {
  // Optimized: Use SQL aggregation for category statistics
  const breakdown = await prisma.$queryRaw<Array<{
    category: string;
    red: bigint;
    orange: bigint;
  }>>`
    SELECT 
      category,
      COUNT(CASE WHEN status = 'RED' THEN 1 END) as red,
      COUNT(CASE WHEN status = 'ORANGE' THEN 1 END) as orange
    FROM "ComplianceItem" ci
    INNER JOIN stores s ON ci."storeId" = s.id
    WHERE s.status = 'active' AND ci.status IN ('RED', 'ORANGE')
    GROUP BY category
    ORDER BY 
      COUNT(CASE WHEN status = 'RED' THEN 1 END) DESC,
      COUNT(CASE WHEN status = 'ORANGE' THEN 1 END) DESC
  `;

  return breakdown.map(item => ({
    category: item.category,
    red: Number(item.red),
    orange: Number(item.orange),
  }));
}

export async function getOfficerWorkload() {
  // Optimized: Use SQL aggregation for officer workload
  const now = new Date();
  
  const workload = await prisma.$queryRaw<Array<{
    id: string;
    name: string | null;
    email: string;
    role: string;
    assignedStores: bigint;
    redStores: bigint;
    openActions: bigint;
    overdueActions: bigint;
  }>>`
    SELECT 
      u.id,
      u.name,
      u.email,
      u.role,
      COUNT(DISTINCT sa.id) as "assignedStores",
      COUNT(DISTINCT CASE WHEN s."overallStatus" = 'RED' THEN sa.id END) as "redStores",
      COUNT(DISTINCT ca.id) as "openActions",
      COUNT(DISTINCT CASE WHEN ca."dueDate" < ${now} THEN ca.id END) as "overdueActions"
    FROM users u
    LEFT JOIN "StoreAssignment" sa ON sa."userId" = u.id AND sa.active = true
    LEFT JOIN stores s ON s.id = sa."storeId" AND s.status = 'active'
    LEFT JOIN "CorrectiveAction" ca ON ca."assignedToId" = u.id AND ca.status IN ('OPEN', 'IN_PROGRESS')
    WHERE u.role IN ('OFFICER', 'ADMIN') AND u.active = true
    GROUP BY u.id, u.name, u.email, u.role
    ORDER BY "redStores" DESC, "overdueActions" DESC
  `;

  return workload.map(officer => ({
    id: officer.id,
    name: officer.name || officer.email,
    email: officer.email,
    role: officer.role,
    assignedStores: Number(officer.assignedStores),
    redStores: Number(officer.redStores),
    openActions: Number(officer.openActions),
    overdueActions: Number(officer.overdueActions),
  }));
}

export async function getComplianceTrend(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // This is a simplified version - in production you'd track historical data
  const activities = await prisma.activityLog.findMany({
    where: {
      createdAt: { gte: startDate },
      action: { in: ["STATUS_CHANGED", "ACTION_CLOSED", "ACTION_CREATED"] },
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by date and calculate daily metrics
  interface TrendEntry {
    date: string;
    redsCreated: number;
    redsResolved: number;
    actionsOpened: number;
    actionsClosed: number;
  }
  const trendData: Record<string, TrendEntry> = {};

  activities.forEach((activity) => {
    const date = activity.createdAt.toISOString().split("T")[0];
    if (!trendData[date]) {
      trendData[date] = {
        date,
        redsCreated: 0,
        redsResolved: 0,
        actionsOpened: 0,
        actionsClosed: 0,
      };
    }

    // Parse details to count metrics
    // This is simplified - you'd have more sophisticated tracking
    if (activity.action === "STATUS_CHANGED") {
      if (activity.details?.includes("RED")) {
        trendData[date].redsCreated++;
      } else if (activity.details?.includes("GREEN")) {
        trendData[date].redsResolved++;
      }
    } else if (activity.action === "ACTION_CREATED") {
      trendData[date].actionsOpened++;
    } else if (activity.action === "ACTION_CLOSED") {
      trendData[date].actionsClosed++;
    }
  });

  return Object.values(trendData);
}
