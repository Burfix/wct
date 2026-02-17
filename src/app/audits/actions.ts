'use server';

/**
 * Server Actions for Restaurant Audit Module
 * Handles audit creation, response submission, scoring, and corrective action generation
 */

import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import {
  calculateAuditScore,
  calculateDueDate,
  type AuditResponseData,
} from '@/lib/audit-scoring';
import { ActionSeverity, AuditResult, AuditStatus, ComplianceCategory } from '@prisma/client';

interface CreateAuditInput {
  storeId: string;
  templateId: string;
}

interface SaveResponseInput {
  auditId: string;
  questionId: string;
  result: AuditResult;
  notes?: string;
  severity?: ActionSeverity;
}

interface SubmitAuditInput {
  auditId: string;
  generalComments?: string;
  tenantAcknowledged?: boolean;
  tenantName?: string;
  tenantRole?: string;
  tenantContact?: string;
  officerSignatureUrl?: string;
  geoLat?: number;
  geoLng?: number;
  geoAccuracyMeters?: number;
  geoStatus?: 'CAPTURED' | 'DENIED' | 'UNAVAILABLE';
}

/**
 * Create a new audit draft
 */
export async function createAudit(input: CreateAuditInput) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Verify template exists and is active
  const template = await prisma.auditTemplate.findUnique({
    where: { id: input.templateId },
    include: {
      sections: {
        include: {
          questions: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!template || !template.active) {
    throw new Error('Invalid or inactive audit template');
  }

  // Verify store exists
  const store = await prisma.store.findUnique({
    where: { id: input.storeId },
  });

  if (!store) {
    throw new Error('Store not found');
  }

  // Create audit
  const audit = await prisma.audit.create({
    data: {
      storeId: input.storeId,
      templateId: input.templateId,
      conductedById: session.user.id!,
      auditDate: new Date(),
      status: 'DRAFT',
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      storeId: input.storeId,
      userId: session.user.id!,
      action: 'AUDIT_CREATED',
      entity: 'Audit',
      entityId: audit.id,
      details: JSON.stringify({ templateId: input.templateId }),
    },
  });

  revalidatePath('/audits');
  revalidatePath(`/stores/${input.storeId}`);

  return audit;
}

/**
 * Save/update a single audit response
 * Auto-creates corrective action if result = NO
 */
export async function saveAuditResponse(input: SaveResponseInput) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Verify audit exists and is in DRAFT status
  const audit = await prisma.audit.findUnique({
    where: { id: input.auditId },
    include: {
      store: true,
    },
  });

  if (!audit) {
    throw new Error('Audit not found');
  }

  if (audit.status !== 'DRAFT') {
    throw new Error('Cannot modify submitted audit');
  }

  // Verify question exists
  const question = await prisma.auditQuestion.findUnique({
    where: { id: input.questionId },
    include: {
      section: true,
    },
  });

  if (!question) {
    throw new Error('Question not found');
  }

  // Validate: if result = NO, notes and severity are required
  if (input.result === 'NO') {
    if (!input.notes || !input.severity) {
      throw new Error('Notes and severity are required for non-compliant items');
    }
  }

  // Create or update response
  const response = await prisma.auditResponse.upsert({
    where: {
      auditId_questionId: {
        auditId: input.auditId,
        questionId: input.questionId,
      },
    },
    create: {
      auditId: input.auditId,
      questionId: input.questionId,
      result: input.result,
      notes: input.notes,
      severity: input.severity,
    },
    update: {
      result: input.result,
      notes: input.notes,
      severity: input.severity,
    },
  });

  // Auto-create corrective action if result = NO and not already created
  if (input.result === 'NO' && !response.createdActionId && input.severity) {
    const dueDate = calculateDueDate(input.severity);

    const action = await prisma.correctiveAction.create({
      data: {
        storeId: audit.storeId,
        auditId: input.auditId,
        title: `${question.section.name}: ${question.question}`,
        description: input.notes || 'Non-compliance identified during audit',
        severity: input.severity,
        category: getCategoryFromSection(question.section.name),
        status: 'OPEN',
        dueDate,
        createdById: session.user.id!,
        assignedToId: session.user.id!, // Default assign to conducting officer
      },
    });

    // Link action to response
    await prisma.auditResponse.update({
      where: { id: response.id },
      data: { createdActionId: action.id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        storeId: audit.storeId,
        userId: session.user.id!,
        action: 'CORRECTIVE_ACTION_CREATED',
        entity: 'CorrectiveAction',
        entityId: action.id,
        details: JSON.stringify({
          auditId: input.auditId,
          questionId: input.questionId,
          severity: input.severity,
        }),
      },
    });
  }

  // Update audit timestamp
  await prisma.audit.update({
    where: { id: input.auditId },
    data: { updatedAt: new Date(), lastSyncedAt: new Date() },
  });

  return response;
}

/**
 * Submit audit (lock and calculate final scores)
 */
export async function submitAudit(input: SubmitAuditInput) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Get audit with all responses
  const audit = await prisma.audit.findUnique({
    where: { id: input.auditId },
    include: {
      responses: {
        include: {
          question: {
            include: {
              section: true,
            },
          },
        },
      },
      template: {
        include: {
          sections: {
            include: {
              questions: true,
            },
          },
        },
      },
      store: true,
    },
  });

  if (!audit) {
    throw new Error('Audit not found');
  }

  if (audit.status !== 'DRAFT') {
    throw new Error('Audit already submitted');
  }

  // Map responses to scoring format
  const responseData: AuditResponseData[] = audit.responses.map((r) => ({
    questionId: r.questionId,
    result: r.result,
    sectionId: r.question.sectionId,
    sectionName: r.question.section.name,
    sectionWeight: r.question.section.weight,
  }));

  // Get critical question IDs
  const criticalQuestionIds = audit.template.sections
    .flatMap((s) => s.questions)
    .filter((q) => q.critical)
    .map((q) => q.id);

  // Calculate scores
  const scoreResult = calculateAuditScore(responseData, criticalQuestionIds);

  // Update audit with scores and metadata
  const updatedAudit = await prisma.audit.update({
    where: { id: input.auditId },
    data: {
      status: 'SUBMITTED',
      overallScore: scoreResult.overallScore,
      sectionScores: JSON.parse(JSON.stringify(scoreResult.sectionScores)) as any,
      generalComments: input.generalComments,
      tenantAcknowledged: input.tenantAcknowledged || false,
      tenantName: input.tenantName,
      tenantRole: input.tenantRole,
      tenantContact: input.tenantContact,
      officerSignatureUrl: input.officerSignatureUrl,
      officerSignedAt: input.officerSignatureUrl ? new Date() : null,
      geoProofCaptured: !!input.geoLat,
      geoLat: input.geoLat,
      geoLng: input.geoLng,
      geoAccuracyMeters: input.geoAccuracyMeters,
      geoStatus: input.geoStatus,
      completedAt: new Date(),
    },
  });

  // Create tenant acknowledgement record if provided
  if (input.tenantAcknowledged) {
    await prisma.auditAcknowledgement.create({
      data: {
        auditId: input.auditId,
        acknowledged: true,
        name: input.tenantName,
        role: input.tenantRole,
        contact: input.tenantContact,
      },
    });
  }

  // Update store metadata
  const updateData: any = {
    lastAuditDate: new Date(),
  };

  // Flag store if critical failures or low score
  if (scoreResult.hasCriticalFailure || scoreResult.overallScore < 60) {
    updateData.overallStatus = 'RED';
    updateData.priorityScore = Math.max(audit.store.priorityScore || 0, 80);
  } else if (scoreResult.overallScore < 80) {
    updateData.overallStatus = 'ORANGE';
    updateData.priorityScore = Math.max(audit.store.priorityScore || 0, 50);
  } else {
    updateData.overallStatus = 'GREEN';
    updateData.priorityScore = Math.max(audit.store.priorityScore || 0, 20);
  }

  await prisma.store.update({
    where: { id: audit.storeId },
    data: updateData,
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      storeId: audit.storeId,
      userId: session.user.id!,
      action: 'AUDIT_SUBMITTED',
      entity: 'Audit',
      entityId: input.auditId,
      details: JSON.stringify({
        overallScore: scoreResult.overallScore,
        criticalFailures: scoreResult.criticalFailures,
        riskLevel: scoreResult.riskLevel,
      }),
    },
  });

  revalidatePath('/audits');
  revalidatePath(`/audits/${input.auditId}`);
  revalidatePath(`/stores/${audit.storeId}`);
  revalidatePath('/dashboard');

  return updatedAudit;
}

