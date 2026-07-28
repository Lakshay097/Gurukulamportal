import { adminDb } from "./firebase";
import { supabase } from "./supabase";
import { downloadFileBytes, isConvertibleOfficeMimeType } from "./drive";
import { convertOfficeBufferToPdf } from "./gotenberg";
import { getCachedPdf, setCachedPdf } from "./pdf-cache";
import { rasterizePdfPage, getPdfPageCount } from "./rasterizer-client";

const PAGE_CACHE_BUCKET = "drive-pdf-cache";
const META_COLLECTION = "page_cache_meta";

function cacheKey(fileId: string, modifiedTime: string) {
  return `${fileId}__${modifiedTime.replace(/[:.]/g, "-")}`;
}

async function getPdfBuffer(fileId: string, mimeType: string, modifiedTime: string): Promise<Buffer> {
  const cached = await getCachedPdf(fileId, modifiedTime);
  if (cached) return cached;

  const drive = require("./drive").getDriveClient();
  const raw = await downloadFileBytes(fileId, drive);
  const pdfBuffer =
    mimeType === "application/pdf"
      ? raw
      : isConvertibleOfficeMimeType(mimeType)
      ? await convertOfficeBufferToPdf(raw, fileId)
      : (() => { throw new Error(`Unsupported mime type: ${mimeType}`); })();

  await setCachedPdf(fileId, modifiedTime, pdfBuffer);
  return pdfBuffer;
}

export async function getPageCount(fileId: string, mimeType: string, modifiedTime: string): Promise<number> {
  const key = cacheKey(fileId, modifiedTime);
  
  if (!adminDb) {
    console.warn('Firebase Admin SDK not available, skipping page count cache');
    const pdfBuffer = await getPdfBuffer(fileId, mimeType, modifiedTime);
    return await getPdfPageCount(pdfBuffer);
  }

  const metaDoc = await adminDb.collection(META_COLLECTION).doc(key).get();
  if (metaDoc.exists) return metaDoc.data()!.pageCount as number;

  const pdfBuffer = await getPdfBuffer(fileId, mimeType, modifiedTime);
  const pageCount = await getPdfPageCount(pdfBuffer);
  await adminDb.collection(META_COLLECTION).doc(key).set({ fileId, modifiedTime, pageCount, cachedAt: Date.now() });
  return pageCount;
}

export async function getPageImage(
  fileId: string,
  mimeType: string,
  modifiedTime: string,
  pageNum: number
): Promise<Buffer | null> {
  const key = cacheKey(fileId, modifiedTime);
  const storagePath = `${key}/page-${pageNum}.jpg`;

  const existing = await supabase.storage.from(PAGE_CACHE_BUCKET).download(storagePath);
  if (!existing.error && existing.data) return Buffer.from(await existing.data.arrayBuffer());

  const pdfBuffer = await getPdfBuffer(fileId, mimeType, modifiedTime);
  const pageCount = await getPdfPageCount(pdfBuffer);
  if (pageNum < 1 || pageNum > pageCount) return null;

  const imageBuffer = await rasterizePdfPage(pdfBuffer, pageNum, { dpi: 150, format: "jpeg" });
  await supabase.storage.from(PAGE_CACHE_BUCKET).upload(storagePath, imageBuffer, { contentType: "image/jpeg", upsert: true });
  return imageBuffer;
}
