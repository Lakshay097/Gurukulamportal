import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  return NextResponse.json({
    session: session ? {
      user: session.user,
      userGroupKeys: (session as any).userGroupKeys || [],
      expires: session.expires,
    } : null,
    hasSession: !!session,
  });
}
