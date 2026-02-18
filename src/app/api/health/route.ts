import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/health
 * Lightweight liveness + DB connectivity probe.
 * Returns 200 if DB responds, 503 otherwise.
 */
export async function GET() {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        ok: true,
        time: new Date().toISOString(),
        version: process.env.npm_package_version ?? "unknown",
        latencyMs: Date.now() - start,
      },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "DB unreachable";
    return NextResponse.json(
      { ok: false, error: message, time: new Date().toISOString() },
      { status: 503 }
    );
  }
}
