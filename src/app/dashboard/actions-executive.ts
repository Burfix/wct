"use server";

import { prisma } from "@/lib/db";

/**
 * Executive Risk Radar - Top 3 zones with drilldown drivers
 * Week 2 deliverable: Make it executive-friendly
 */
export async function getExecutiveRiskRadar() {
  const now = new Date();
  const next72Hours = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  // Get top 3 zones by risk with detailed drilldown metrics
  const topZones = await prisma.$queryRaw<Array<{
    zone: string;
    totalStores: bigint;
    redStores: bigint;
    restaurantCriticals: bigint;
    highFootfallReds: bigint;
    expiringIn72h: bigint;
    overdueCriticalActions: bigint;
    riskScore: bigint;
  }>>`
    SELECT 
      s.zone,
      COUNT(DISTINCT s.id) as "totalStores",
      COUNT(DISTINCT CASE WHEN s."overallStatus" = 'RED' THEN s.id END) as "redStores",
      
      -- Restaurant Criticals (RED items in Food & Beverage stores)
      COUNT(DISTINCT CASE 
        WHEN ci.status = 'RED' AND s."storeType" = 'FB' 
        THEN ci.id 
      END) as "restaurantCriticals",
      
      -- High-footfall Reds (RED items in high traffic stores)
      COUNT(DISTINCT CASE 
        WHEN ci.status = 'RED' AND s."highFootTraffic" = true 
        THEN ci.id 
      END) as "highFootfallReds",
      
      -- Next 72 hours risk (items expiring soon)
      COUNT(DISTINCT CASE 
        WHEN ci."expiryDate" IS NOT NULL 
        AND ci."expiryDate" BETWEEN ${now} AND ${next72Hours}
        AND ci.status IN ('RED', 'ORANGE')
        THEN ci.id 
      END) as "expiringIn72h",
      
      -- Overdue critical actions
      COUNT(DISTINCT CASE 
        WHEN ca.severity = 'CRITICAL' 
        AND ca.status IN ('OPEN', 'IN_PROGRESS')
        AND ca."dueDate" < ${now}
        THEN ca.id 
      END) as "overdueCriticalActions",
      
      -- Overall risk score for sorting
      (
        COUNT(DISTINCT CASE WHEN s."overallStatus" = 'RED' THEN s.id END) * 100 +
        COUNT(DISTINCT CASE WHEN ci.status = 'RED' AND s."storeType" = 'FB' THEN ci.id END) * 50 +
        COUNT(DISTINCT CASE WHEN ci.status = 'RED' AND s."highFootTraffic" = true THEN ci.id END) * 40 +
        COUNT(DISTINCT CASE WHEN ca.severity = 'CRITICAL' AND ca.status IN ('OPEN', 'IN_PROGRESS') AND ca."dueDate" < ${now} THEN ca.id END) * 30 +
        COUNT(DISTINCT CASE WHEN ci."expiryDate" BETWEEN ${now} AND ${next72Hours} AND ci.status IN ('RED', 'ORANGE') THEN ci.id END) * 20
      ) as "riskScore"
      
    FROM stores s
    LEFT JOIN "ComplianceItem" ci ON ci."storeId" = s.id
    LEFT JOIN "CorrectiveAction" ca ON ca."storeId" = s.id
    WHERE s.status = 'active'
    GROUP BY s.zone
    ORDER BY "riskScore" DESC
    LIMIT 3
  `;

  return topZones.map((zone: { zone: string; totalStores: bigint; redStores: bigint; restaurantCriticals: bigint; highFootfallReds: bigint; expiringIn72h: bigint; overdueCriticalActions: bigint; riskScore: bigint }) => ({
    zone: zone.zone,
    totalStores: Number(zone.totalStores),
    redStores: Number(zone.redStores),
    drilldown: {
      restaurantCriticals: Number(zone.restaurantCriticals),
      highFootfallReds: Number(zone.highFootfallReds),
      expiringIn72h: Number(zone.expiringIn72h),
      overdueCriticalActions: Number(zone.overdueCriticalActions),
    },
    riskScore: Number(zone.riskScore),
  }));
}

/**
 * Executive Summary Stats - High-level KPIs for C-suite
 */
