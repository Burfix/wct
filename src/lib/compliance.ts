/**
 * V&A Waterfront Compliance Tracker
 * Status & Priority Scoring Library
 * 
 * This module provides the core business logic for:
 * - Determining compliance status (traffic-light system)
 * - Calculating priority scores for stores
 * - Risk assessment and ranking
 */

import { ComplianceStatus, StoreType, ComplianceCategory, ActionSeverity, ActionStatus } from "@prisma/client";

// ============================================================================
// TYPES
// ============================================================================

export interface ComplianceItemData {
  category: ComplianceCategory;
  required: boolean;
  hasEvidence: boolean;
  expiryDate: Date | null;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED" | null;
}

export interface StoreData {
  id: string;
  storeCode: string;
  name: string;
  zone: string;
  floor: string | null;
  storeType: StoreType;
  highFootTraffic: boolean;
  complianceItems: ComplianceItemData[];
  overdueActions: Array<{
    severity: ActionSeverity;
    status: ActionStatus;
    dueDate: Date;
  }>;
  recentRedCount?: number; // Reds in last 90 days
  repeatOffender?: boolean;
}

export interface PriorityContext {
  peakPeriods: Array<{ startDate: Date; endDate: Date }>;
  currentDate: Date;
  expiryThresholds: {
    orange: number; // days
  };
}

