import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * GET /api/admin/seed-status
 * Returns DB seeding state. Protected: ADMIN session or x-seed-secret header.
 */
export async function GET(req: NextRequest) {
  // Allow header-based access (same secret used by the seed route)
  const headerSecret = req.headers.get("x-seed-secret");
  const configuredSecret = process.env.SEED_SECRET || process.env.VERCEL_SEED_SECRET;
  const headerOk = headerSecret && configuredSecret && headerSecret === configuredSecret;

  if (!headerOk) {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const [templatesCount, storesCount, auditsCount, fbStoresCount] = await Promise.all([
      prisma.auditTemplate.count({ where: { active: true } }),
      prisma.store.count({ where: { status: "active" } }),
      prisma.audit.count(),
      prisma.store.count({ where: { status: "active", storeType: "FB" } }),
    ]);

    const ok = templatesCount > 0 && fbStoresCount > 0;

    return NextResponse.json({
      ok,
      counts: { templatesCount, storesCount, fbStoresCount, auditsCount },
      issues: [
        ...(templatesCount === 0 ? ["No active audit templates — hit POST /api/admin/seed"] : []),
        ...(fbStoresCount === 0 ? ["No active FB stores — seed required"] : []),
      ],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
