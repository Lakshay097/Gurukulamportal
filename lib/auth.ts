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
      
      console.log('[Auth signIn] Email:', email);
      
      if (!email) {
        console.log('[Auth signIn] Sign in rejected - no email');
        return false;
      }
      
      // Check if email belongs to pw.live domain for internal-staff assignment
      const isInternalStaff = email.endsWith('@pw.live');
      console.log('[Auth signIn] Is internal-staff (pw.live domain):', isInternalStaff);
      
      // Create user in Firebase on first login and fetch group keys
      console.log('[Auth signIn] Calling ensureUser...');
      try {
        const userId = await ensureUser(email, user.name, user.image, isInternalStaff);
        console.log('[Auth signIn] ensureUser succeeded');
        
        // Fetch user's groups and group keys
        let userData: any;
        if (useAdminSDK === true && adminDb) {
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
                if (useAdminSDK === true && adminDb) {
                  const groupDoc = await adminDb.collection('groups').doc(groupId).get();
                  return groupDoc.exists ? groupDoc.data() : null;
                } else {
                  const groupDocSnap = await getDoc(doc(db, 'groups', groupId));
                  return groupDocSnap.exists() ? groupDocSnap.data() : null;
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
          
          // Check if user is in admin-central allow-list
          const isAdmin = await isAdminCentralUser(email);
          if (isAdmin && !groupKeysList.includes('admin-central')) {
            // Add admin-central group if not already present
            if (useAdminSDK === true && adminDb) {
              const adminGroupSnapshot = await adminDb.collection('groups').where('key', '==', 'admin-central').get();
              if (!adminGroupSnapshot.empty) {
                const adminGroupId = adminGroupSnapshot.docs[0].id;
                await adminDb.collection('users').doc(userId).update({
                  groups: [...groupIds, adminGroupId]
                });
                groupKeysList.push('admin-central');
              }
            } else {
              const adminGroupQuery = query(collection(db, 'groups'), where('key', '==', 'admin-central'));
              const adminGroupSnapshot = await getDocs(adminGroupQuery);
              if (!adminGroupSnapshot.empty) {
                const adminGroupId = adminGroupSnapshot.docs[0].id;
                await setDoc(doc(db, 'users', userId), {
                  groups: [...groupIds, adminGroupId]
                }, { merge: true });
                groupKeysList.push('admin-central');
              }
            }
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
export async function ensureUser(email: string, name?: string, image?: string, isInternalStaff: boolean = false) {
  if (useAdminSDK === true && adminDb) {
    // Use Admin SDK for server-side writes (bypasses security rules)
    const snapshot = await adminDb.collection('users').where('email', '==', email).get();
    
    if (snapshot.empty) {
      // Only assign internal-staff group if email is from pw.live domain
      let groups: string[] = [];
      if (isInternalStaff) {
        const groupSnapshot = await adminDb.collection('groups').where('key', '==', 'internal-staff').get();
        const internalStaffGroupId = groupSnapshot.empty ? null : groupSnapshot.docs[0].id;
        if (internalStaffGroupId) {
          groups = [internalStaffGroupId];
        }
      }
      
      const newUserRef = adminDb.collection('users').doc();
      await newUserRef.set({
        email,
        name: name || null,
        image: image || null,
        groups,
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
      // Only assign internal-staff group if email is from pw.live domain
      let groups: string[] = [];
      if (isInternalStaff) {
        const groupQuery = query(collection(db, 'groups'), where('key', '==', 'internal-staff'));
        const groupSnapshot = await getDocs(groupQuery);
        const internalStaffGroupId = groupSnapshot.empty ? null : groupSnapshot.docs[0].id;
        if (internalStaffGroupId) {
          groups = [internalStaffGroupId];
        }
      }
      
      // Create new user with groups based on domain
      const newUserRef = doc(collection(db, 'users'));
      await setDoc(newUserRef, {
        email,
        name: name || null,
        image: image || null,
        groups,
        createdAt: new Date(),
      });
      return newUserRef.id;
    }
    
    return userSnapshot.docs[0].id;
  }
}

// Helper function to check if user is in admin-central allow-list
async function isAdminCentralUser(email: string): Promise<boolean> {
  if (useAdminSDK === true && adminDb) {
    const adminDoc = await adminDb.collection('admins').doc(email).get();
    return adminDoc.exists;
  } else {
    const adminDoc = await getDoc(doc(db, 'admins', email));
    return adminDoc.exists();
  }
}

