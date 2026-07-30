"use client";

import { useEffect, useState, useCallback } from "react";

interface ViewerMeta {
  fileName: string;
  pageCount: number;
}

export function SecureViewer({
  fileId,
  resourceType,
  resourceId,
  viewerLabel,
}: {
  fileId: string;
  resourceType: string;
  resourceId: string;
  viewerLabel: string; // user email, for watermark
}) {
  const [meta, setMeta] = useState<ViewerMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch(`/api/view/${fileId}?resourceType=${resourceType}&resourceId=${resourceId}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Unable to load this document.");
        }
        return res.json();
      })
      .then(setMeta)
      .catch((err) => setError(err.message));
  }, [fileId, resourceType, resourceId]);

  useEffect(() => {
    const blockContextMenu = (e: MouseEvent) => e.preventDefault();
    const blockKeys = (e: KeyboardEvent) => {
      const blocked =
        e.key === "PrintScreen" ||
        (e.ctrlKey && ["p", "s", "u", "c"].includes(e.key.toLowerCase())) ||
        (e.metaKey && ["p", "s"].includes(e.key.toLowerCase()));
      if (blocked) e.preventDefault();
    };
    document.addEventListener("contextmenu", blockContextMenu);
    document.addEventListener("keydown", blockKeys);
    return () => {
      document.removeEventListener("contextmenu", blockContextMenu);
      document.removeEventListener("keydown", blockKeys);
    };
  }, []);

  const goTo = useCallback((n: number) => {
    if (!meta) return;
    setPage(Math.min(Math.max(n, 1), meta.pageCount));
  }, [meta]);

  if (error) return <div className="flex h-screen items-center justify-center text-neutral-600">{error}</div>;
  if (!meta) return <div className="flex h-screen items-center justify-center text-neutral-500">Loading document…</div>;

  const watermarkText = `${viewerLabel} · ${new Date().toLocaleString()}`;

  return (
    <div className="relative flex h-screen flex-col bg-neutral-900" style={{ userSelect: "none" }}>
      <header className="flex items-center justify-between px-4 py-3 bg-neutral-950 text-neutral-100">
        <span className="truncate text-sm">{meta.fileName}</span>
        <span className="text-xs text-neutral-400">Page {page} / {meta.pageCount}</span>
      </header>

      <div className="relative flex-1 overflow-auto flex items-center justify-center bg-neutral-800">
        <img
          src={`/api/view/${fileId}/page/${page}?resourceType=${resourceType}&resourceId=${resourceId}`}
          alt={`Page ${page} of ${meta.fileName}`}
          className="max-h-full max-w-full shadow-lg"
          draggable={false}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
              `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='160'><text x='10' y='90' font-size='16' fill='white' transform='rotate(-20 160 80)'>${watermarkText}</text></svg>` 
            )}")`,
            backgroundRepeat: "repeat",
          }}
        />
      </div>

      <footer className="flex items-center justify-center gap-4 px-4 py-3 bg-neutral-950">
        <button className="text-neutral-200 disabled:opacity-30" onClick={() => goTo(page - 1)} disabled={page <= 1}>← Prev</button>
        <button className="text-neutral-200 disabled:opacity-30" onClick={() => goTo(page + 1)} disabled={page >= meta.pageCount}>Next →</button>
      </footer>
    </div>
  );
}
