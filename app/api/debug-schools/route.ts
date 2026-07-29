import { adminDb, useAdminSDK, db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    let schools: any[] = [];
    
    if (useAdminSDK && adminDb) {
      const snapshot = await adminDb.collection('schools').get();
      schools = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      const schoolsSnapshot = await getDocs(collection(db, 'schools'));
      schools = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    
    return NextResponse.json({ 
      count: schools.length,
      schools: schools.map(s => ({ 
        id: s.id, 
        slug: s.slug, 
        name: s.name,
        city: s.city,
        status: s.status,
        heroImageUrl: s.heroImageUrl
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
