import { drive_v3 } from "googleapis";
import { getOwnerDriveClient } from "./drive-owner-auth";

const SERVICE_ACCOUNT_EMAIL = process.env.SERVICE_ACCOUNT_EMAIL!;
const ROOT_DRIVE_FOLDER_ID = process.env.ROOT_DRIVE_FOLDER_ID!;

interface SyncResult {
  scanned: number;
  alreadyShared: number;
  newlyShared: number;
  errors: { fileId: string; name: string; error: string }[];
}

async function hasServiceAccountPermission(drive: drive_v3.Drive, fileId: string) {
  const { data } = await drive.permissions.list({
    fileId,
    fields: "permissions(emailAddress,role)",
    supportsAllDrives: true,
  });
  return (data.permissions ?? []).some(
    (p) => p.emailAddress?.toLowerCase() === SERVICE_ACCOUNT_EMAIL.toLowerCase()
  );
}

async function shareWithServiceAccount(drive: drive_v3.Drive, fileId: string) {
  await drive.permissions.create({
    fileId,
    supportsAllDrives: true,
    sendNotificationEmail: false,
    requestBody: { type: "user", role: "reader", emailAddress: SERVICE_ACCOUNT_EMAIL },
  });
}

/**
 * Walks the whole tree under ROOT_DRIVE_FOLDER_ID with the owner's
 * OAuth credentials and makes sure the service account has Viewer
 * access to everything it finds. Run this on a schedule.
 */
export async function syncServiceAccountPermissions(
  rootFolderId: string = ROOT_DRIVE_FOLDER_ID
): Promise<SyncResult> {
  const drive = getOwnerDriveClient();
  const result: SyncResult = { scanned: 0, alreadyShared: 0, newlyShared: 0, errors: [] };
  const queue: string[] = [rootFolderId];

  while (queue.length > 0) {
    const folderId = queue.shift()!;
    let pageToken: string | undefined;

    do {
      const { data } = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: "nextPageToken, files(id, name, mimeType)",
        pageSize: 200,
        pageToken,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      for (const file of data.files ?? []) {
        if (!file.id) continue;
        result.scanned++;

        try {
          const already = await hasServiceAccountPermission(drive, file.id);
          if (already) result.alreadyShared++;
          else {
            await shareWithServiceAccount(drive, file.id);
            result.newlyShared++;
          }
        } catch (err: any) {
          result.errors.push({ fileId: file.id, name: file.name ?? "unknown", error: err?.message ?? String(err) });
        }

        if (file.mimeType === "application/vnd.google-apps.folder") queue.push(file.id);
      }

      pageToken = data.nextPageToken ?? undefined;
    } while (pageToken);
  }

  return result;
}
