import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ensureManagerSession, createDemoDraftAudit } from './actions';

// ---------------------------------------------------------------------------
// Guard: /demo is only available in development OR when DEMO_MODE=true
// ---------------------------------------------------------------------------
function isDemoAllowed(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.DEMO_MODE === 'true';
}

export default async function DemoPage() {
  if (!isDemoAllowed()) {
    notFound();
  }

  const sessionState = await ensureManagerSession();
  const seedCounts = await prisma_counts();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Demo Quickstart</h1>
          <p className="mt-2 text-gray-500">V&amp;A Waterfront Compliance Tracker</p>
        </div>

        {/* Session status */}
        <div
          className={`rounded-lg border p-4 text-sm ${
            sessionState.ok
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}
        >
          {sessionState.ok ? (
            <span>
              ✅ Signed in as <strong>{sessionState.name ?? 'Manager'}</strong> (ADMIN)
            </span>
          ) : (
            <span>
              ⚠️ {sessionState.message}
              <Link
                href="/login"
                className="ml-2 underline font-medium hover:text-yellow-900"
              >
                Go to login →
              </Link>
            </span>
          )}
        </div>

        {/* Seed status */}
        <div className="rounded-lg border bg-white p-4 text-sm text-gray-600 space-y-1">
          <p className="font-medium text-gray-800">Database seed status</p>
          <p>Active templates: <strong>{seedCounts.templates}</strong></p>
          <p>Active FB stores: <strong>{seedCounts.fbStores}</strong></p>
          {(seedCounts.templates === 0 || seedCounts.fbStores < 2) && (
            <p className="text-orange-600 mt-1">
              ⚠️ Clicking &ldquo;Start Audit&rdquo; will auto-create missing demo data.
            </p>
          )}
        </div>

        {/* Button A — Manager Dashboard */}
        <form
          action={async () => {
            'use server';
            redirect('/dashboard');
          }}
        >
          <button
            type="submit"
            disabled={!sessionState.ok}
            className="w-full py-4 text-lg font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shadow transition-colors"
          >
            📊 Manager Dashboard (Demo)
          </button>
        </form>

        {/* Button B — Start Audit */}
        <form action={createDemoDraftAudit}>
          <button
            type="submit"
            disabled={!sessionState.ok}
            className="w-full py-4 text-lg font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow transition-colors"
          >
            📋 Start Audit (Demo)
          </button>
        </form>

        {!sessionState.ok && (
          <p className="text-center text-sm text-gray-400">
            Both buttons require you to be signed in as an ADMIN.
          </p>
        )}

        {/* Footer links */}
        <div className="text-center text-sm text-gray-400 space-x-4">
          <Link href="/" className="hover:text-gray-600">
            Home
          </Link>
          <Link href="/audits" className="hover:text-gray-600">
            All Audits
          </Link>
          <Link href="/stores" className="hover:text-gray-600">
            Stores
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper — read seed counts without importing prisma directly in JSX scope
// ---------------------------------------------------------------------------
import { prisma } from '@/lib/db';

async function prisma_counts() {
  const [templates, fbStores] = await Promise.all([
    prisma.auditTemplate.count({ where: { active: true } }),
    prisma.store.count({ where: { storeType: 'FB', status: 'active' } }),
  ]);
  return { templates, fbStores };
}
