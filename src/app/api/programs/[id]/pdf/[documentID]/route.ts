import { NextResponse } from 'next/server';

// Printing is now managed from the administrative family roster.
export async function GET() {
  return NextResponse.json(
    {
      error:
        'La directiva del programa prepara e imprime la carpeta familiar desde administración.',
    },
    { status: 410, headers: { 'Cache-Control': 'private, no-store' } }
  );
}
