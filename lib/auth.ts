import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { db, adminDb, useAdminSDK } from './firebase';
import { collection, doc, getDoc, setDoc, query, where, getDocs } from 'firebase/firestore';

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account }: any) {
      if (account?.provider !== 'google') return false;
      
      const email = user.email;
      const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN;
      
      console.log('[Auth signIn] Email:', email);
      console.log('[Auth signIn] Allowed domain:', allowedDomain);
      console.log('[Auth signIn] Email ends with domain:', email?.endsWith(`@${allowedDomain}`));
      
      if (!email || !allowedDomain || !email.endsWith(`@${allowedDomain}`)) {
        console.log('[Auth signIn] Sign in rejected');
        return false;
      }
      
      // Create user in Firebase on first login with zero groups
      console.log('[Auth signIn] Calling ensureUser...');
      try {
        await ensureUser(email, user.name, user.image);
        console.log('[Auth signIn] ensureUser succeeded');
      } catch (error) {
        console.error('[Auth signIn] ensureUser failed:', error);
        return false;
      }
      
      console.log('[Auth signIn] Sign in approved');
      return true;
    },
    async session({ session, user }: any) {
      console.log('[Auth session] Session:', session);
      console.log('[Auth session] User email:', session.user?.email);
      
      if (session.user?.email) {
        // Fetch user from Firebase to get their groups
        let userData: any;
        
        if (useAdminSDK && adminDb) {
          // Use Admin SDK to bypass security rules
          console.log('[Auth session] Using Admin SDK to fetch user');
          const snapshot = await adminDb.collection('users').where('email', '==', session.user.email).get();
          console.log('[Auth session] User snapshot empty:', snapshot.empty);
          if (!snapshot.empty) {
            userData = snapshot.docs[0].data();
            console.log('[Auth session] User data:', userData);
          }
        } else {
          // Fallback to Client SDK
          console.log('[Auth session] Using Client SDK to fetch user');
          const usersQuery = query(
            collection(db, 'users'),
            where('email', '==', session.user.email)
          );
          const userSnapshot = await getDocs(usersQuery);
          console.log('[Auth session] User snapshot empty:', userSnapshot.empty);
          
          if (!userSnapshot.empty) {
            userData = userSnapshot.docs[0].data();
            console.log('[Auth session] User data:', userData);
          }
        }
        
        if (userData) {
          const groupIds = userData.groups || [];
          console.log('[Auth session] Group IDs:', groupIds);
          
          // Fetch group keys from groups collection
          const groupKeysList: string[] = [];
          for (const groupId of groupIds) {
            console.log('[Auth session] Fetching group with ID:', groupId);
            let groupData: any;
            if (useAdminSDK && adminDb) {
              const groupDoc = await adminDb.collection('groups').doc(groupId).get();
              console.log('[Auth session] Group doc exists:', groupDoc.exists);
              if (groupDoc.exists) {
                groupData = groupDoc.data();
                console.log('[Auth session] Group data:', groupData);
              }
            } else {
              const groupDoc = await getDoc(doc(db, 'groups', groupId));
              console.log('[Auth session] Group doc exists:', groupDoc.exists());
              if (groupDoc.exists()) {
                groupData = groupDoc.data();
                console.log('[Auth session] Group data:', groupData);
              }
            }
            if (groupData) {
              groupKeysList.push(groupData.key);
            }
          }
          
          console.log('[Auth session] Group keys list:', groupKeysList);
          (session as any).userGroupKeys = groupKeysList;
        } else {
          console.log('[Auth session] No user data found, setting empty group keys');
          (session as any).userGroupKeys = [];
        }
      } else {
        console.log('[Auth session] No email in session');
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

