import { spawn } from "child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

// Requires poppler-utils (pdftoppm, pdfinfo). Add it to whatever
// container already runs Gotenberg — if your Next.js host can't run
// native binaries (e.g. Vercel), move this file into a small sidecar
// service next to Gotenberg and call it over HTTP instead.

export async function rasterizePdfPage(
  pdfBuffer: Buffer,
  pageNum: number,
  opts: { dpi?: number; format?: "png" | "jpeg" } = {}
): Promise<Buffer> {
  const dpi = opts.dpi ?? 150;
  const format = opts.format ?? "jpeg";
  const dir = await mkdtemp(path.join(tmpdir(), "raster-"));
  const pdfPath = path.join(dir, "input.pdf");
  const outputPrefix = path.join(dir, "page");

  try {
    await writeFile(pdfPath, pdfBuffer);

    await new Promise<void>((resolve, reject) => {
      const args = [`-${format}`, "-r", String(dpi), "-f", String(pageNum), "-l", String(pageNum), pdfPath, outputPrefix];
      const proc = spawn("pdftoppm", args);
      let stderr = "";
      proc.stderr.on("data", (d) => (stderr += d.toString()));
      proc.on("error", reject);
      proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`pdftoppm exited ${code}: ${stderr}`))));
    });

    const files = await readdir(dir);
    const pageFile = files.find((f) => f.startsWith("page") && f !== "input.pdf");
    if (!pageFile) throw new Error("pdftoppm produced no output");
    return await readFile(path.join(dir, pageFile));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function getPdfPageCount(pdfBuffer: Buffer): Promise<number> {
  const dir = await mkdtemp(path.join(tmpdir(), "pagecount-"));
  const pdfPath = path.join(dir, "input.pdf");

  try {
    await writeFile(pdfPath, pdfBuffer);
    return await new Promise<number>((resolve, reject) => {
      const proc = spawn("pdfinfo", [pdfPath]);
      let stdout = "";
      proc.stdout.on("data", (d) => (stdout += d.toString()));
      proc.on("error", reject);
      proc.on("close", (code) => {
        if (code !== 0) return reject(new Error("pdfinfo failed"));
        const match = stdout.match(/Pages:\s+(\d+)/);
        resolve(match ? parseInt(match[1], 10) : 0);
      });
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
