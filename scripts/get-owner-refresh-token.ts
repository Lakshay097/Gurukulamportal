// scripts/get-owner-refresh-token.ts
// Run once locally: npx tsx scripts/get-owner-refresh-token.ts
import { google } from "googleapis";
import http from "http";
import open from "open";
import url from "url";

const CLIENT_ID = process.env.DRIVE_OWNER_CLIENT_ID!;
const CLIENT_SECRET = process.env.DRIVE_OWNER_CLIENT_SECRET!;
const REDIRECT_URI = "http://localhost:3999/oauth2callback";

async function main() {
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // forces a refresh_token even on repeat runs
    scope: ["https://www.googleapis.com/auth/drive"],
  });

  const server = http.createServer(async (req, res) => {
    if (!req.url?.startsWith("/oauth2callback")) return;
    const qs = new url.URL(req.url, REDIRECT_URI).searchParams;
    const code = qs.get("code");
    res.end("Done — close this tab and return to the terminal.");
    server.close();
    if (!code) return console.error("No code returned.");

    const { tokens } = await oauth2Client.getToken(code);
    console.log("\nStore this as DRIVE_OWNER_REFRESH_TOKEN:\n");
    console.log(tokens.refresh_token);
  });

  server.listen(3999, () => {
    open(authUrl);
    console.log("Sign in as the Drive content owner...");
  });
}

main();
