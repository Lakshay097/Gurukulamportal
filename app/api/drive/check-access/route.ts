import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@/lib/session';
import { canAccess } from '@/lib/permissions';
import { isFolderAccessible } from '@/lib/drive';

export async function GET(request: NextRequest) {
  try {
    const session = await getAppSession();
    const userGroupKeys = session.groupKeys;
    const accessToken = session.kind === 'internal' ? (session as any).accessToken : undefined;

    const searchParams = request.nextUrl.searchParams;
    const folderId = searchParams.get('folderId');
    const resourceType = searchParams.get('resourceType') || 'document_section';
    const resourceId = searchParams.get('resourceId');

    if (!folderId) {
      return NextResponse.json({ error: 'folderId is required' }, { status: 400 });
    }

    if (!resourceId) {
      return NextResponse.json({ error: 'resourceId is required' }, { status: 400 });
    }

    // Check permissions before returning accessibility data
    const hasAccess = await canAccess(userGroupKeys, resourceType, resourceId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const isAccessible = await isFolderAccessible(folderId, accessToken);
    return NextResponse.json({ accessible: isAccessible });
  } catch (error: any) {
    console.error('Error in drive check-access API:', error);
    return NextResponse.json({ error: 'Failed to check folder accessibility' }, { status: 500 });
  }
}
