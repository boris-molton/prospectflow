import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDashboardStats, getRecentActivity } from "@/services/prospect.service";

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const [stats, recentActivity] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(10),
  ]);

  return NextResponse.json({ stats, recentActivity });
}
