import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const adminEmail = headersList.get('cf-access-authenticated-user-email') || '';

    return NextResponse.json({ email: adminEmail });
  } catch (error) {
    console.error('Error getting admin info:', error);
    return NextResponse.json({ error: 'Error getting admin info' }, { status: 500 });
  }
}
