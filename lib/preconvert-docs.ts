import { drive_v3 } from "googleapis";
import { getDriveClient, isConvertibleOfficeMimeType, downloadFileBytes } from "./drive";
import { convertOfficeBufferToPdf, setCachedPdf } from "./gotenberg";
import { adminDb } from "./firebase";

interface ConversionResult {
  total: number;
  converted: number;
  skipped: number;
  failed: number;
  errors: { fileId: string; name: string; error: string }[];
}

/**
 * Pre-converts all Office documents in a Drive folder to PDF and caches them.
 * This should be run on a schedule or triggered by admins to ensure documents
 * are ready for viewing without conversion delays.
 */
export async function preconvertFolder(
  folderId: string,
  maxDepth: number = 10
): Promise<ConversionResult> {
  const drive = getDriveClient();
  const result: ConversionResult = {
    total: 0,
    converted: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  const queue: { folderId: string; depth: number }[] = [{ folderId, depth: 0 }];

  while (queue.length > 0) {
    const { folderId: currentFolderId, depth } = queue.shift()!;

    if (depth > maxDepth) {
      console.log(`[Preconvert] Max depth reached for folder ${currentFolderId}`);
      continue;
    }

    let pageToken: string | undefined;

    try {
      do {
        const { data } = await drive.files.list({
          q: `'${currentFolderId}' in parents and trashed = false`,
          fields: "nextPageToken, files(id, name, mimeType, modifiedTime)",
          pageSize: 100,
          pageToken,
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });

        for (const file of data.files ?? []) {
          if (!file.id) continue;

          result.total++;

          // If it's a folder, add to queue for recursive processing
          if (file.mimeType === "application/vnd.google-apps.folder") {
            queue.push({ folderId: file.id, depth: depth + 1 });
            continue;
          }

          // Skip non-Office files
          if (!isConvertibleOfficeMimeType(file.mimeType || "")) {
            result.skipped++;
            continue;
          }

          // Try to pre-convert this Office file
          try {
            await preconvertFile(file.id, file.name || "unknown", file.modifiedTime || "unknown", drive);
            result.converted++;
            console.log(`[Preconvert] Converted: ${file.name} (${file.id})`);
          } catch (err: any) {
            result.failed++;
            result.errors.push({
              fileId: file.id,
              name: file.name || "unknown",
              error: err?.message || String(err),
            });
            console.error(`[Preconvert] Failed to convert ${file.name}:`, err);
          }
        }

        pageToken = data.nextPageToken ?? undefined;
      } while (pageToken);
    } catch (err: any) {
      console.error(`[Preconvert] Error listing folder ${currentFolderId}:`, err);
    }
  }

  return result;
}

/**
 * Pre-converts a single Office file to PDF and caches it.
 */
async function preconvertFile(
  fileId: string,
  fileName: string,
  modifiedTime: string,
  drive: drive_v3.Drive
): Promise<void> {
  // Check if already cached
  const db = adminDb;
  if (db) {
    const cacheDoc = await db.collection('drive_pdf_cache').doc(fileId.replace(/[/\s]/g, '_')).get();
    if (cacheDoc.exists) {
      const entry = cacheDoc.data();
      if (entry?.modifiedTime === modifiedTime) {
        console.log(`[Preconvert] Already cached: ${fileName} (${fileId})`);
        return;
      }
    }
  }

  // Download and convert
  console.log(`[Preconvert] Converting: ${fileName} (${fileId})`);
  const rawBytes = await downloadFileBytes(fileId, drive);
  const pdfBuffer = await convertOfficeBufferToPdf(rawBytes, fileName);

  // Cache the PDF
  await setCachedPdf(fileId, modifiedTime, pdfBuffer);
  console.log(`[Preconvert] Successfully cached: ${fileName} (${fileId})`);
}

/**
 * Pre-converts all Office documents across all document sections.
 * This scans all driveFolderId values in the documentSections collection.
 */
export async function preconvertAllDocuments(): Promise<ConversionResult> {
  const db = adminDb;
  if (!db) {
    throw new Error("Firebase Admin SDK not available");
  }

  console.log("[Preconvert] Starting pre-conversion of all documents");

  // Get all document sections with driveFolderId
  const sectionsSnapshot = await db.collection('documentSections')
    .where('driveFolderId', '!=', null)
    .get();

  const totalResult: ConversionResult = {
    total: 0,
    converted: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  for (const doc of sectionsSnapshot.docs) {
    const section = doc.data();
    const folderId = section.driveFolderId;

    if (!folderId) continue;

    console.log(`[Preconvert] Processing section: ${section.type} (folder: ${folderId})`);

    try {
      const result = await preconvertFolder(folderId, 5); // Limit depth to 5 for performance
      totalResult.total += result.total;
      totalResult.converted += result.converted;
      totalResult.skipped += result.skipped;
      totalResult.failed += result.failed;
      totalResult.errors.push(...result.errors);
    } catch (err: any) {
      console.error(`[Preconvert] Failed to process folder ${folderId}:`, err);
      totalResult.errors.push({
        fileId: folderId,
        name: section.type || "unknown",
        error: err?.message || String(err),
      });
    }
  }

  console.log("[Preconvert] Pre-conversion complete:", totalResult);
  return totalResult;
}
