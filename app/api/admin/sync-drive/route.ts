import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/session";
import { syncServiceAccountPermissions } from "@/lib/drive-sync";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret");
  const isCron = cronSecret && cronSecret === process.env.CRON_SECRET;

  if (!isCron) {
    const session = await getAppSession();
    if (session?.kind !== "internal" || !session.groupKeys.includes("admin-central")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const result = await syncServiceAccountPermissions();
    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    console.error("Drive sync failed:", err);
    return NextResponse.json({ ok: false, error: err?.message ?? "Sync failed" }, { status: 500 });
  }
}
