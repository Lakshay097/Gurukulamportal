import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const result = {
    token: null as any,
    hasToken: false,
    userGroupKeys: null as string[] | null,
    hasAdminCentral: false,
    error: null as string | null,
  };

  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    result.hasToken = !!token;
    result.token = token ? { 
      email: token.email,
      name: token.name,
      userGroupKeys: (token as any).userGroupKeys
    } : null;
    result.userGroupKeys = (token as any)?.userGroupKeys || [];
    result.hasAdminCentral = result.userGroupKeys?.includes('admin-central') || false;
    
  } catch (error: any) {
    result.error = error.message;
    console.error('Token debug error:', error);
  }

  return NextResponse.json(result);
}
