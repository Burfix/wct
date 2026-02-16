"use server";

import { prisma } from "@/lib/db";
import { calculateStoreOverallStatus, calculatePriorityScore, DEFAULT_EXPIRY_THRESHOLD_DAYS } from "@/lib/compliance";
import type { StoreData } from "@/lib/compliance";
import { ComplianceStatus, ActionStatus } from "@prisma/client";

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
  const stores = await prisma.store.findMany({
    where: { status: "active" },
    include: {
      complianceItems: {
        include: {
          evidences: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
      correctiveActions: {
        where: {
          status: { in: ["OPEN", "IN_PROGRESS"] },
        },
        select: {
          severity: true,
          status: true,
          dueDate: true,
        },
      },
      assignments: {
        where: { active: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  const peakPeriods = await prisma.peakPeriod.findMany({
    where: {
      active: true,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
    },
    select: {
      startDate: true,
      endDate: true,
    },
  });

  const context = {
    peakPeriods,
    currentDate: new Date(),
    expiryThresholds: {
      orange: DEFAULT_EXPIRY_THRESHOLD_DAYS,
    },
  };

  const storesWithPriority = stores.map((store) => {
    const complianceItemsData = store.complianceItems.map((item) => {
      const latestEvidence = item.evidences[0];
      return {
        category: item.category,
        required: item.required,
        hasEvidence: !!latestEvidence,
        expiryDate: item.expiryDate,
        verificationStatus: latestEvidence?.verificationStatus || null,
      };
    });

    const storeData: StoreData = {
      id: store.id,
      storeCode: store.storeCode,
      name: store.name,
      zone: store.zone,
      floor: store.floor,
      storeType: store.storeType,
      highFootTraffic: store.highFootTraffic,
      complianceItems: complianceItemsData,
      overdueActions: store.correctiveActions.map((a) => ({
        severity: a.severity,
        status: a.status as ActionStatus,
        dueDate: a.dueDate,
      })),
    };

    const priority = calculatePriorityScore(storeData, context);
    const overallStatus = calculateStoreOverallStatus(complianceItemsData);

    return {
      ...store,
      priorityScore: priority.score,
      priorityReasons: priority.reasons,
      calculatedStatus: overallStatus,
      assignedOfficer: store.assignments[0]?.user || null,
    };
  });

  // Sort by priority score descending
  storesWithPriority.sort((a, b) => b.priorityScore - a.priorityScore);

  return storesWithPriority.slice(0, limit);
}

export async function getZoneHotspots() {
  const stores = await prisma.store.findMany({
    where: { status: "active" },
    select: {
      zone,
      overallStatus: true,
      priorityScore: true,
    },
  });

  const zoneStats = stores.reduce((acc, store) => {
    if (!acc[store.zone]) {
      acc[store.zone] = {
        zone: store.zone,
        total: 0,
        green: 0,
        orange: 0,
        red: 0,
        grey: 0,
        avgPriorityScore: 0,
        totalPriorityScore: 0,
      };
    }

    acc[store.zone].total++;
    acc[store.zone][store.overallStatus.toLowerCase() as 'green' | 'orange' | 'red' | 'grey']++;
    acc[store.zone].totalPriorityScore += store.priorityScore;

    return acc;
  }, {} as Record<string, any>);

  // Calculate averages and risk scores
  const hotspots = Object.values(zoneStats).map((zone: any) => ({
    ...zone,
    avgPriorityScore: Math.round(zone.totalPriorityScore / zone.total),
    riskScore: zone.red * 10 + zone.orange * 5,
  }));

  // Sort by risk score descending
  hotspots.sort((a, b) => b.riskScore - a.riskScore);

  return hotspots;
}

export async function getCategoryBreakdown() {
  const items = await prisma.complianceItem.findMany({
    where: {
      store: { status: "active" },
      status: { in: ["RED", "ORANGE"] },
    },
    select: {
      category: true,
      status: true,
    },
  });

  const breakdown = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { category: item.category, red: 0, orange: 0 };
    }
    if (item.status === "RED") acc[item.category].red++;
    if (item.status === "ORANGE") acc[item.category].orange++;
    return acc;
  }, {} as Record<string, any>);

  return Object.values(breakdown);
}

export async function getOfficerWorkload() {
  const officers = await prisma.user.findMany({
    where: {
      role: { in: ["OFFICER", "ADMIN"] },
      active: true,
    },
    include: {
      assignedStores: {
        where: { active: true },
        include: {
          store: {
            select: {
              id: true,
              overallStatus: true,
            },
          },
        },
      },
      assignedActions: {
        where: {
          status: { in: ["OPEN", "IN_PROGRESS"] },
        },
      },
    },
  });

  return officers.map((officer) => {
    const redStores = officer.assignedStores.filter(
      (a) => a.store.overallStatus === "RED"
    ).length;
    const overdueActions = officer.assignedActions.filter(
      (a) => a.dueDate < new Date()
    ).length;

    return {
      id: officer.id,
      name: officer.name || officer.email,
      email: officer.email,
      role: officer.role,
      assignedStores: officer.assignedStores.length,
      redStores,
      openActions: officer.assignedActions.length,
      overdueActions,
    };
  });
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
  const trendData: Record<string, any> = {};

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
