import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const schoolsRef = collection(db, 'schools');
    const q = query(schoolsRef, where('slug', '==', params.slug));
    const snapshot = await getDocs(q);
    
    return NextResponse.json({ 
      slug: params.slug,
      count: snapshot.size,
      found: !snapshot.empty,
      schools: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
