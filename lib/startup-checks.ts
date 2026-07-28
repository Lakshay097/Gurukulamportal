import { supabase } from "./supabase";
import { checkRasterizerHealth } from "./rasterizer-client";

const PAGE_CACHE_BUCKET = "drive-pdf-cache";

export async function checkRasterizerService(): Promise<{ ok: boolean; error?: string }> {
  const rasterizerUrl = process.env.PDF_RASTERIZER_URL;
  
  if (!rasterizerUrl) {
    console.error("❌ PDF_RASTERIZER_URL environment variable not set");
    console.error("   Deploy the PDF rasterizer sidecar service (see pdf-rasterizer-service/README.md)");
    console.error("   Then set PDF_RASTERIZER_URL in your environment variables");
    return { ok: false, error: "PDF_RASTERIZER_URL not set" };
  }

  const isHealthy = await checkRasterizerHealth();
  if (!isHealthy) {
    console.error(`❌ PDF rasterizer service at ${rasterizerUrl} is not responding`);
    console.error("   Ensure the sidecar service is deployed and running");
    return { ok: false, error: "Rasterizer service not healthy" };
  }

  console.log(`✅ PDF rasterizer service healthy at ${rasterizerUrl}`);
  return { ok: true };
}

export async function checkSupabaseBucket(): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.storage.getBucket(PAGE_CACHE_BUCKET);
    
    if (error) {
      if (error.message.includes("not found") || error.message.includes("Bucket not found")) {
        console.error(`❌ Supabase bucket "${PAGE_CACHE_BUCKET}" does not exist`);
        console.error(`   Create it in Supabase dashboard: Storage > New bucket > Name: "${PAGE_CACHE_BUCKET}" > Public: false`);
        return { ok: false, error: "Bucket not found" };
      }
      console.error(`❌ Error checking Supabase bucket: ${error.message}`);
      return { ok: false, error: error.message };
    }

    if (data.public) {
      console.warn(`⚠️  Bucket "${PAGE_CACHE_BUCKET}" is public - consider setting to private for security`);
    } else {
      console.log(`✅ Supabase bucket "${PAGE_CACHE_BUCKET}" exists and is private`);
    }

    return { ok: true };
  } catch (err: any) {
    console.error(`❌ Error checking Supabase bucket: ${err?.message ?? String(err)}`);
    return { ok: false, error: err?.message ?? String(err) };
  }
}

export async function runStartupChecks(): Promise<void> {
  console.log("🔍 Running startup checks...");
  
  const rasterizerOk = await checkRasterizerService();
  const bucketOk = await checkSupabaseBucket();

  if (!rasterizerOk.ok || !bucketOk.ok) {
    console.error("\n❌ Startup checks failed. The application may not function correctly.");
    console.error("   Please fix the issues above before deploying to production.\n");
    // Don't throw - allow dev to continue with warnings, but log clearly
  } else {
    console.log("\n✅ All startup checks passed.\n");
  }
}

// Run checks immediately on module load (server-side only)
if (typeof window === "undefined" && process.env.NODE_ENV !== "test") {
  runStartupChecks().catch((err) => {
    console.error("Startup checks failed:", err);
  });
}
