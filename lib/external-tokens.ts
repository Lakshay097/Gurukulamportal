import { randomBytes } from "crypto";
import { adminDb } from "./firebase";
import { FieldValue } from "firebase-admin/firestore";

export interface ExternalAccessToken {
  token: string;
  label: string;
  groupKey: string;
  createdBy: string;
  createdAt: number;
  expiresAt: number | null; // null = never expires
  revoked: boolean;
  lastUsedAt: number | null;
  useCount: number;
}

const COLLECTION = "externalAccessTokens";

export function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function createExternalToken(params: {
  label: string;
  groupKey: string;
  createdBy: string;
  expiresInDays?: number | null;
}): Promise<ExternalAccessToken> {
  if (!adminDb) {
    throw new Error("Firebase Admin SDK not available");
  }

  const token = generateToken();
  const record: ExternalAccessToken = {
    token,
    label: params.label,
    groupKey: params.groupKey,
    createdBy: params.createdBy,
    createdAt: Date.now(),
    expiresAt: params.expiresInDays ? Date.now() + params.expiresInDays * 86400000 : null,
    revoked: false,
    lastUsedAt: null,
    useCount: 0,
  };
  await adminDb.collection(COLLECTION).doc(token).set(record);
  return record;
}

export type TokenValidation =
  | { ok: true; record: ExternalAccessToken }
  | { ok: false; reason: "not_found" | "revoked" | "expired" };

export async function validateExternalToken(token: string): Promise<TokenValidation> {
  if (!adminDb) {
    return { ok: false, reason: "not_found" };
  }

  const doc = await adminDb.collection(COLLECTION).doc(token).get();
  if (!doc.exists) return { ok: false, reason: "not_found" };

  const record = doc.data() as ExternalAccessToken;
  if (record.revoked) return { ok: false, reason: "revoked" };
  if (record.expiresAt && Date.now() > record.expiresAt) return { ok: false, reason: "expired" };

  return { ok: true, record };
}

export async function touchExternalToken(token: string) {
  if (!adminDb) return;
  await adminDb.collection(COLLECTION).doc(token).update({
    lastUsedAt: Date.now(),
    useCount: FieldValue.increment(1),
  });
}

export async function revokeExternalToken(token: string) {
  if (!adminDb) return;
  await adminDb.collection(COLLECTION).doc(token).update({ revoked: true });
}

export async function listExternalTokens(): Promise<ExternalAccessToken[]> {
  if (!adminDb) return [];
  const snap = await adminDb.collection(COLLECTION).orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => d.data() as ExternalAccessToken);
}

export async function getExternalTokenByCookieValue(cookieToken: string): Promise<ExternalAccessToken | null> {
  const validation = await validateExternalToken(cookieToken);
  return validation.ok ? validation.record : null;
}
