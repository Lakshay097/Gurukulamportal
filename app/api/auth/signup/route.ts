import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Email/password signup has been removed. Please use Google OAuth to sign in.' },
    { status: 410 }
  );
}
