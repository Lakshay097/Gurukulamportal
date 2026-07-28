import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/session";
import { canAccess } from "@/lib/permissions";
import { getFileMetadata } from "@/lib/drive";
import { getPageImage } from "@/lib/page-cache";
import { enforceRateLimit } from "@/lib/rate-limit-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string; n: string }> }
) {
  // 120 page-views/minute per IP — well above real usage, blocks scraping
  const { blocked } = enforceRateLimit(req, "page-image", { limit: 120, windowSeconds: 60 });
  if (blocked) return blocked;

  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { fileId, n } = await params;
  const resourceType = req.nextUrl.searchParams.get("resourceType") ?? "document_section";
  const resourceId = req.nextUrl.searchParams.get("resourceId") ?? "";
  const allowed = await canAccess(session.groupKeys, resourceType, resourceId);
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const pageNum = parseInt(n, 10);
  if (Number.isNaN(pageNum) || pageNum < 1) return NextResponse.json({ error: "invalid_page" }, { status: 400 });

  const meta = await getFileMetadata(fileId);
  if (!meta?.mimeType || !meta.modifiedTime) return NextResponse.json({ error: "file_not_found" }, { status: 404 });

  const imageBuffer = await getPageImage(fileId, meta.mimeType, meta.modifiedTime, pageNum);
  if (!imageBuffer) return NextResponse.json({ error: "page_not_found" }, { status: 404 });

  return new NextResponse(new Uint8Array(imageBuffer), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
      "Content-Disposition": "inline",
    },
  });
}
