import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = getCloudflareContext();
  const { id } = await params;
  const memberId = parseInt(id);

  if (isNaN(memberId)) {
    return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 });
  }

  try {
    // Get children where this member is a guardian
    const children = await env.DB.prepare(
      `
      SELECT
        c.id,
        c.name,
        c.documentID,
        c.gender,
        c.birthDate,
        c.createdAt,
        c.updatedAt,
        cg.relationship
      FROM Child c
      JOIN ChildGuardian cg ON c.id = cg.childId
      WHERE cg.memberId = ?
      ORDER BY c.name ASC
    `
    )
      .bind(memberId)
      .all();

    return NextResponse.json(children.results);
  } catch (error) {
    console.error('Error fetching member children:', error);
    return NextResponse.json({ error: 'Error fetching member children' }, { status: 500 });
  }
}
