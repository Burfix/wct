import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { createAudit, getAuditTemplates } from '../actions';
import { prisma } from '@/lib/db';
import AuditForm from '@/components/audit-form';

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
    const existingResponses = audit.responses.reduce((acc, r) => {
      acc[r.questionId] = {
        questionId: r.questionId,
        result: r.result,
        notes: r.notes || '',
        severity: r.severity,
        photos: [], // Photos already uploaded
      };
      return acc;
    }, {} as any);

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
    return <div>Store not found</div>;
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
    return <div>Template not found</div>;
  }

  // Create audit draft
  const audit = await createAudit({ storeId, templateId });

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
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              Start Audit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
