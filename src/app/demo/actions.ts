'use server';

import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { StoreType } from '@prisma/client';

// ---------------------------------------------------------------------------
// ensureDemoSeed
// Creates the minimum data needed to run an audit:
//   - 1 active AuditTemplate (if none exists)
//   - 2 FB stores (if fewer than 2 exist)
// Safe to call multiple times — all operations are idempotent.
// ---------------------------------------------------------------------------
export async function ensureDemoSeed(): Promise<{
  templatesCreated: number;
  storesCreated: number;
}> {
  let templatesCreated = 0;
  let storesCreated = 0;

  // --- Template ---
  const templateCount = await prisma.auditTemplate.count({ where: { active: true } });
  if (templateCount === 0) {
    await prisma.auditTemplate.create({
      data: {
        name: 'Restaurant Compliance Audit (Demo)',
        description: 'Minimal demo template — replace with the full production template.',
        storeTypes: [StoreType.FB],
        active: true,
        sections: {
          create: [
            {
              name: 'Food Safety',
              description: 'Basic food safety compliance checks.',
              weight: 2,
              order: 1,
              questions: {
                create: [
                  {
                    question: 'Food storage temperatures within safe range?',
                    critical: true,
                    order: 1,
                  },
                  {
                    question: 'Hand-washing facilities accessible and stocked?',
                    critical: true,
                    order: 2,
                  },
                  {
                    question: 'Food handling staff wearing appropriate PPE?',
                    critical: false,
                    order: 3,
                  },
                ],
              },
            },
            {
              name: 'Fire & Safety',
              description: 'Fire prevention and emergency readiness.',
              weight: 1,
              order: 2,
              questions: {
                create: [
                  {
                    question: 'Fire extinguishers present, serviced, and accessible?',
                    critical: true,
                    order: 1,
                  },
                  {
                    question: 'Emergency exits clearly marked and unobstructed?',
                    critical: true,
                    order: 2,
                  },
                ],
              },
            },
          ],
        },
      },
    });
    templatesCreated = 1;
  }

  // --- Stores ---
  const fbCount = await prisma.store.count({
    where: { storeType: StoreType.FB, status: 'active' },
  });

  if (fbCount < 2) {
    const toCreate = 2 - fbCount;
    const existingCodes = new Set(
      (await prisma.store.findMany({ select: { storeCode: true } })).map((s) => s.storeCode)
    );

    const demoCandidates = [
      { storeCode: 'DEMO-FB-001', name: 'Demo Café (Waterfront)', zone: 'V&A Waterfront' },
      { storeCode: 'DEMO-FB-002', name: 'Demo Restaurant (Quay)', zone: 'V&A Waterfront' },
      { storeCode: 'DEMO-FB-003', name: 'Demo Bistro (Marina)', zone: 'V&A Waterfront' },
    ];

    let created = 0;
    for (const candidate of demoCandidates) {
      if (created >= toCreate) break;
      if (existingCodes.has(candidate.storeCode)) continue;

      await prisma.store.create({
        data: {
          storeCode: candidate.storeCode,
          name: candidate.name,
          zone: candidate.zone,
          storeType: StoreType.FB,
          status: 'active',
          highFootTraffic: false,
          tradingHours: '08:00 - 22:00',
        },
      });
      created++;
    }
    storesCreated = created;
  }

  return { templatesCreated, storesCreated };
}

// ---------------------------------------------------------------------------
// ensureManagerSession
// Returns the session state; does NOT attempt auto-login (requires client).
// ---------------------------------------------------------------------------
export async function ensureManagerSession(): Promise<
  | { ok: true; userId: string; name: string | null }
  | { ok: false; message: string }
> {
  const session = await auth();

  if (!session?.user) {
    return {
      ok: false,
      message:
        'Not logged in. Please sign in with manager@vawaterfront.co.za (password: Manager2024!) then return to /demo.',
    };
  }

  if (session.user.role !== 'ADMIN') {
    return {
      ok: false,
      message: `Signed in as ${session.user.email} (${session.user.role}), but the Manager Dashboard requires an ADMIN account. Please sign in with manager@vawaterfront.co.za.`,
    };
  }

  return { ok: true, userId: session.user.id!, name: session.user.name ?? null };
}

// ---------------------------------------------------------------------------
// createDemoDraftAudit
// Picks the first active template + first active FB store, creates a DRAFT
// audit for the current user, then redirects to /audits/new?auditId=...
// ---------------------------------------------------------------------------
export async function createDemoDraftAudit(): Promise<never> {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  // Ensure seed data exists (idempotent)
  await ensureDemoSeed();

  const template = await prisma.auditTemplate.findFirst({
    where: { active: true },
    orderBy: { createdAt: 'asc' },
  });

  const store = await prisma.store.findFirst({
    where: { storeType: StoreType.FB, status: 'active' },
    orderBy: { storeCode: 'asc' },
  });

  if (!template || !store) {
    // Should not happen after ensureDemoSeed, but just in case
    redirect('/audits/new');
  }

  const audit = await prisma.audit.create({
    data: {
      storeId: store.id,
      templateId: template.id,
      conductedById: session.user.id!,
      auditDate: new Date(),
      status: 'DRAFT',
    },
  });

  redirect(`/audits/new?auditId=${audit.id}`);
}
