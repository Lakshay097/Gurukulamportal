import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/session";
import { createExternalToken, listExternalTokens, revokeExternalToken } from "@/lib/external-tokens";

async function requireAdmin() {
  const session = await getAppSession();
  if (session?.kind !== "internal" || !session.groupKeys.includes("admin-central")) return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ tokens: await listExternalTokens() });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  if (!body.label || !body.groupKey) {
    return NextResponse.json({ error: "label and groupKey required" }, { status: 400 });
  }

  const record = await createExternalToken({
    label: body.label,
    groupKey: body.groupKey,
    createdBy: session.userEmail ?? "unknown",
    expiresInDays: body.expiresInDays ?? null, // null = forever, the agreed default
  });

  return NextResponse.json({ record, accessUrl: `${process.env.NEXTAUTH_URL}/external/${record.token}` });
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  await revokeExternalToken(token);
  return NextResponse.json({ ok: true });
}
