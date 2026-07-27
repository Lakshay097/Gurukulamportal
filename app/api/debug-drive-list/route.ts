import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canAccess } from '@/lib/permissions';
import { getFolderStructure } from '@/lib/drive';

export async function GET(request: NextRequest) {
  const result = {
    session: null as any,
    userGroupKeys: [] as string[],
    folderId: null as string | null,
    resourceType: null as string | null,
    resourceId: null as string | null,
    hasAccess: null as boolean | null,
    folderStructure: null as any,
    error: null as string | null,
  };

  try {
    const session = await getServerSession(authOptions);
    result.session = session ? { user: session.user } : null;
    result.userGroupKeys = (session as any)?.userGroupKeys || [];

    const searchParams = request.nextUrl.searchParams;
    result.folderId = searchParams.get('folderId') || '1eW2fw7tYM0Lg3eOTYRZ7Av3CEJfUikm2';
    result.resourceType = searchParams.get('resourceType') || 'document_section';
    result.resourceId = searchParams.get('resourceId') || 'l3WN81dHLQ59HcqMD1x3';

    // Check permissions
    result.hasAccess = await canAccess(result.userGroupKeys || [], result.resourceType, result.resourceId);

    if (result.hasAccess) {
      result.folderStructure = await getFolderStructure(result.folderId);
    }

  } catch (error: any) {
    result.error = error.message;
    console.error('Drive list debug error:', error);
  }

  return NextResponse.json(result);
}
