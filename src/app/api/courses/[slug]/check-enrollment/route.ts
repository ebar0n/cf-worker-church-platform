import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// POST /api/courses/[slug]/check-enrollment - Check if user is already enrolled
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { env } = getCloudflareContext();
  const { slug } = await params;

  try {
    const body = (await request.json()) as { documentNumber: string };
    const { documentNumber } = body;

    if (!documentNumber) {
      return NextResponse.json({ error: 'Número de documento requerido' }, { status: 400 });
    }

    // Get course by slug
    const course = await env.DB.prepare(
      'SELECT id, title FROM Course WHERE slug = ? AND isActive = 1'
    )
      .bind(slug)
      .first();

    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    // Check if enrollment exists
    const enrollment = await env.DB.prepare(
      'SELECT id, fullName, phone, status, createdAt FROM CourseEnrollment WHERE courseId = ? AND documentNumber = ?'
    )
      .bind(course.id, documentNumber)
      .first();

    if (enrollment) {
      // This endpoint is reachable without captcha, so personal data is
      // masked: enough for the owner to recognize themselves, useless for
      // someone enumerating document numbers.
      const fullName = (enrollment.fullName as string) || '';
      const phone = (enrollment.phone as string) || '';
      const [firstName, ...rest] = fullName.split(' ');
      const maskedName = [firstName, ...rest.map((part) => `${part.charAt(0)}.`)].join(' ');
      const maskedPhone = phone ? `***${phone.slice(-4)}` : '';

      return NextResponse.json({
        found: true,
        enrollment: {
          id: enrollment.id,
          fullName: maskedName,
          phone: maskedPhone,
          status: enrollment.status,
          createdAt: enrollment.createdAt,
        },
      });
    }

    return NextResponse.json({ found: false });
  } catch (error) {
    console.error('Error checking enrollment:', error);
    return NextResponse.json({ error: 'Error al verificar inscripción' }, { status: 500 });
  }
}
