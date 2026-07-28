import { google } from 'googleapis';

// This module uses Node.js-only modules (child_process, fs) and should only be used on the server

let driveClient: any = null;
let userDriveClient: any = null;

export function getDriveClient(accessToken?: string) {
  // If user access token is provided, use OAuth credentials
  if (accessToken) {
    if (userDriveClient && userDriveClient._options.auth.credentials.access_token === accessToken) {
      return userDriveClient;
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    userDriveClient = google.drive({ version: 'v3', auth: oauth2Client });
    return userDriveClient;
  }

  // Otherwise, use service account (default behavior)
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
    scopes: [
      'https://www.googleapis.com/auth/drive.readonly', // read-only access to Drive files
    ],
  });

  driveClient = google.drive({ version: 'v3', auth });
  return driveClient;
}

// Helper function to execute Drive operation with fallback from service account to user OAuth
async function executeWithFallback<T>(
  operation: (drive: any) => Promise<T>,
  accessToken?: string
): Promise<T> {
  // First try with service account (for files shared with service account)
  try {
    const serviceDrive = getDriveClient();
    return await operation(serviceDrive);
  } catch (error: any) {
    // If service account fails with permission error, try with user OAuth
    if ((error?.code === 403 || error?.code === 404 || error?.status === 403 || error?.status === 404) && accessToken) {
      console.log('Service account access failed, trying with user OAuth credentials');
      try {
        const userDrive = getDriveClient(accessToken);
        return await operation(userDrive);
      } catch (userError: any) {
        console.error('User OAuth also failed:', userError.message);
        throw userError;
      }
    }
    throw error;
  }
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

export async function listFilesInFolder(folderId: string, accessToken?: string): Promise<DriveFile[]> {
  return executeWithFallback(async (drive) => {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id,name,mimeType,modifiedTime,webViewLink)',
    });

    return response.data.files || [];
  }, accessToken);
}

export async function getFolderStructure(folderId: string, accessToken?: string): Promise<DriveFolder> {
  return executeWithFallback(async (drive) => {
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
        const subfolder = await getFolderStructure(item.id, accessToken);
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
  }, accessToken);
}

export async function isFolderAccessible(folderId: string, accessToken?: string): Promise<boolean> {
  try {
    await executeWithFallback(async (drive) => {
      await drive.files.get({
        fileId: folderId,
        fields: 'name',
      });
    }, accessToken);
    return true;
  } catch (error: any) {
    console.error(`Folder ${folderId} is not accessible:`, error.message);
    return false;
  }
}

export async function getThumbnailUrl(fileId: string, accessToken?: string): Promise<string | null> {
  try {
    const response = await executeWithFallback(async (drive) => {
      return await drive.files.get({
        fileId,
        fields: 'thumbnailLink',
      });
    }, accessToken);
    return response.data.thumbnailLink || null;
  } catch (error) {
    console.error(`Error getting thumbnail for file ${fileId}:`, error);
    return null;
  }
}

const OFFICE_TO_GOOGLE_MIME: Record<string, string> = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'application/vnd.google-apps.document',
  'application/msword': 'application/vnd.google-apps.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'application/vnd.google-apps.spreadsheet',
  'application/vnd.ms-excel': 'application/vnd.google-apps.spreadsheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'application/vnd.google-apps.presentation',
  'application/vnd.ms-powerpoint': 'application/vnd.google-apps.presentation',
};

export function isConvertibleOfficeMimeType(mimeType: string): boolean {
  return mimeType in OFFICE_TO_GOOGLE_MIME;
}

/**
 * Downloads the raw bytes of a file from Google Drive.
 */
export async function downloadFileBytes(
  fileId: string,
  drive: ReturnType<typeof google.drive>
): Promise<Buffer> {
  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );
  return Buffer.from(response.data as ArrayBuffer);
}

/**
 * Gets file metadata from Google Drive.
 */
export async function getFileMetadata(fileId: string) {
  const drive = getDriveClient();
  const { data } = await drive.files.get({
    fileId,
    fields: "id, name, mimeType, modifiedTime, size",
    supportsAllDrives: true,
  });
  return data;
}
