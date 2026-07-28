"use client";

import { useEffect, useState } from "react";

interface TokenRow {
  token: string;
  label: string;
  groupKey: string;
  expiresAt: number | null;
  revoked: boolean;
  useCount: number;
  lastUsedAt: number | null;
}

export function ExternalTokenManager({ availableGroups }: { availableGroups: { key: string; label: string }[] }) {
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [label, setLabel] = useState("");
  const [groupKey, setGroupKey] = useState(availableGroups[0]?.key ?? "");
  const [expiresInDays, setExpiresInDays] = useState<number | "">(""); // "" = Never, agreed default
  const [newUrl, setNewUrl] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/admin/external-tokens");
    const data = await res.json();
    setTokens(data.tokens ?? []);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    const res = await fetch("/api/admin/external-tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, groupKey, expiresInDays: expiresInDays || null }),
    });
    const data = await res.json();
    setNewUrl(data.accessUrl);
    setLabel("");
    load();
  };

  const revoke = async (token: string, tokenLabel: string) => {
    const confirmed = window.confirm(
      `This link is shared by everyone at "${tokenLabel}". Revoking cuts off all of them at once, not one person. Continue?` 
    );
    if (!confirmed) return;
    await fetch(`/api/admin/external-tokens?token=${token}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-neutral-500">Label</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Acme Vendor" className="rounded border px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-neutral-500">Group</label>
          <select value={groupKey} onChange={(e) => setGroupKey(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
            {availableGroups.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-neutral-500">Expires</label>
          <select
            value={expiresInDays === "" ? "never" : String(expiresInDays)}
            onChange={(e) => setExpiresInDays(e.target.value === "never" ? "" : Number(e.target.value))}
            className="rounded border px-2 py-1.5 text-sm"
          >
            <option value="never">Never</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="365">1 year</option>
          </select>
        </div>
        <button onClick={create} disabled={!label || !groupKey} className="rounded bg-neutral-900 px-3 py-2 text-sm text-white">
          Create link
        </button>
      </div>

      {newUrl && (
        <div className="rounded border bg-neutral-50 p-3 text-sm">
          <p className="mb-1 text-neutral-500">Share this one link with everyone at this vendor:</p>
          <input readOnly value={newUrl} onFocus={(e) => e.currentTarget.select()} className="w-full rounded border px-2 py-1 font-mono text-xs" />
        </div>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-neutral-500">
            <th className="py-2">Label</th>
            <th>Group</th>
            <th>Uses</th>
            <th>Last used</th>
            <th>Expires</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((t) => (
            <tr key={t.token} className="border-b">
              <td className="py-2">{t.label}</td>
              <td>{t.groupKey}</td>
              <td>{t.useCount}</td>
              <td>{t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleDateString() : "Never"}</td>
              <td>{t.expiresAt ? new Date(t.expiresAt).toLocaleDateString() : "Never"}</td>
              <td>{t.revoked ? "Revoked" : "Active"}</td>
              <td>{!t.revoked && <button onClick={() => revoke(t.token, t.label)} className="text-red-600 hover:underline">Revoke</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
