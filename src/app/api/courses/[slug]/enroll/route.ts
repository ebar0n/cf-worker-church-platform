import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Turnstile verification function
async function verifyTurnstile(token: string, secretKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data = (await response.json()) as { success: boolean; 'error-codes'?: string[] };
    
    if (!data.success && data['error-codes']?.includes('timeout-or-duplicate')) {
      throw new Error('TURNSTILE_TIMEOUT_OR_DUPLICATE');
    }
    
    return data.success;
  } catch (error) {
    if (error instanceof Error && error.message === 'TURNSTILE_TIMEOUT_OR_DUPLICATE') {
      throw error;
    }
    console.error('Turnstile verification error:', error);
    return false;
  }
}

// POST /api/courses/[slug]/enroll - Create course enrollment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { env } = getCloudflareContext();
  const { slug } = await params;

  try {
    const body = (await request.json()) as {
      token: string;
      documentNumber: string;
      fullName: string;
      phone: string;
      birthDate: string;
      isMember?: boolean;
      paymentProofUrl?: string;
    };

    const { token, documentNumber, fullName, phone, birthDate, isMember, paymentProofUrl } = body;

    // Validate required fields
    if (!token || !documentNumber || !fullName || !phone || !birthDate) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Validate age (must be 18+)
    const birthDateObj = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    if (age < 18) {
      return NextResponse.json(
        { error: 'Debes ser mayor de 18 años para inscribirte' },
        { status: 400 }
      );
    }

    // Verify Turnstile token
    // Check if we're in development (localhost) - use test secret key
    const host = request.headers.get('host') || '';
    const isDevelopment = host.includes('localhost') || host.includes('127.0.0.1');
    const TURNSTILE_TEST_SECRET_KEY = '1x0000000000000000000000000000000AA';
    
    const turnstileSecretKey = isDevelopment ? TURNSTILE_TEST_SECRET_KEY : env.TURNSTILE_SECRET_KEY;
    if (!turnstileSecretKey) {
      console.error('TURNSTILE_SECRET_KEY not configured');
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    try {
      const isValid = await verifyTurnstile(token, turnstileSecretKey);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Verificación de seguridad fallida. Por favor, intenta de nuevo.' },
          { status: 400 }
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'TURNSTILE_TIMEOUT_OR_DUPLICATE') {
        return NextResponse.json(
          { 
            error: 'La verificación de seguridad ha expirado. Por favor, recarga la página.',
            code: 'TURNSTILE_TIMEOUT_OR_DUPLICATE'
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Get course by slug with enrollment counts split by member status
    const course = await env.DB.prepare(
      `
      SELECT
        c.*,
        COUNT(ce.id) as enrollmentCount,
        SUM(CASE WHEN ce.isMember = 1 THEN 1 ELSE 0 END) as memberCount,
        SUM(CASE WHEN ce.isMember = 0 OR ce.isMember IS NULL THEN 1 ELSE 0 END) as nonMemberCount
      FROM Course c
      LEFT JOIN CourseEnrollment ce ON c.id = ce.courseId
      WHERE c.slug = ? AND c.isActive = 1
      GROUP BY c.id
    `
    )
      .bind(slug)
      .first();

    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    // Check capacity with 50/50 split between members and non-members
    if (course.capacity) {
      const capacity = course.capacity as number;
      const memberCount = (course.memberCount as number) || 0;
      const nonMemberCount = (course.nonMemberCount as number) || 0;
      const totalCount = (course.enrollmentCount as number) || 0;

      // Calculate quota for each group (50% each, extra spot goes to non-members if odd)
      const memberQuota = Math.floor(capacity / 2);
      const nonMemberQuota = capacity - memberQuota;

      // Check if course is completely full
      if (totalCount >= capacity) {
        return NextResponse.json(
          { error: 'El curso ha alcanzado su capacidad máxima' },
          { status: 400 }
        );
      }

      // Check quota based on member status
      if (isMember && memberCount >= memberQuota) {
        // Check if there's space in non-member quota (overflow)
        if (nonMemberCount < nonMemberQuota) {
          // Allow member to take non-member spot (they can still enroll)
        } else {
          return NextResponse.json(
            { error: `Los cupos para miembros de la iglesia están agotados (${memberQuota}/${memberQuota}). Por favor, contacta al organizador.` },
            { status: 400 }
          );
        }
      }

      if (!isMember && nonMemberCount >= nonMemberQuota) {
        // Check if there's space in member quota (overflow)
        if (memberCount < memberQuota) {
          // Allow non-member to take member spot (they can still enroll)
        } else {
          return NextResponse.json(
            { error: `Los cupos para visitantes están agotados (${nonMemberQuota}/${nonMemberQuota}). Por favor, contacta al organizador.` },
            { status: 400 }
          );
        }
      }
    }

    // Check if cost > 0 requires payment proof
    if ((course.cost as number) > 0 && !paymentProofUrl) {
      return NextResponse.json(
        { error: 'Se requiere comprobante de pago para este curso' },
        { status: 400 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await env.DB.prepare(
      'SELECT id FROM CourseEnrollment WHERE courseId = ? AND documentNumber = ?'
    )
      .bind(course.id, documentNumber)
      .first();

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Ya estás inscrito en este curso' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Create enrollment
    const result = await env.DB.prepare(
      `INSERT INTO CourseEnrollment (courseId, documentNumber, fullName, phone, birthDate, isMember, paymentProofUrl, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
    )
      .bind(
        course.id,
        documentNumber,
        fullName,
        phone,
        birthDate,
        isMember ? 1 : 0,
        paymentProofUrl || null,
        now,
        now
      )
      .run();

    // Get the newly created enrollment
    const newEnrollment = await env.DB.prepare('SELECT * FROM CourseEnrollment WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first();

    return NextResponse.json(
      {
        success: true,
        message: 'Inscripción registrada exitosamente',
        enrollment: {
          id: newEnrollment!.id,
          courseId: newEnrollment!.courseId,
          fullName: newEnrollment!.fullName,
          status: newEnrollment!.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating enrollment:', error);
    return NextResponse.json({ error: 'Error al procesar la inscripción' }, { status: 500 });
  }
}
