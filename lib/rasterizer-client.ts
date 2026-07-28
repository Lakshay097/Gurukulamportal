import FormData from "form-data";
import fetch from "node-fetch";

const RASTERIZER_URL = process.env.PDF_RASTERIZER_URL;

export async function rasterizePdfPage(
  pdfBuffer: Buffer,
  pageNum: number,
  opts: { dpi?: number; format?: "png" | "jpeg" } = {}
): Promise<Buffer> {
  if (!RASTERIZER_URL) {
    throw new Error("PDF_RASTERIZER_URL environment variable not set");
  }

  const formData = new FormData();
  formData.append("pdf", pdfBuffer, "input.pdf");
  formData.append("pageNum", String(pageNum));
  formData.append("dpi", String(opts.dpi ?? 150));
  formData.append("format", opts.format ?? "jpeg");

  const response = await fetch(`${RASTERIZER_URL}/rasterize`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Rasterizer service error: ${response.status} - ${errorText}`);
  }

  const buffer = await response.buffer();
  return buffer;
}

export async function getPdfPageCount(pdfBuffer: Buffer): Promise<number> {
  if (!RASTERIZER_URL) {
    throw new Error("PDF_RASTERIZER_URL environment variable not set");
  }

  const formData = new FormData();
  formData.append("pdf", pdfBuffer, "input.pdf");

  const response = await fetch(`${RASTERIZER_URL}/page-count`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Rasterizer service error: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as { pageCount: number };
  return data.pageCount;
}

export async function checkRasterizerHealth(): Promise<boolean> {
  if (!RASTERIZER_URL) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${RASTERIZER_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}