/**
 * Get audit with all data for display/edit
 */
export async function getAudit(auditId: string) {
  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
    include: {
      store: true,
      template: {
        include: {
          sections: {
            include: {
              questions: {
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      },
      conductedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      responses: {
        include: {
          question: {
            include: {
              section: true,
            },
          },
          photos: true,
        },
      },
      actions: {
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      signatures: true,
      acknowledgement: true,
    },
  });

  return audit;
}

/**
 * Helper: map section name to compliance category
 */
function getCategoryFromSection(sectionName: string): ComplianceCategory {
  const normalized = sectionName.toLowerCase();

  if (normalized.includes('fire') || normalized.includes('emergency')) {
    return 'FIRE_SUPPRESSION_CERT';
  }
  if (normalized.includes('electrical')) {
    return 'FIRE_EQUIPMENT';
  }
  if (normalized.includes('gas')) {
    return 'FIRE_EQUIPMENT';
  }
  if (normalized.includes('first aid')) {
    return 'FIRST_AID';
  }

  return 'SHOP_AUDIT';
}

/**
 * Get all templates for selection
 */
export async function getAuditTemplates() {
  const templates = await prisma.auditTemplate.findMany({
    where: { active: true },
    include: {
      sections: {
        include: {
          _count: {
            select: { questions: true },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return templates;
}

/**
 * Verify audit (Manager signature)
 */
export async function verifyAudit(auditId: string, managerSignatureUrl: string) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Only managers can verify audits');
  }

  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
  });

  if (!audit) {
    throw new Error('Audit not found');
  }

  if (audit.status !== 'SUBMITTED' && audit.status !== 'COMPLETE') {
    throw new Error('Audit must be submitted before verification');
  }

  await prisma.audit.update({
    where: { id: auditId },
    data: {
      status: 'VERIFIED',
      managerSignatureUrl,
      managerSignedAt: new Date(),
      managerVerifiedById: session.user.id!,
      managerVerifiedAt: new Date(),
    },
  });

  await prisma.auditSignature.create({
    data: {
      auditId,
      signedById: session.user.id!,
      role: 'MANAGER',
      signatureUrl: managerSignatureUrl,
    },
  });

  await prisma.activityLog.create({
    data: {
      storeId: audit.storeId,
      userId: session.user.id!,
      action: 'AUDIT_VERIFIED',
      entity: 'Audit',
      entityId: auditId,
    },
  });

  revalidatePath(`/audits/${auditId}`);
  revalidatePath('/audits');

  return { success: true };
}

/**
 * Reject audit (Manager)
 */
export async function rejectAudit(auditId: string, reason: string) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Only managers can reject audits');
  }

  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
  });

  if (!audit) {
    throw new Error('Audit not found');
  }

  await prisma.audit.update({
    where: { id: auditId },
    data: {
      status: 'REJECTED',
      rejectionReason: reason,
      managerVerifiedById: session.user.id!,
      managerVerifiedAt: new Date(),
    },
  });

  await prisma.activityLog.create({
    data: {
      storeId: audit.storeId,
      userId: session.user.id!,
      action: 'AUDIT_REJECTED',
      entity: 'Audit',
      entityId: auditId,
      details: JSON.stringify({ reason }),
    },
  });

  revalidatePath(`/audits/${auditId}`);
  revalidatePath('/audits');

  return { success: true };
}