export async function getExecutiveSummary() {
  const now = new Date();
  const next72Hours = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  const summary = await prisma.$queryRaw<Array<{
    totalStores: bigint;
    redStores: bigint;
    orangeStores: bigint;
    totalCriticalReds: bigint;
    overdueCriticalActions: bigint;
    criticalItemsExpiringToday: bigint;
    highRiskZones: bigint;
  }>>`
    SELECT 
      COUNT(DISTINCT s.id) as "totalStores",
      COUNT(DISTINCT CASE WHEN s."overallStatus" = 'RED' THEN s.id END) as "redStores",
      COUNT(DISTINCT CASE WHEN s."overallStatus" = 'ORANGE' THEN s.id END) as "orangeStores",
      
      COUNT(DISTINCT CASE WHEN ci.status = 'RED' AND ci.severity = 'CRITICAL' THEN ci.id END) as "totalCriticalReds",
      
      COUNT(DISTINCT CASE 
        WHEN ca.severity = 'CRITICAL' 
        AND ca.status IN ('OPEN', 'IN_PROGRESS')
        AND ca."dueDate" < ${now}
        THEN ca.id 
      END) as "overdueCriticalActions",
      
      COUNT(DISTINCT CASE 
        WHEN ci."expiryDate" BETWEEN ${now} AND ${next72Hours}
        AND ci.status = 'RED'
        THEN ci.id 
      END) as "criticalItemsExpiringToday",
      
      COUNT(DISTINCT CASE WHEN s."overallStatus" = 'RED' THEN s.zone END) as "highRiskZones"
      
    FROM stores s
    LEFT JOIN "ComplianceItem" ci ON ci."storeId" = s.id
    LEFT JOIN "CorrectiveAction" ca ON ca."storeId" = s.id
    WHERE s.status = 'active'
  `;

  const data = summary[0];
  
  return {
    totalStores: Number(data.totalStores),
    redStores: Number(data.redStores),
    orangeStores: Number(data.orangeStores),
    totalCriticalReds: Number(data.totalCriticalReds),
    overdueCriticalActions: Number(data.overdueCriticalActions),
    criticalItemsExpiringToday: Number(data.criticalItemsExpiringToday),
    highRiskZones: Number(data.highRiskZones),
    complianceRate: Math.round((1 - Number(data.redStores) / Number(data.totalStores)) * 100),
  };
}

/**
 * Get drilldown details for a specific zone (for modal/expansion)
 */
export async function getZoneDrilldown(zone: string) {
  const now = new Date();
  const next72Hours = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  // Restaurant Criticals
  const restaurantCriticals = await prisma.$queryRaw<Array<{
    storeCode: string;
    storeName: string;
    itemTitle: string;
    category: string;
    expiryDate: Date | null;
  }>>`
    SELECT 
      s."storeCode",
      s.name as "storeName",
      ci.title as "itemTitle",
      ci.category,
      ci."expiryDate"
    FROM "ComplianceItem" ci
    INNER JOIN stores s ON s.id = ci."storeId"
    WHERE s.zone = ${zone}
      AND s."storeType" = 'FB'
      AND ci.status = 'RED'
      AND s.status = 'active'
    ORDER BY ci."expiryDate" ASC NULLS LAST
    LIMIT 10
  `;

  // High-footfall Reds
  const highFootfallReds = await prisma.$queryRaw<Array<{
    storeCode: string;
    storeName: string;
    itemTitle: string;
    category: string;
  }>>`
    SELECT 
      s."storeCode",
      s.name as "storeName",
      ci.title as "itemTitle",
      ci.category
    FROM "ComplianceItem" ci
    INNER JOIN stores s ON s.id = ci."storeId"
    WHERE s.zone = ${zone}
      AND s."highFootTraffic" = true
      AND ci.status = 'RED'
      AND s.status = 'active'
    ORDER BY s."highFootTraffic" DESC, s.name ASC
    LIMIT 10
  `;

  // Expiring in 72h
  const expiringIn72h = await prisma.$queryRaw<Array<{
    storeCode: string;
    storeName: string;
    itemTitle: string;
    expiryDate: Date;
    hoursUntilExpiry: number;
  }>>`
    SELECT 
      s."storeCode",
      s.name as "storeName",
      ci.title as "itemTitle",
      ci."expiryDate",
      EXTRACT(EPOCH FROM (ci."expiryDate" - ${now})) / 3600 as "hoursUntilExpiry"
    FROM "ComplianceItem" ci
    INNER JOIN stores s ON s.id = ci."storeId"
    WHERE s.zone = ${zone}
      AND ci."expiryDate" BETWEEN ${now} AND ${next72Hours}
      AND ci.status IN ('RED', 'ORANGE')
      AND s.status = 'active'
    ORDER BY ci."expiryDate" ASC
    LIMIT 10
  `;

  // Overdue Critical Actions
  const overdueCriticalActions = await prisma.$queryRaw<Array<{
    storeCode: string;
    storeName: string;
    actionTitle: string;
    dueDate: Date;
    assignedTo: string | null;
  }>>`
    SELECT 
      s."storeCode",
      s.name as "storeName",
      ca.title as "actionTitle",
      ca."dueDate",
      u.name as "assignedTo"
    FROM "CorrectiveAction" ca
    INNER JOIN stores s ON s.id = ca."storeId"
    LEFT JOIN users u ON u.id = ca."assignedToId"
    WHERE s.zone = ${zone}
      AND ca.severity = 'CRITICAL'
      AND ca.status IN ('OPEN', 'IN_PROGRESS')
      AND ca."dueDate" < ${now}
      AND s.status = 'active'
    ORDER BY ca."dueDate" ASC
    LIMIT 10
  `;

  return {
    zone,
    restaurantCriticals: restaurantCriticals.map((item) => ({
      ...item,
      expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
    })),
    highFootfallReds,
    expiringIn72h: expiringIn72h.map((item) => ({
      ...item,
      expiryDate: new Date(item.expiryDate),
      hoursUntilExpiry: Math.round(Number(item.hoursUntilExpiry)),
    })),
    overdueCriticalActions: overdueCriticalActions.map((action) => ({
      ...action,
      dueDate: new Date(action.dueDate),
    })),
  };
}
