import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// GET /api/admin/courses/[id]/enrollments - Get all enrollments for a course
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = getCloudflareContext();
  const { id } = await params;

  try {
    // Check if course exists
    const course = await env.DB.prepare('SELECT id, title FROM Course WHERE id = ?')
      .bind(id)
      .first();

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get all enrollments for this course
    const enrollments = await env.DB.prepare(
      `
      SELECT *
      FROM CourseEnrollment
      WHERE courseId = ?
      ORDER BY createdAt DESC
    `
    )
      .bind(id)
      .all();

    const formattedEnrollments = enrollments.results.map((enrollment: any) => ({
      id: enrollment.id,
      courseId: enrollment.courseId,
      documentNumber: enrollment.documentNumber,
      fullName: enrollment.fullName,
      phone: enrollment.phone,
      birthDate: enrollment.birthDate,
      isMember: enrollment.isMember === 1,
      paymentProofUrl: enrollment.paymentProofUrl,
      status: enrollment.status,
      createdAt: enrollment.createdAt,
      updatedAt: enrollment.updatedAt,
    }));

    return NextResponse.json(formattedEnrollments);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
  }
}

// PUT /api/admin/courses/[id]/enrollments - Update enrollment status
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = getCloudflareContext();
  const { id } = await params;

  try {
    const body = (await request.json()) as {
      enrollmentId: number;
      status: 'pending' | 'confirmed' | 'rejected';
    };

    const { enrollmentId, status } = body;

    // Validate status
    if (!['pending', 'confirmed', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: pending, confirmed, or rejected' },
        { status: 400 }
      );
    }

    // Check if enrollment exists and belongs to this course
    const enrollment = await env.DB.prepare(
      'SELECT id, courseId FROM CourseEnrollment WHERE id = ? AND courseId = ?'
    )
      .bind(enrollmentId, id)
      .first();

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Update enrollment status
    await env.DB.prepare('UPDATE CourseEnrollment SET status = ?, updatedAt = ? WHERE id = ?')
      .bind(status, now, enrollmentId)
      .run();

    // Get updated enrollment
    const updatedEnrollment = await env.DB.prepare('SELECT * FROM CourseEnrollment WHERE id = ?')
      .bind(enrollmentId)
      .first();

    return NextResponse.json({
      id: updatedEnrollment!.id,
      courseId: updatedEnrollment!.courseId,
      documentNumber: updatedEnrollment!.documentNumber,
      fullName: updatedEnrollment!.fullName,
      phone: updatedEnrollment!.phone,
      birthDate: updatedEnrollment!.birthDate,
      isMember: (updatedEnrollment!.isMember as number) === 1,
      paymentProofUrl: updatedEnrollment!.paymentProofUrl,
      status: updatedEnrollment!.status,
      createdAt: updatedEnrollment!.createdAt,
      updatedAt: updatedEnrollment!.updatedAt,
    });
  } catch (error) {
    console.error('Error updating enrollment status:', error);
    return NextResponse.json({ error: 'Failed to update enrollment status' }, { status: 500 });
  }
}
