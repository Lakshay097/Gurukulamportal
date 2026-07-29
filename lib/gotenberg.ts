import { createHmac } from 'crypto';
import { getCachedPdf, setCachedPdf } from '@/lib/pdf-cache';
import { downloadFileBytes } from '@/lib/drive';

// Re-export setCachedPdf for use in preconvert-docs
export { setCachedPdf };

const GOTENBERG_URL = process.env.GOTENBERG_URL;
const GOTENBERG_AUTH_TOKEN = process.env.GOTENBERG_AUTH_TOKEN;
const APP_URL = process.env.APP_URL;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

/**
 * Converts an Office file (DOCX/XLSX/PPTX/DOC/XLS/PPT) to PDF bytes using a
 * self-hosted Gotenberg instance (behind a Caddy auth proxy on Render).
 * No Google Drive interaction — raw bytes in, PDF bytes out.
 */
export async function convertOfficeBufferToPdf(
  fileBuffer: Buffer,
  fileName: string
): Promise<Buffer> {
  console.log('[Gotenberg] GOTENBERG_URL:', GOTENBERG_URL ? 'SET' : 'NOT SET');
  console.log('[Gotenberg] GOTENBERG_AUTH_TOKEN:', GOTENBERG_AUTH_TOKEN ? 'SET' : 'NOT SET');
  
  if (!GOTENBERG_URL) {
    throw new Error('GOTENBERG_URL is not configured');
  }

  const formData = new FormData();
  // Filename MUST retain the original extension — Gotenberg's LibreOffice
  // route picks the converter based on it.
  formData.append('files', new Blob([new Uint8Array(fileBuffer)]), fileName);

  const headers: Record<string, string> = {};
  if (GOTENBERG_AUTH_TOKEN) {
    headers['Authorization'] = GOTENBERG_AUTH_TOKEN;
  }

  console.log('[Gotenberg] Request URL:', `${GOTENBERG_URL}/forms/libreoffice/convert`);
  console.log('[Gotenberg] Authorization header:', headers['Authorization'] ? 'SET' : 'NOT SET');

  const response = await fetch(`${GOTENBERG_URL}/forms/libreoffice/convert`, {
    method: 'POST',
    headers,
    body: formData,
  });

  console.log('[Gotenberg] Response status:', response.status);
  console.log('[Gotenberg] Response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    console.error('[Gotenberg] Error response body:', errText);
    throw new Error(
      `Gotenberg conversion failed (${response.status}): ${errText || 'no details'}` 
    );
  }

  return Buffer.from(await response.arrayBuffer());
}

/**
 * Ensures a PDF is available for the given Office file, either from cache
 * or by performing conversion. This is a shared function used by both the
 * API route and the server component for pre-conversion.
 *
 * @param fileId - Google Drive file ID
 * @param modifiedTime - File's modifiedTime for cache invalidation
 * @param fileName - Original filename (with extension for Gotenberg)
 * @param drive - Drive client instance
 * @returns Buffer containing the PDF bytes
 * @throws Error if conversion fails
 */
export async function ensureConvertedPdf(
  fileId: string,
  modifiedTime: string,
  fileName: string,
  drive: any
): Promise<Buffer> {
  console.log('[ensureConvertedPdf] Checking cache for:', fileId);

  // Check cache first
  const cachedPdf = await getCachedPdf(fileId, modifiedTime);
  if (cachedPdf) {
    console.log('[ensureConvertedPdf] Cache hit, returning cached PDF');
    return cachedPdf;
  }

  console.log('[ensureConvertedPdf] Cache miss, performing live conversion');

  // Download file bytes from Drive
  console.log('[ensureConvertedPdf] Step 1: Downloading file bytes from Drive');
  const rawBytes = await downloadFileBytes(fileId, drive);
  console.log('[ensureConvertedPdf] Step 1 complete: Downloaded', rawBytes.length, 'bytes');

  // Convert to PDF via Gotenberg
  console.log('[ensureConvertedPdf] Step 2: Converting to PDF via LibreOffice');
  const pdfBuffer = await convertOfficeBufferToPdf(rawBytes, fileName);
  console.log('[ensureConvertedPdf] Step 2 complete: Conversion successful, PDF length:', pdfBuffer.length);

  // Cache write - log errors but don't block response
  setCachedPdf(fileId, modifiedTime, pdfBuffer).catch((err) => {
    console.error('[ensureConvertedPdf] Cache write failed:', err);
  });

  return pdfBuffer;
}

/**
 * Signs a webhook token for a given file ID using HMAC-SHA256.
 */
export function signWebhookToken(fileId: string): string {
  if (!WEBHOOK_SECRET) {
    throw new Error('WEBHOOK_SECRET is not configured');
  }
  return createHmac('sha256', WEBHOOK_SECRET).update(fileId).digest('hex');
}

/**
 * Verifies a webhook token for a given file ID.
 */
export function verifyWebhookToken(fileId: string, token: string | null): boolean {
  if (!WEBHOOK_SECRET || !token) {
    return false;
  }
  return token === signWebhookToken(fileId);
}

/**
 * Requests async PDF conversion from Gotenberg using webhooks.
 * Gotenberg validates the request, returns 204 No Content immediately,
 * converts in the background, and POSTs the finished PDF to the webhook URL.
 */
export async function requestPdfConversion(
  fileId: string,
  fileBuffer: Buffer,
  filename: string
): Promise<void> {
  if (!GOTENBERG_URL) {
    throw new Error('GOTENBERG_URL is not configured');
  }
  if (!APP_URL) {
    throw new Error('APP_URL is not configured');
  }
  if (!WEBHOOK_SECRET) {
    throw new Error('WEBHOOK_SECRET is not configured');
  }

  const form = new FormData();
  form.append('files', new Blob([new Uint8Array(fileBuffer)]), filename);

  const callbackUrl = `${APP_URL}/api/gotenberg-webhook?fileId=${fileId}&token=${signWebhookToken(fileId)}`;
  
  const headers: Record<string, string> = {
    'Gotenberg-Webhook-Url': callbackUrl,
    'Gotenberg-Webhook-Events-Url': callbackUrl, // failures land here too
  };
  if (GOTENBERG_AUTH_TOKEN) {
    headers['Authorization'] = GOTENBERG_AUTH_TOKEN;
  }

  console.log('[Gotenberg] Requesting async conversion for fileId:', fileId);
  console.log('[Gotenberg] Webhook callback URL:', callbackUrl);

  const res = await fetch(`${GOTENBERG_URL}/forms/libreoffice/convert`, {
    method: 'POST',
    headers,
    body: form,
  });

  console.log('[Gotenberg] Async conversion response status:', res.status);

  if (res.status !== 204) {
    const errText = await res.text().catch(() => '');
    console.error('[Gotenberg] Async request rejected:', errText);
    throw new Error(`Gotenberg rejected the async request: ${res.status} ${errText}`);
  }

  console.log('[Gotenberg] Async conversion request accepted');
}
