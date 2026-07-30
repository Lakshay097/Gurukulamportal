import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export interface AppSession {
  kind: "guest" | "internal";
  userEmail: string | null;
  groupKeys: string[];
}

export async function getAppSession(): Promise<AppSession> {
  // Check NextAuth session first
  const nextAuthSession = await getServerSession(authOptions);
  const session = nextAuthSession as any;
  
  if (session?.userGroupKeys) {
    return {
      kind: "internal",
      userEmail: session.user?.email ?? null,
      groupKeys: session.userGroupKeys,
    };
  }

  // No session means guest
  return {
    kind: "guest",
    userEmail: null,
    groupKeys: ["guest"],
  };
}
