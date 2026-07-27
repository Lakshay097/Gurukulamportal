import { google } from 'googleapis';

// This module uses Node.js-only modules (child_process, fs) and should only be used on the server

let driveClient: any = null;

export function getDriveClient() {
  if (driveClient) return driveClient;

  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
  }

  const serviceAccount = JSON.parse(
    Buffer.from(serviceAccountKey, 'base64').toString('utf8')
  );

  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  driveClient = google.drive({ version: 'v3', auth });
  return driveClient;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  files: DriveFile[];
  subfolders: DriveFolder[];
  isRoot?: boolean;
}

export async function listFilesInFolder(folderId: string): Promise<DriveFile[]> {
  const drive = getDriveClient();

  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id,name,mimeType,modifiedTime,webViewLink)',
    });

    return response.data.files || [];
  } catch (error: any) {
    console.error('Error listing files in folder:', error);
    
    // Enhance error with more context for proxy/network issues
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      throw new Error(`Network error accessing Drive: ${error.message}. This may be a proxy or connectivity issue.`);
    }
    
    throw error;
  }
}

export async function getFolderStructure(folderId: string): Promise<DriveFolder> {
  const drive = getDriveClient();

  try {
    // Get folder name
    const folderResponse = await drive.files.get({
      fileId: folderId,
      fields: 'name',
    });

    const folderName = folderResponse.data.name || 'Root';

    // Get all items in folder (files and folders)
    const itemsResponse = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id,name,mimeType,modifiedTime,webViewLink)',
    });

    const items = itemsResponse.data.files || [];
    const files: DriveFile[] = [];
    const subfolders: DriveFolder[] = [];

    // Separate files and folders
    for (const item of items) {
      if (item.mimeType === 'application/vnd.google-apps.folder') {
        // Recursively get subfolder structure
        const subfolder = await getFolderStructure(item.id);
        subfolders.push(subfolder);
      } else {
        files.push({
          id: item.id!,
          name: item.name!,
          mimeType: item.mimeType!,
          modifiedTime: item.modifiedTime!,
          webViewLink: item.webViewLink,
        });
      }
    }

    return {
      id: folderId,
      name: folderName,
      files,
      subfolders,
    };
  } catch (error: any) {
    console.error('Error getting folder structure:', error);
    
    // Enhance error with more context for proxy/network issues
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      throw new Error(`Network error accessing Drive: ${error.message}. This may be a proxy or connectivity issue.`);
    }
    
    throw error;
  }
}

export async function isFolderAccessible(folderId: string): Promise<boolean> {
  const drive = getDriveClient();

  try {
    // Try to get folder metadata to check accessibility
    await drive.files.get({
      fileId: folderId,
      fields: 'name',
    });
    return true;
  } catch (error: any) {
    console.error(`Folder ${folderId} is not accessible:`, error.message);
    return false;
  }
}

export async function getThumbnailUrl(fileId: string): Promise<string | null> {
  const drive = getDriveClient();
  try {
    const response = await drive.files.get({
      fileId,
      fields: 'thumbnailLink',
    });
    return response.data.thumbnailLink || null;
  } catch (error) {
    console.error(`Error getting thumbnail for file ${fileId}:`, error);
    return null;
  }
}
