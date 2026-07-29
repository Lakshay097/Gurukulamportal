import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { db, adminDb, useAdminSDK } from './firebase';
import { collection, doc, getDoc, setDoc, query, where, getDocs } from 'firebase/firestore';

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
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async jwt({ token, user, account, trigger, session }: any) {
      // Add userGroupKeys to token on initial sign in
      if (user) {
        token.userGroupKeys = user.userGroupKeys || [];
      }
      
      // Store Google access token for Drive API access
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      
      // Update token when session is updated
      if (trigger === 'update' && session?.userGroupKeys) {
        token.userGroupKeys = session.userGroupKeys;
      }
      
      return token;
    },
    async signIn({ user, account }: any) {
      if (account?.provider !== 'google') return false;
      
      const email = user.email;
      const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN;
      
      console.log('[Auth signIn] Email:', email);
      console.log('[Auth signIn] Allowed domain:', allowedDomain);
      console.log('[Auth signIn] Email ends with domain:', email?.endsWith(`@${allowedDomain}`));
      
      // Allow both custom domain and gmail.com addresses
      const isValidDomain = email?.endsWith(`@${allowedDomain}`) || email?.endsWith('@gmail.com');
      
      if (!email || !isValidDomain) {
        console.log('[Auth signIn] Sign in rejected');
        return false;
      }
      
      // Create user in Firebase on first login with zero groups and fetch group keys
      console.log('[Auth signIn] Calling ensureUser...');
      try {
        const userId = await ensureUser(email, user.name, user.image);
        console.log('[Auth signIn] ensureUser succeeded');
        
        // Fetch user's groups and group keys
        let userData: any;
        if (useAdminSDK && adminDb) {
          const snapshot = await adminDb.collection('users').doc(userId).get();
          userData = snapshot.exists ? snapshot.data() : null;
        } else {
          const userDoc = await getDoc(doc(db, 'users', userId));
          userData = userDoc.exists() ? userDoc.data() : null;
        }
        
        if (userData?.groups) {
          const groupIds = userData.groups;
          const groupKeysList: string[] = [];
          
          if (groupIds.length > 0) {
            const groupPromises = groupIds.map(async (groupId: string) => {
              try {
                if (useAdminSDK && adminDb) {
                  const groupDoc = await adminDb.collection('groups').doc(groupId).get();
                  return groupDoc.exists ? groupDoc.data() : null;
                } else {
                  const groupDoc = await getDoc(doc(db, 'groups', groupId));
                  return groupDoc.exists() ? groupDoc.data() : null;
                }
              } catch (error) {
                console.error('[Auth signIn] Error fetching group:', groupId, error);
                return null;
              }
            });
            
            const groupResults = await Promise.all(groupPromises);
            groupResults.forEach((groupData) => {
              if (groupData?.key) {
                groupKeysList.push(groupData.key);
              }
            });
          }
          
          // Add userGroupKeys to user object for JWT callback
          (user as any).userGroupKeys = groupKeysList;
          console.log('[Auth signIn] User group keys:', groupKeysList);
        }
      } catch (error) {
        console.error('[Auth signIn] ensureUser failed:', error);
        return false;
      }
      
      console.log('[Auth signIn] Sign in approved');
      return true;
    },
    async session({ session, token }: any) {
      // Pass userGroupKeys from JWT token to session
      if (token?.userGroupKeys) {
        (session as any).userGroupKeys = token.userGroupKeys;
      } else {
        (session as any).userGroupKeys = [];
      }
      
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
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
};

export const handler = NextAuth(authOptions);

// Helper function to create or update user in Firebase
export async function ensureUser(email: string, name?: string, image?: string) {
  if (useAdminSDK && adminDb) {
    // Use Admin SDK for server-side writes (bypasses security rules)
    const snapshot = await adminDb.collection('users').where('email', '==', email).get();
    
    if (snapshot.empty) {
      // Find internal-staff group ID
      const groupSnapshot = await adminDb.collection('groups').where('key', '==', 'internal-staff').get();
      const internalStaffGroupId = groupSnapshot.empty ? null : groupSnapshot.docs[0].id;
      
      const newUserRef = adminDb.collection('users').doc();
      await newUserRef.set({
        email,
        name: name || null,
        image: image || null,
        groups: internalStaffGroupId ? [internalStaffGroupId] : [],
        createdAt: new Date(),
      });
      return newUserRef.id;
    }
    
    return snapshot.docs[0].id;
  } else {
    // Fallback to Client SDK
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', email)
    );
    const userSnapshot = await getDocs(usersQuery);
    
    if (userSnapshot.empty) {
      // Find internal-staff group ID
      const groupQuery = query(collection(db, 'groups'), where('key', '==', 'internal-staff'));
      const groupSnapshot = await getDocs(groupQuery);
      const internalStaffGroupId = groupSnapshot.empty ? null : groupSnapshot.docs[0].id;
      
      // Create new user with internal-staff group
      const newUserRef = doc(collection(db, 'users'));
      await setDoc(newUserRef, {
        email,
        name: name || null,
        image: image || null,
        groups: internalStaffGroupId ? [internalStaffGroupId] : [],
        createdAt: new Date(),
      });
      return newUserRef.id;
    }
    
    return userSnapshot.docs[0].id;
  }
}

