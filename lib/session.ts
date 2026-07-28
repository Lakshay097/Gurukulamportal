import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { authOptions } from "./auth";
import { getExternalTokenByCookieValue } from "./external-tokens";

export interface AppSession {
  kind: "internal" | "external";
  userEmail: string | null;
  groupKeys: string[];
  label: string | null;
}

export async function getAppSession(): Promise<AppSession | null> {
  const nextAuthSession = await getServerSession(authOptions);
  const session = nextAuthSession as any;
  
  if (session?.userGroupKeys) {
    return {
      kind: "internal",
      userEmail: session.user?.email ?? null,
      groupKeys: session.userGroupKeys,
      label: null,
    };
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("external_access_token")?.value;
  if (!cookieToken) return null;

  const record = await getExternalTokenByCookieValue(cookieToken);
  if (!record) return null;

  return {
    kind: "external",
    userEmail: null,
    groupKeys: [record.groupKey],
    label: record.label,
  };
}
