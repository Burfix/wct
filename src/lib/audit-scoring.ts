/**
 * Restaurant Audit Scoring Engine
 * 
 * Calculates section scores and overall audit compliance percentage
 * Based on weighted scoring methodology:
 * - Fire & Emergency = weight 3
 * - General Condition = weight 2
 * - Electrical = weight 2
 * - Gas = weight 2
 * - General Comments = weight 1 (no scoring, just notes)
 * 
 * Formula per section:
 * Score = (YES count / (YES + NO count)) × 100
 * N/A responses are excluded from denominator
 */

import { AuditResult } from '@prisma/client';

export interface AuditResponseData {
  questionId: string;
  result: AuditResult;
  sectionId: string;
  sectionName: string;
  sectionWeight: number;
}

export interface SectionScore {
  sectionId: string;
  sectionName: string;
  score: number; // 0-100
  yes: number;
  no: number;
  na: number;
  total: number;
  weight: number;
  criticalFailures: number;
}

export interface AuditScoreResult {
  overallScore: number; // Weighted average 0-100
  sectionScores: SectionScore[];
  totalQuestions: number;
  answeredQuestions: number;
  completionPercentage: number;
  criticalFailures: number;
  hasCriticalFailure: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Calculate score for a single section
 */
export function calculateSectionScore(
  responses: AuditResponseData[],
  sectionId: string,
  criticalQuestionIds: string[] = []
): SectionScore {
  const sectionResponses = responses.filter((r) => r.sectionId === sectionId);

  if (sectionResponses.length === 0) {
    return {
      sectionId,
      sectionName: '',
      score: 0,
      yes: 0,
      no: 0,
      na: 0,
      total: 0,
      weight: 1,
      criticalFailures: 0,
    };
  }

  const yes = sectionResponses.filter((r) => r.result === 'YES').length;
  const no = sectionResponses.filter((r) => r.result === 'NO').length;
  const na = sectionResponses.filter((r) => r.result === 'NA').length;
  const total = yes + no + na;

  // Calculate critical failures in this section
  const criticalFailures = sectionResponses.filter(
    (r) => r.result === 'NO' && criticalQuestionIds.includes(r.questionId)
  ).length;

  // Score formula: YES / (YES + NO) × 100
  // Ignore N/A in denominator
  const denominator = yes + no;
  const score = denominator > 0 ? (yes / denominator) * 100 : 0;

  return {
    sectionId,
    sectionName: sectionResponses[0].sectionName,
    score: Math.round(score * 10) / 10, // Round to 1 decimal
    yes,
    no,
    na,
    total,
    weight: sectionResponses[0].sectionWeight,
    criticalFailures,
  };
}

/**
 * Calculate overall audit score with weighted average
 */
export function calculateAuditScore(
  responses: AuditResponseData[],
  criticalQuestionIds: string[] = []
): AuditScoreResult {
  // Get unique sections
  const sectionIds = Array.from(new Set(responses.map((r) => r.sectionId)));

  // Calculate score for each section
  const sectionScores = sectionIds.map((sectionId) =>
    calculateSectionScore(responses, sectionId, criticalQuestionIds)
  );

  // Filter out sections with no responses (e.g., General Comments section)
  const scorableSections = sectionScores.filter((s) => s.yes + s.no > 0);

  // Calculate weighted average
  let weightedSum = 0;
  let totalWeight = 0;

  for (const section of scorableSections) {
    weightedSum += section.score * section.weight;
    totalWeight += section.weight;
  }

  const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // Calculate totals
  const totalQuestions = sectionScores.reduce((sum, s) => sum + s.total, 0);
  const answeredQuestions = responses.length;
  const completionPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  // Count critical failures across all sections
  const criticalFailures = sectionScores.reduce((sum, s) => sum + s.criticalFailures, 0);
  const hasCriticalFailure = criticalFailures > 0;

  // Determine risk level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  
  if (hasCriticalFailure) {
    riskLevel = 'CRITICAL';
  } else if (overallScore < 60) {
    riskLevel = 'HIGH';
  } else if (overallScore < 80) {
    riskLevel = 'MEDIUM';
  }

  return {
    overallScore: Math.round(overallScore * 10) / 10,
    sectionScores,
    totalQuestions,
    answeredQuestions,
    completionPercentage: Math.round(completionPercentage * 10) / 10,
    criticalFailures,
    hasCriticalFailure,
    riskLevel,
  };
}

/**
 * Get risk level color for UI
 */
export function getRiskColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'CRITICAL':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'HIGH':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'MEDIUM':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'LOW':
      return 'text-green-600 bg-green-50 border-green-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

/**
 * Get score badge color for UI
 */
export function getScoreBadgeColor(score: number): string {
  if (score >= 90) return 'bg-green-500 text-white';
  if (score >= 80) return 'bg-green-400 text-white';
  if (score >= 70) return 'bg-yellow-500 text-white';
  if (score >= 60) return 'bg-orange-500 text-white';
  return 'bg-red-500 text-white';
}

/**
 * Calculate due date for corrective action based on severity
 */
export function calculateDueDate(severity: string): Date {
  const now = new Date();
  
  switch (severity) {
    case 'CRITICAL':
      return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
    case 'HIGH':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    case 'MEDIUM':
      return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days
    case 'LOW':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    default:
      return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // Default 14 days
  }
}

/**
 * Format score for display
 */
export function formatScore(score: number): string {
  return `${score.toFixed(1)}%`;
}

/**
 * Check if audit requires escalation
 */
export function requiresEscalation(scoreResult: AuditScoreResult): boolean {
  return scoreResult.hasCriticalFailure || scoreResult.overallScore < 60;
}

/**
 * Generate audit summary text
 */
export function generateAuditSummary(scoreResult: AuditScoreResult): string {
  const criticalText = scoreResult.hasCriticalFailure
    ? ` with ${scoreResult.criticalFailures} critical failure(s)`
    : '';

  if (scoreResult.riskLevel === 'CRITICAL') {
    return `Critical compliance issues identified${criticalText}. Immediate action required.`;
  }

  if (scoreResult.riskLevel === 'HIGH') {
    return `Compliance score below acceptable threshold (${formatScore(scoreResult.overallScore)}). Corrective actions required.`;
  }

  if (scoreResult.riskLevel === 'MEDIUM') {
    return `Some compliance issues noted (${formatScore(scoreResult.overallScore)}). Recommended improvements required.`;
  }

  return `Good compliance standing (${formatScore(scoreResult.overallScore)}). Continue monitoring.`;
}
