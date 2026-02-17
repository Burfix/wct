import { NextRequest, NextResponse } from "next/server";
import { getZoneDrilldown } from "@/app/dashboard/actions-executive";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zone = searchParams.get("zone");

    if (!zone) {
      return NextResponse.json(
        { error: "Zone parameter is required" },
        { status: 400 }
      );
    }

    const data = await getZoneDrilldown(zone);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Zone drilldown error:", error);
    return NextResponse.json(
      { error: "Failed to load zone drilldown" },
      { status: 500 }
    );
  }
}
