import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { env } = getCloudflareContext();

  const id = parseInt(params.id);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'ID de anuncio inválido' }, { status: 400 });
  }

  const announcement = await env.DB.prepare('SELECT * FROM Announcement WHERE id = ?')
    .bind(id)
    .first();

  if (!announcement) {
    return NextResponse.json({ error: 'Anuncio no encontrado' }, { status: 404 });
  }

  return NextResponse.json(announcement);
}
