import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = getCloudflareContext();

  const { id } = await params;
  const idNumber = parseInt(id);

  if (isNaN(idNumber)) {
    return NextResponse.json({ error: 'ID de anuncio inválido' }, { status: 400 });
  }

  const announcement = await env.DB.prepare('SELECT * FROM Announcement WHERE id = ?')
    .bind(idNumber)
    .first();

  if (!announcement) {
    return NextResponse.json({ error: 'Anuncio no encontrado' }, { status: 404 });
  }

  return NextResponse.json(announcement);
}
