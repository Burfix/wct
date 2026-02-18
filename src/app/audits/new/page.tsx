import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { createAudit, getAuditTemplates } from '../actions';
import { prisma } from '@/lib/db';
import AuditForm from '@/components/audit-form';
import type { AuditResult, ActionSeverity } from '@prisma/client';

export default async function NewAuditPage({
  searchParams,
}: {
  searchParams: { storeId?: string; templateId?: string; auditId?: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { storeId, templateId, auditId } = searchParams;

  // If auditId provided, load existing draft
  if (auditId) {
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        store: {
          select: {
            id: true,
            storeCode: true,
            name: true,
            zone: true,
          },
        },
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
        responses: {
          include: {
            photos: true,
          },
        },
      },
    });

    if (!audit) {
      redirect('/audits/new');
    }

    if (audit.status !== 'DRAFT') {
      redirect(`/audits/${audit.id}`);
    }

    // Map existing responses
    type ResponseShape = {
      questionId: string;
      result: AuditResult | null;
      notes: string;
      severity: ActionSeverity | null;
      photos: File[];
    };
    const existingResponses = audit.responses.reduce<Record<string, ResponseShape>>((acc, r) => {
      acc[r.questionId] = {
        questionId: r.questionId,
        result: r.result,
        notes: r.notes || '',
        severity: r.severity,
        photos: [],
      };
      return acc;
    }, {});

    return (
      <AuditForm
        store={audit.store}
        template={audit.template}
        auditId={audit.id}
        existingResponses={existingResponses}
      />
    );
  }

  // Create new audit
  if (!storeId || !templateId) {
    return <SelectAuditForm />;
  }

  // Get store
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: {
      id: true,
      storeCode: true,
      name: true,
      zone: true,
    },
  });

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-bold text-red-900 mb-2">Store Not Found</h1>
            <p className="text-red-700">Store ID: {storeId}</p>
            <Link href="/audits/new" className="mt-4 inline-block text-blue-600 hover:underline">
              ← Back to selection
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get template
  const template = await prisma.auditTemplate.findUnique({
    where: { id: templateId },
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

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-bold text-red-900 mb-2">Template Not Found</h1>
            <p className="text-red-700">Template ID: {templateId}</p>
            <Link href="/audits/new" className="mt-4 inline-block text-blue-600 hover:underline">
              ← Back to selection
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Create audit draft
  let audit;
  try {
    audit = await createAudit({ storeId, templateId });
  } catch (error) {
    console.error('Failed to create audit:', error);
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-bold text-red-900 mb-2">Failed to Create Audit</h1>
            <p className="text-red-700">
              {error instanceof Error ? error.message : 'Unknown error occurred'}
            </p>
            <Link href="/audits/new" className="mt-4 inline-block text-blue-600 hover:underline">
              ← Try again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuditForm
      store={store}
      template={template}
      auditId={audit.id}
    />
  );
}

async function SelectAuditForm() {
  const templates = await getAuditTemplates();
  const stores = await prisma.store.findMany({
    where: {
      status: 'active',
      storeType: 'FB', // Only restaurants
    },
    select: {
      id: true,
      storeCode: true,
      name: true,
      zone: true,
    },
    orderBy: { storeCode: 'asc' },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-6">Start New Audit</h1>

          {templates.length === 0 && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
              <p className="font-semibold text-yellow-900">No audit templates available</p>
              <p className="text-yellow-700 mt-1">
                The database has no active audit templates yet.{' '}
                <Link href="/demo" className="underline font-medium hover:text-yellow-900">
                  Visit /demo to auto-seed demo data →
                </Link>
              </p>
            </div>
          )}

          {stores.length === 0 && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
              <p className="font-semibold text-yellow-900">No Food &amp; Beverage stores found</p>
              <p className="text-yellow-700 mt-1">
                Stores of type &ldquo;FB&rdquo; must exist in the database before you can start an audit.{' '}
                <Link href="/demo" className="underline font-medium hover:text-yellow-900">
                  Visit /demo to auto-seed demo data →
                </Link>
              </p>
            </div>
          )}

          <form method="GET" className="space-y-6">
            <div>
              <label htmlFor="storeId" className="block text-sm font-medium text-gray-700 mb-2">
                Select Store
              </label>
              <select
                id="storeId"
                name="storeId"
                required
                className="w-full px-4 py-3 border rounded-lg"
              >
                <option value="">Choose a store...</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.storeCode} - {store.name} ({store.zone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="templateId" className="block text-sm font-medium text-gray-700 mb-2">
                Select Audit Template
              </label>
              <select
                id="templateId"
                name="templateId"
                required
                className="w-full px-4 py-3 border rounded-lg"
              >
                <option value="">Choose a template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={templates.length === 0 || stores.length === 0}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Audit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
