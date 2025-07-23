import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(request: NextRequest) {
  const { env } = getCloudflareContext();

  try {
    // Get all children with their guardians
    const children = await env.DB.prepare(
      `
      SELECT
        c.id,
        c.name,
        c.documentID,
        c.gender,
        c.birthDate,
        c.createdAt,
        c.updatedAt
      FROM Child c
      ORDER BY c.name ASC
    `
    ).all();

    // For each child, get their guardians
    const childrenWithGuardians = await Promise.all(
      children.results.map(async (child: any) => {
        const guardians = await env.DB.prepare(
          `
          SELECT
            m.id,
            m.name,
            m.phone,
            cg.relationship
          FROM ChildGuardian cg
          JOIN Member m ON cg.memberId = m.id
          WHERE cg.childId = ?
          ORDER BY cg.relationship ASC
        `
        )
          .bind(child.id)
          .all();

        return {
          ...child,
          guardians: guardians.results,
        };
      })
    );

    return NextResponse.json(childrenWithGuardians);
  } catch (error) {
    console.error('Error fetching children:', error);
    return NextResponse.json({ error: 'Error fetching children' }, { status: 500 });
  }
}
