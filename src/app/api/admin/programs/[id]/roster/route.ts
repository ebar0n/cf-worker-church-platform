import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getProgramRoster } from '@/lib/program-roster';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const programId = Number((await params).id);
  if (!Number.isSafeInteger(programId) || programId < 1) {
    return NextResponse.json({ error: 'Programa inválido' }, { status: 400 });
  }
  try {
    const { env } = getCloudflareContext();
    const roster = await getProgramRoster(env.DB, programId);
    if (!roster) return NextResponse.json({ error: 'Programa no encontrado' }, { status: 404 });
    return NextResponse.json(roster);
  } catch (error) {
    console.error('Error fetching program roster:', error);
    return NextResponse.json({ error: 'No se pudo cargar el programa' }, { status: 500 });
  }
}