export interface PriorityResult {
  score: number;
  reasons: string[];
  breakdown: {
    redExpiry: number;
    overdueAction: number;
    fbWithFireIssues: number;
    repeatOffender: number;
    highTraffic: number;
    peakPeriod: number;
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export const DEFAULT_EXPIRY_THRESHOLD_DAYS = 30;

export const PRIORITY_WEIGHTS = {
  RED_EXPIRY_OR_MISSING: 50,
  OVERDUE_ACTION_BASE: 30,
  OVERDUE_ACTION_EXTENDED: 10, // additional if >7 days
  FB_WITH_FIRE_ISSUES: 25,
  REPEAT_OFFENDER: 20,
  HIGH_FOOT_TRAFFIC: 15,
  NEAR_PEAK_PERIOD: 10,
} as const;

export const COMPLIANCE_CATEGORIES_REQUIRING_EXPIRY: ComplianceCategory[] = [
  "OHS_RISK_ASSESSMENT",
  "EXTRACTION_CERT",
  "FIRE_SUPPRESSION_CERT",
  "FIRE_EQUIPMENT",
  "TRAINING",
  "FIRST_AID",
];

export const FB_CRITICAL_CATEGORIES: ComplianceCategory[] = [
  "EXTRACTION_CERT",
  "FIRE_SUPPRESSION_CERT",
];

// ============================================================================
// STATUS CALCULATION
// ============================================================================

/**
 * Calculate the status of a single compliance item based on evidence and expiry
 */
export function calculateItemStatus(
  item: ComplianceItemData,
  expiryThresholdDays: number = DEFAULT_EXPIRY_THRESHOLD_DAYS
): ComplianceStatus {
  // Not applicable
  if (!item.required) {
    return "GREY";
  }

  // Missing evidence
  if (!item.hasEvidence) {
    return "RED";
  }

  // Pending or rejected verification
  if (item.verificationStatus === "PENDING") {
    return "ORANGE"; // Awaiting verification
  }
  if (item.verificationStatus === "REJECTED") {
    return "RED";
  }

  // Check expiry for categories that require it
  if (COMPLIANCE_CATEGORIES_REQUIRING_EXPIRY.includes(item.category)) {
    if (!item.expiryDate) {
      return "RED"; // Required expiry date missing
    }

    const today = new Date();
    const expiryDate = new Date(item.expiryDate);
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) {
      return "RED"; // Expired
    }

    if (daysUntilExpiry <= expiryThresholdDays) {
      return "ORANGE"; // Expiring soon
    }
  }

  // All checks passed
  return "GREEN";
}

/**
 * Calculate overall store status (worst-of all compliance items)
 */
export function calculateStoreOverallStatus(
  complianceItems: ComplianceItemData[],
  expiryThresholdDays: number = DEFAULT_EXPIRY_THRESHOLD_DAYS
): ComplianceStatus {
  if (complianceItems.length === 0) {
    return "GREY";
  }

  const statusPriority: Record<ComplianceStatus, number> = {
    RED: 0,
    ORANGE: 1,
    GREEN: 2,
    GREY: 3,
  };

  let worstStatus: ComplianceStatus = "GREEN";

  for (const item of complianceItems) {
    const itemStatus = calculateItemStatus(item, expiryThresholdDays);
    if (statusPriority[itemStatus] < statusPriority[worstStatus]) {
      worstStatus = itemStatus;
    }
  }

  return worstStatus;
}

/**
 * Get days until expiry (negative if expired)
 */
export function getDaysUntilExpiry(expiryDate: Date): number {
  const today = new Date();
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get days overdue for an action
 */
export function getDaysOverdue(dueDate: Date): number {
  const today = new Date();
  const due = new Date(dueDate);
  const overdue = Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return overdue > 0 ? overdue : 0;
}

// ============================================================================
// PRIORITY SCORING
// ============================================================================

/**
 * Calculate priority score for a store based on weighted risk factors
 */
export function calculatePriorityScore(
  store: StoreData,
  context: PriorityContext
): PriorityResult {
  const { peakPeriods, currentDate, expiryThresholds } = context;
  const reasons: string[] = [];
  const breakdown = {
    redExpiry: 0,
    overdueAction: 0,
    fbWithFireIssues: 0,
    repeatOffender: 0,
    highTraffic: 0,
    peakPeriod: 0,
  };

  let score = 0;

  // 1. RED expiry or missing evidence
  const redItems = store.complianceItems.filter(
    (item) => calculateItemStatus(item, expiryThresholds.orange) === "RED"
  );
  if (redItems.length > 0) {
    breakdown.redExpiry = PRIORITY_WEIGHTS.RED_EXPIRY_OR_MISSING * redItems.length;
    score += breakdown.redExpiry;
    reasons.push(
      `${redItems.length} RED compliance item${redItems.length > 1 ? "s" : ""} (${redItems
        .map((i) => categoryLabel(i.category))
        .join(", ")})`
    );
  }

  // 2. Overdue corrective actions
  const overdueActions = store.overdueActions.filter((a) => {
    const overdue = getDaysOverdue(a.dueDate);
    return overdue > 0 && (a.status === "OPEN" || a.status === "IN_PROGRESS");
  });

  if (overdueActions.length > 0) {
    const extendedOverdue = overdueActions.filter(
      (a) => getDaysOverdue(a.dueDate) > 7
    ).length;
    breakdown.overdueAction =
      PRIORITY_WEIGHTS.OVERDUE_ACTION_BASE * overdueActions.length +
      PRIORITY_WEIGHTS.OVERDUE_ACTION_EXTENDED * extendedOverdue;
    score += breakdown.overdueAction;

    const maxOverdue = Math.max(...overdueActions.map((a) => getDaysOverdue(a.dueDate)));
    reasons.push(
      `${overdueActions.length} overdue action${overdueActions.length > 1 ? "s" : ""} (${maxOverdue} days)`
    );
  }

  // 3. F&B with fire/extraction issues
  if (store.storeType === "FB") {
    const fbCriticalIssues = store.complianceItems.filter(
      (item) =>
        FB_CRITICAL_CATEGORIES.includes(item.category) &&
        calculateItemStatus(item, expiryThresholds.orange) === "RED"
    );
    if (fbCriticalIssues.length > 0) {
      breakdown.fbWithFireIssues = PRIORITY_WEIGHTS.FB_WITH_FIRE_ISSUES;
      score += breakdown.fbWithFireIssues;
      reasons.push("F&B with fire suppression/extraction issues");
    }
  }

  // 4. Repeat offender
  if (store.repeatOffender || (store.recentRedCount && store.recentRedCount >= 2)) {
    breakdown.repeatOffender = PRIORITY_WEIGHTS.REPEAT_OFFENDER;
    score += breakdown.repeatOffender;
    reasons.push("Repeat offender (multiple compliance failures)");
  }

  // 5. High foot traffic zone
  if (store.highFootTraffic) {
    breakdown.highTraffic = PRIORITY_WEIGHTS.HIGH_FOOT_TRAFFIC;
    score += breakdown.highTraffic;
    reasons.push("High foot traffic zone");
  }

  // 6. Near peak period
  const inPeakPeriod = peakPeriods.some(
    (period) =>
      currentDate >= new Date(period.startDate) &&
      currentDate <= new Date(period.endDate)
  );
  if (inPeakPeriod) {
    breakdown.peakPeriod = PRIORITY_WEIGHTS.NEAR_PEAK_PERIOD;
    score += breakdown.peakPeriod;
    reasons.push("Currently in peak period");
  }

  return {
    score,
    reasons,
    breakdown,
  };
}

/**
 * Rank stores by priority score (descending)
 */
export function rankStoresByPriority(
  stores: StoreData[],
  context: PriorityContext
): Array<StoreData & { priorityScore: number; priorityReasons: string[] }> {
  return stores
    .map((store) => {
      const priority = calculatePriorityScore(store, context);
      return {
        ...store,
        priorityScore: priority.score,
        priorityReasons: priority.reasons,
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get human-readable label for compliance category
 */
export function categoryLabel(category: ComplianceCategory): string {
  const labels: Record<ComplianceCategory, string> = {
    OHS_RISK_ASSESSMENT: "OHS Risk Assessment",
    EXTRACTION_CERT: "Extraction Certification",
    FIRE_SUPPRESSION_CERT: "Fire Suppression Certification",
    FIRE_EQUIPMENT: "Fire Equipment",
    TRAINING: "Training",
    FIRST_AID: "First Aid",
    SHOP_AUDIT: "Shop Audit",
  };
  return labels[category] || category;
}

/**
 * Get status badge color class (for UI)
 */
export function getStatusColor(status: ComplianceStatus): string {
  const colors: Record<ComplianceStatus, string> = {
    GREEN: "bg-green-500",
    ORANGE: "bg-orange-500",
    RED: "bg-red-500",
    GREY: "bg-gray-400",
  };
  return colors[status];
}

/**
 * Get severity badge color class (for UI)
 */
export function getSeverityColor(severity: ActionSeverity): string {
  const colors: Record<ActionSeverity, string> = {
    LOW: "bg-blue-500",
    MEDIUM: "bg-yellow-500",
    HIGH: "bg-orange-500",
    CRITICAL: "bg-red-600",
  };
  return colors[severity];
}

/**
 * Check if a compliance category is required for a store type
 */
export function isCategoryRequiredForStoreType(
  category: ComplianceCategory,
  storeType: StoreType
): boolean {
  // F&B specific requirements
  if (storeType === "FB") {
    return true; // All categories apply to F&B
  }

  // Shop audits don't require extraction/suppression certs
  if (
    category === "EXTRACTION_CERT" ||
    category === "FIRE_SUPPRESSION_CERT"
  ) {
    return false;
  }

  // All other categories apply to all store types
  return true;
}

/**
 * Get expiry status text
 */
export function getExpiryStatusText(expiryDate: Date | null): string {
  if (!expiryDate) return "No expiry date";
  
  const days = getDaysUntilExpiry(expiryDate);
  
  if (days < 0) {
    return `Expired ${Math.abs(days)} days ago`;
  }
  if (days === 0) {
    return "Expires today";
  }
  if (days === 1) {
    return "Expires tomorrow";
  }
  if (days <= 7) {
    return `Expires in ${days} days`;
  }
  if (days <= 30) {
    return `Expires in ${days} days`;
  }
  
  return `Expires ${expiryDate.toLocaleDateString()}`;
}

/**
 * Get store type display name
 */
export function getStoreTypeLabel(storeType: StoreType): string {
  const labels: Record<StoreType, string> = {
    FB: "Food & Beverage",
    RETAIL: "Retail",
    SERVICES: "Services",
    LUXURY: "Luxury",
    ATTRACTION: "Attraction",
    POPUP: "Pop-up",
  };
  return labels[storeType] || storeType;
}
