import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/session";
import { preconvertAllDocuments, preconvertFolder } from "@/lib/preconvert-docs";

export const maxDuration = 600; // 10 minutes for large conversion jobs

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
    const body = await req.json().catch(() => ({}));
    const { folderId } = body;

    let result;
    if (folderId) {
      // Pre-convert specific folder
      result = await preconvertFolder(folderId);
    } else {
      // Pre-convert all documents
      result = await preconvertAllDocuments();
    }

    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    console.error("Pre-conversion failed:", err);
    return NextResponse.json({ ok: false, error: err?.message ?? "Pre-conversion failed" }, { status: 500 });
  }
}
