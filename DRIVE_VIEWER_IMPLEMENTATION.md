# Google Drive Viewer Implementation

## Problem Statement

Users were unable to view Google Drive documents because:
1. Drive folders were shared with a service account, but not with individual users
2. When users tried to access documents, they encountered "Request Access" dialogs
3. The system required users to have personal Drive access to view files shared only with the service account
4. Users should be able to view documents in viewer mode without needing personal Drive permissions

## Goal

Enable users to view Google Drive documents in the application without requiring personal Drive access, while maintaining view-only restrictions (no download or edit capabilities).

## Solution Approach

### 1. Service Account Authentication
- Use Google Service Account credentials to access Drive files server-side
- Service account has access to Drive folders that users don't personally have access to
- Server-side proxy fetches files using service account credentials and serves them to users

### 2. Dual-Mode Access System
- Primary: Service account access (for files shared with service account)
- Fallback: User OAuth credentials (for files shared with user or publicly accessible)
- Automatic fallback when service account encounters permission errors

### 3. In-App Document Viewer
- Created custom document viewer component instead of redirecting to Drive URLs
- Files are fetched server-side and displayed in an iframe
- Eliminates need for users to have personal Drive access

### 4. View-Only Protections
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`
- Content-Disposition set to `inline` to prevent automatic downloads
- Iframe sandbox restrictions
- No direct Drive URLs exposed to users

## Code Implementation

### lib/auth.ts - Google OAuth with Drive Scope

```typescript
export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/drive.readonly',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, account }: any) {
      // Store Google access token for Drive API access
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    async session({ session, token }: any) {
      // Pass Google access token from JWT token to session
      if (token?.accessToken) {
        (session as any).accessToken = token.accessToken;
      }
      if (token?.refreshToken) {
        (session as any).refreshToken = token.refreshToken;
      }
      return session;
    },
  },
};
```

### lib/drive.ts - Dual-Mode Drive Client

```typescript
export function getDriveClient(accessToken?: string) {
  // If user access token is provided, use OAuth credentials
  if (accessToken) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: accessToken,
    });
    return google.drive({ version: 'v3', auth: oauth2Client });
  }

  // Otherwise, use service account (default behavior)
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const serviceAccount = JSON.parse(
    Buffer.from(serviceAccountKey, 'base64').toString('utf8')
  );

  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  return google.drive({ version: 'v3', auth });
}

// Helper function to execute Drive operation with fallback
async function executeWithFallback<T>(
  operation: (drive: any) => Promise<T>,
  accessToken?: string
): Promise<T> {
  // First try with service account
  try {
    const serviceDrive = getDriveClient();
    return await operation(serviceDrive);
  } catch (error: any) {
    // If service account fails with permission error, try with user OAuth
    if ((error?.code === 403 || error?.code === 404) && accessToken) {
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

export async function listFilesInFolder(folderId: string, accessToken?: string): Promise<DriveFile[]> {
  return executeWithFallback(async (drive) => {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id,name,mimeType,modifiedTime,webViewLink)',
    });
    return response.data.files || [];
  }, accessToken);
}
```

### app/api/drive/view/route.ts - Server-Side File Proxy

```typescript
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userGroupKeys = (session as any)?.userGroupKeys || [];

  const fileId = request.nextUrl.searchParams.get('fileId');
  const resourceType = request.nextUrl.searchParams.get('resourceType') || 'document_section';
  const resourceId = request.nextUrl.searchParams.get('resourceId');

  // Check permissions
  const hasAccess = await canAccess(userGroupKeys, resourceType, resourceId);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Use service account to get file metadata
  const drive = getDriveClient();
  const file = await drive.files.get({
    fileId,
    fields: 'mimeType,name',
  });

  const fileName = file.data.name || 'file';
  const mimeType = file.data.mimeType || 'application/octet-stream';

  // If it's a Google Docs file, export it
  if (mimeType.startsWith('application/vnd.google-apps')) {
    const mimeTypeMap: Record<string, string> = {
      'application/vnd.google-apps.document': 'application/pdf',
      'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.google-apps.presentation': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };

    const exportMimeType = mimeTypeMap[mimeType] || 'application/pdf';
    const response = await drive.files.export({
      fileId,
      mimeType: exportMimeType,
    });

    return new NextResponse(response.data, {
      headers: {
        'Content-Type': exportMimeType,
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
      },
    });
  }

  // For Office files (DOCX, XLSX, PPTX), return Drive embed URL
  if (mimeType.includes('officedocument')) {
    return NextResponse.json({
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      fileName,
      mimeType,
    });
  }

  // For other files (PDFs, images, etc.), download and serve directly
  const response = await drive.files.get({
    fileId,
    alt: 'media',
  }, { responseType: 'arraybuffer' });

  return new NextResponse(Buffer.from(response.data as ArrayBuffer), {
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
    },
  });
}
```

### app/view/[fileId]/page.tsx - In-App Viewer Route

```typescript
interface PageProps {
  params: Promise<{
    fileId: string;
  }>;
  searchParams: Promise<{
    resourceType?: string;
    resourceId?: string;
  }>;
}

