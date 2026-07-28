import { google } from "googleapis";

const OWNER_CLIENT_ID = process.env.DRIVE_OWNER_CLIENT_ID!;
const OWNER_CLIENT_SECRET = process.env.DRIVE_OWNER_CLIENT_SECRET!;
const OWNER_REFRESH_TOKEN = process.env.DRIVE_OWNER_REFRESH_TOKEN!;

export function getOwnerDriveClient() {
  const oauth2Client = new google.auth.OAuth2(OWNER_CLIENT_ID, OWNER_CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: OWNER_REFRESH_TOKEN });
  return google.drive({ version: "v3", auth: oauth2Client });
}
