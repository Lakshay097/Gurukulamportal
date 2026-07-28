import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canAccess } from '@/lib/permissions';
import { getFolderStructure, listFilesInFolder } from '@/lib/drive';
import { ROOT_DRIVE_FOLDER_ID } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userGroupKeys = (session as any)?.userGroupKeys || [];
    const accessToken = (session as any)?.accessToken;

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

    // Check permissions before returning file data
    const hasAccess = await canAccess(userGroupKeys, resourceType, resourceId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // If the folder is the root folder, return a flat list of files instead of folder structure
    // The root folder is an internal storage concept, not user-facing
    if (folderId === ROOT_DRIVE_FOLDER_ID) {
      const files = await listFilesInFolder(folderId, accessToken);
      return NextResponse.json({
        folderStructure: {
          id: folderId,
          name: 'Documents',
          files: files,
          subfolders: [],
          isRoot: true,
        },
        unreadable: false
      });
    }

    const folderStructure = await getFolderStructure(folderId, accessToken);
    return NextResponse.json({ folderStructure, unreadable: false });
  } catch (error: any) {
    console.error('Error in drive list API:', error);
    
    // Check if this is a permission error (403 or 404 from Drive API)
    if (error?.code === 403 || error?.code === 404 || error?.status === 403 || error?.status === 404) {
      return NextResponse.json({ 
        error: 'Folder not accessible', 
        unreadable: true,
        files: [] 
      }, { status: 200 }); // Return 200 so the UI can handle the error state
    }
    
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}
