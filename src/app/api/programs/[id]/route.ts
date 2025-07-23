import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// GET /api/programs/[id] - Get specific program
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = getCloudflareContext();

  try {
    const { id } = await params;
    const programId = parseInt(id);

    if (isNaN(programId)) {
      return NextResponse.json({ error: 'Invalid program ID' }, { status: 400 });
    }

    // Get the specific program
    const program = (await env.DB.prepare('SELECT * FROM Program WHERE id = ? AND isActive = 1')
      .bind(programId)
      .first()) as any;

    if (!program) {
      return NextResponse.json({ error: 'Program not found or inactive' }, { status: 404 });
    }

    const formattedProgram = {
      id: program.id,
      title: program.title,
      department: program.department,
      content: program.content,
      isActive: program.isActive === 1,
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
    };

    return NextResponse.json(formattedProgram);
  } catch (error) {
    console.error('Error fetching program:', error);
    return NextResponse.json({ error: 'Failed to fetch program' }, { status: 500 });
  }
}
