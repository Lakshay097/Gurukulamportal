import { isFolderAccessible, getDriveClient } from '@/lib/drive';
import { NextResponse } from 'next/server';

export async function GET() {
  const result = {
    env: {
      GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 'SET' : 'NOT SET',
      ROOT_DRIVE_FOLDER_ID: process.env.ROOT_DRIVE_FOLDER_ID || 'NOT SET',
    },
    driveClient: null as string | null,
    rootFolderAccess: null as boolean | null,
    sopFolderAccess: null as boolean | null,
    error: null as string | null,
  };

  try {
    // Test Drive client initialization
    const drive = getDriveClient();
    result.driveClient='SUCCESS';

    // Test root folder access
    const rootFolderId = process.env.ROOT_DRIVE_FOLDER_ID;
    if (rootFolderId) {
      result.rootFolderAccess = await isFolderAccessible(rootFolderId);
    }

    // Test SOP folder access (using the folder ID from Firebase)
    const sopFolderId = '1eW2fw7tYM0Lg3eOTYRZ7Av3CEJfUikm2';
    result.sopFolderAccess = await isFolderAccessible(sopFolderId);

  } catch (error: any) {
    result.error = error.message;
    console.error('Drive debug error:', error);
  }

  return NextResponse.json(result);
}
