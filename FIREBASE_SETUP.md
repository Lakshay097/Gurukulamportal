# Firebase Setup for Phase 4

The Phase 4 schools pages require Firebase Firestore to be properly configured. If you're seeing "Missing or insufficient permissions" errors, you need to set up Firebase.

## Option 1: Use Firebase Admin SDK (Recommended for server-side)

1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate a new private key
3. Copy the JSON content
4. Encode it to base64 (e.g., using `base64 -w 0 service-account.json` on Linux/Mac or an online converter)
5. Add to your `.env.local`:
   ```
   GOOGLE_SERVICE_ACCOUNT_KEY=<base64-encoded-json>
   ```

## Option 2: Deploy Firestore Security Rules

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init` (select Firestore)
4. Deploy rules: `firebase deploy --only firestore:rules`

The `firestore.rules` file in this project allows read access for development.

## Verification

After setup, the schools directory should load at `/schools` and all 12 school detail pages should work at `/schools/[slug]`.
