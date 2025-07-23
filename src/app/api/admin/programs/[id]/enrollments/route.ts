import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = getCloudflareContext();
  const { id } = await params;
  const programId = parseInt(id);

  if (isNaN(programId)) {
    return NextResponse.json({ error: 'Invalid program ID' }, { status: 400 });
  }

  try {
    // Get enrollments with child and guardian information
    const enrollments = await env.DB.prepare(
      `
      SELECT
        e.id,
        e.programId,
        e.childId,
        e.createdAt,
        e.updatedAt,
        c.id as child_id,
        c.name as child_name,
        c.documentID as child_document,
        c.gender as child_gender,
        c.birthDate as child_birth_date
      FROM Enrollment e
      JOIN Child c ON e.childId = c.id
      WHERE e.programId = ?
      ORDER BY e.createdAt DESC
    `
    )
      .bind(programId)
      .all();

    // For each enrollment, get guardian information
    const transformedEnrollments = await Promise.all(
      enrollments.results.map(async (enrollment: any) => {
        // Get guardian information for this child
        const guardianQuery = await env.DB.prepare(
          `
          SELECT
            m.id,
            m.name,
            m.documentID,
            m.phone,
            m.email,
            cg.relationship
          FROM ChildGuardian cg
          JOIN Member m ON cg.memberId = m.id
          WHERE cg.childId = ?
          ORDER BY cg.relationship ASC
        `
        )
          .bind(enrollment.child_id)
          .all();

        const guardians = guardianQuery.results;

        return {
          id: enrollment.id,
          programId: enrollment.programId,
          childId: enrollment.childId,
          createdAt: enrollment.createdAt,
          updatedAt: enrollment.updatedAt,
          child: {
            id: enrollment.child_id,
            name: enrollment.child_name,
            documentID: enrollment.child_document,
            gender: enrollment.child_gender,
            birthDate: enrollment.child_birth_date,
            guardians: guardians,
          },
          member: null, // Programs are only for children
        };
      })
    );

    return NextResponse.json(transformedEnrollments);
  } catch (error) {
    console.error('Error fetching program enrollments:', error);
    return NextResponse.json({ error: 'Error fetching program enrollments' }, { status: 500 });
  }
}
