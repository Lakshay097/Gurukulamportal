import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
    NEXTAUTH_SECRET_LENGTH: process.env.NEXTAUTH_SECRET?.length || 0,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET',
  });
}