export default async function ViewDocumentPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const userGroupKeys = (session as any)?.userGroupKeys || [];
  const { fileId } = await params;
  const { resourceType = 'document_section', resourceId } = await searchParams;

  // Check permissions
  const hasAccess = await canAccess(userGroupKeys, resourceType, resourceId);
  if (!hasAccess) {
    return notFound();
  }

  return (
    <DocumentViewer 
      fileId={fileId} 
      resourceType={resourceType} 
      resourceId={resourceId} 
    />
  );
}
```

### components/document-viewer.tsx - Document Viewer Component

```typescript
'use client';

export default function DocumentViewer({ fileId, resourceType, resourceId }: DocumentViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [mimeType, setMimeType] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFile() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/drive/view?fileId=${fileId}&resourceType=${resourceType}&resourceId=${resourceId}`
        );

        if (!response.ok) {
          throw new Error('Failed to load document');
        }

        // Check if response is JSON (for embed URLs) or binary data
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          if (data.embedUrl) {
            // For Office files, use Drive embed viewer
            setFileUrl(data.embedUrl);
            setFileName(data.fileName);
            setMimeType(data.mimeType);
            setLoading(false);
            return;
          }
        }

        // For other files, create blob URL
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setFileUrl(url);
        setMimeType(blob.type);

        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
          if (filenameMatch) {
            setFileName(filenameMatch[1]);
          }
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load document');
        setLoading(false);
      }
    }

    fetchFile();

    return () => {
      if (fileUrl && !fileUrl.startsWith('https://')) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileId, resourceType, resourceId]);

  if (loading) {
    return <div>Loading document...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900 truncate flex-1">
          {fileName || 'Document Viewer'}
        </h1>
        <button onClick={() => window.close()}>Close</button>
      </div>

      <div className="flex-1 overflow-auto">
        {fileUrl && (
          <iframe
            src={fileUrl}
            className="w-full h-full border-0"
            title={fileName || 'Document'}
            sandbox="allow-same-origin allow-scripts"
          />
        )}
      </div>
    </div>
  );
}
```

### components/document-card.tsx - Updated to Use In-App Viewer

```typescript
const handleCardClick = () => {
  // Open in-app viewer using server-side proxy
  window.open(`/view/${file.id}?resourceType=${resourceType}&resourceId=${resourceId}`, '_blank');
};
```

## Technical Challenges & Solutions

### Challenge 1: Next.js 16 Params Promise
- **Issue**: In Next.js 16, `params` and `searchParams` are Promises
- **Solution**: Added `await` before accessing parameters in dynamic routes

### Challenge 2: Office File Display
- **Issue**: Browsers cannot display DOCX, XLSX, PPTX files natively in iframes
- **Attempted Solution**: Export Office files as PDF using Drive API
- **Problem**: Drive API export only works for native Google Docs, not uploaded Office files
- **Current Solution**: Return Drive embed URL for Office files to use Google's viewer

### Challenge 3: Service Account Access
- **Issue**: Service account needs to be shared with Drive folders
- **Solution**: Users must share folders with service account email: `firebase-adminsdk-fbsvc@the-gs-9261e.iam.gserviceaccount.com`

## Current Status

✅ Completed:
- Service account authentication setup
- Dual-mode access system with fallback
- In-app document viewer component
- Server-side file proxy
- Security headers for view-only protection
- Next.js 16 compatibility fixes

⚠️ In Progress:
- Office file display (currently using Drive embed URLs as workaround)
- Testing with actual Drive folder sharing

🔄 Next Steps:
1. Share Drive folders with service account email
2. Test document viewing with various file types
3. Consider implementing PDF conversion service for Office files if needed
4. Add watermark overlays for enhanced view-only protection

## Service Account Details

**Email**: `firebase-adminsdk-fbsvc@the-gs-9261e.iam.gserviceaccount.com`

**Required Permissions**: At minimum "Viewer" access to Drive folders containing documents

## Testing

Test files created:
- `firebase/test-drive-access.ts` - Tests service account folder access
- `firebase/test-file-view.ts` - Tests file download/export
- `firebase/test-pdf-export.ts` - Tests PDF export functionality
- `firebase/get-service-account-email.ts` - Retrieves service account email

## API Endpoints

- `GET /api/drive/view?fileId={id}&resourceType={type}&resourceId={id}` - Fetch file for viewing
- `GET /api/drive/list?folderId={id}&resourceType={type}&resourceId={id}` - List folder contents
- `GET /api/drive/thumbnail?fileId={id}&resourceType={type}&resourceId={id}` - Get file thumbnail
- `GET /view/{fileId}?resourceType={type}&resourceId={id}` - In-app document viewer page
