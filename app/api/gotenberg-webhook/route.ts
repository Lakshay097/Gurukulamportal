import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookToken } from '@/lib/gotenberg';
import { uploadToPdfCache, markConversionFailed } from '@/lib/pdf-cache';

/**
 * Webhook endpoint for Gotenberg async PDF conversions.
 * Gotenberg POSTs the converted PDF here when conversion completes.
 * The request is authenticated via a signed token in the query params.
 */
export async function POST(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get('fileId');
  const token = req.nextUrl.searchParams.get('token');

  if (!fileId || !verifyWebhookToken(fileId, token)) {
    console.error('[Gotenberg Webhook] Unauthorized request', { fileId, hasToken: !!token });
    return new NextResponse('unauthorized', { status: 401 });
  }

  const contentType = req.headers.get('content-type') ?? '';
  
  try {
    if (contentType.includes('application/pdf')) {
      // Success: Gotenberg sent the converted PDF
      const pdfBytes = Buffer.from(await req.arrayBuffer());
      console.log('[Gotenberg Webhook] Received PDF for fileId:', fileId, 'Size:', pdfBytes.length);
      
      await uploadToPdfCache(fileId, pdfBytes);
      console.log('[Gotenberg Webhook] PDF cached successfully for fileId:', fileId);
    } else {
      // Failure: Gotenberg sent error details
      const errorText = await req.text();
      console.error('[Gotenberg Webhook] Conversion failed for fileId:', fileId, errorText);
      
      await markConversionFailed(fileId, errorText);
    }
    
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Gotenberg Webhook] Error processing webhook:', err);
    return new NextResponse('internal error', { status: 500 });
  }
}
