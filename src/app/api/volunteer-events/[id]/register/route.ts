import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { verifyTurnstileToken } from '@/lib/turnstile';

// POST - Register as a volunteer for an event
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = getCloudflareContext();
  const { id: eventId } = await params;

  try {
    const body = (await request.json()) as {
      memberDocumentID: string;
      memberName: string;
      memberPhone: string;
      memberBirthDate?: string | null;
      selectedService: string;
      hasTransport: boolean;
      transportSlots?: number | null;
      dietType: string;
      turnstileToken?: string;
    };

    const {
      memberDocumentID,
      memberName,
      memberPhone,
      memberBirthDate,
      selectedService,
      hasTransport,
      transportSlots,
      dietType,
      turnstileToken,
    } = body;

    // Verify Turnstile token
    if (!turnstileToken) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
    }

    const secretKey = env.TURNSTILE_SECRET_KEY || '';
    const verification = await verifyTurnstileToken(turnstileToken, secretKey);

    if (!verification.success) {
      return NextResponse.json(
        { error: 'Invalid security verification. Please try again.' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!memberDocumentID || !memberName || !memberPhone || !memberBirthDate || !selectedService) {
      return NextResponse.json(
        { error: 'Document, name, phone, birth date, and service are required' },
        { status: 400 }
      );
    }

    // Validate age (must be 16 or older)
    const birthDate = new Date(memberBirthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (actualAge < 16) {
      return NextResponse.json(
        { error: 'Volunteer must be at least 16 years old' },
        { status: 400 }
      );
    }

    // Check if event exists and is active
    const event = await env.DB.prepare('SELECT * FROM VolunteerEvent WHERE id = ? AND isActive = 1')
      .bind(eventId)
      .first();

    if (!event) {
      return NextResponse.json({ error: 'Event not found or inactive' }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Check if member exists
    let member = await env.DB.prepare('SELECT * FROM Member WHERE documentID = ?')
      .bind(memberDocumentID)
      .first();

    let memberId: number | null = null;

    if (member) {
      // Update member info if it exists
      await env.DB.prepare(
        `
        UPDATE Member
        SET name = ?, phone = ?, birthDate = ?, updatedAt = ?
        WHERE documentID = ?
      `
      )
        .bind(memberName, memberPhone, memberBirthDate || null, now, memberDocumentID)
        .run();

      memberId = (member as any).id;
    } else {
      // Create new member
      const result = await env.DB.prepare(
        `
        INSERT INTO Member (documentID, name, phone, birthDate, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `
      )
        .bind(memberDocumentID, memberName, memberPhone, memberBirthDate || null, now, now)
        .run();

      memberId = result.meta.last_row_id as number;
    }

    // Check if already registered
    const existingRegistration = await env.DB.prepare(
      'SELECT * FROM VolunteerRegistration WHERE volunteerEventId = ? AND memberDocumentID = ?'
    )
      .bind(eventId, memberDocumentID)
      .first();

    if (existingRegistration) {
      return NextResponse.json({ error: 'Ya estás registrado para este evento' }, { status: 400 });
    }

    // Create volunteer registration
    const registration = await env.DB.prepare(
      `
      INSERT INTO VolunteerRegistration
      (volunteerEventId, memberDocumentID, memberId, selectedService, hasTransport, transportSlots, dietType, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
      .bind(
        eventId,
        memberDocumentID,
        memberId,
        selectedService,
        hasTransport ? 1 : 0,
        transportSlots || null,
        dietType,
        now,
        now
      )
      .run();

    return NextResponse.json(
      { message: 'Registration successful', id: registration.meta.last_row_id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error registering volunteer:', error);
    return NextResponse.json({ error: 'Failed to register volunteer' }, { status: 500 });
  }
}

// PUT - Update existing volunteer registration
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = getCloudflareContext();
  const { id: eventId } = await params;

  try {
    const body = (await request.json()) as {
      memberDocumentID: string;
      memberName: string;
      memberPhone: string;
      memberBirthDate?: string | null;
      selectedService: string;
      hasTransport: boolean;
      transportSlots?: number | null;
      dietType: string;
      turnstileToken?: string;
    };

    const {
      memberDocumentID,
      memberName,
      memberPhone,
      memberBirthDate,
      selectedService,
      hasTransport,
      transportSlots,
      dietType,
      turnstileToken,
    } = body;

    // Verify Turnstile token
    if (!turnstileToken) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
    }

    const secretKey = env.TURNSTILE_SECRET_KEY || '';
    const verification = await verifyTurnstileToken(turnstileToken, secretKey);

    if (!verification.success) {
      return NextResponse.json(
        { error: 'Invalid security verification. Please try again.' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!memberDocumentID || !memberName || !memberPhone || !memberBirthDate || !selectedService) {
      return NextResponse.json(
        { error: 'Document, name, phone, birth date, and service are required' },
        { status: 400 }
      );
    }

    // Validate age (must be 16 or older)
    const birthDate = new Date(memberBirthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (actualAge < 16) {
      return NextResponse.json(
        { error: 'Volunteer must be at least 16 years old' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update member info
    let member = await env.DB.prepare('SELECT * FROM Member WHERE documentID = ?')
      .bind(memberDocumentID)
      .first();

    if (member) {
      await env.DB.prepare(
        `
        UPDATE Member
        SET name = ?, phone = ?, birthDate = ?, updatedAt = ?
        WHERE documentID = ?
      `
      )
        .bind(memberName, memberPhone, memberBirthDate || null, now, memberDocumentID)
        .run();
    }

    // Update volunteer registration
    await env.DB.prepare(
      `
      UPDATE VolunteerRegistration
      SET selectedService = ?, hasTransport = ?, transportSlots = ?, dietType = ?, updatedAt = ?
      WHERE volunteerEventId = ? AND memberDocumentID = ?
    `
    )
      .bind(
        selectedService,
        hasTransport ? 1 : 0,
        transportSlots || null,
        dietType,
        now,
        eventId,
        memberDocumentID
      )
      .run();

    return NextResponse.json({ message: 'Registration updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating volunteer registration:', error);
    return NextResponse.json({ error: 'Failed to update volunteer registration' }, { status: 500 });
  }
}
