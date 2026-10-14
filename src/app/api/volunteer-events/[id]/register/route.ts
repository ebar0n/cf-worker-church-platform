import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { calculateAge, parseDateOnly, todayInBogota } from '@/lib/age-classification';

// Max volunteers for the chosen service: undefined when the event does not
// offer it, null when it has no limit.
function serviceCapacity(event: any, selectedService: string): number | null | undefined {
  const services: string[] = event.services ? JSON.parse(event.services) : [];
  const maxCapacities: unknown[] = event.maxCapacities ? JSON.parse(event.maxCapacities) : [];
  const index = services.indexOf(selectedService);
  return index === -1 ? undefined : Number(maxCapacities[index]) || null;
}

function serviceFullResponse(selectedService: string, maxCapacity: number | null) {
  return NextResponse.json(
    {
      error: `El servicio "${selectedService}" ya está completado con ${maxCapacity} voluntarios. ¡Gracias a Dios! Por favor selecciona otro servicio disponible.`,
    },
    { status: 400 }
  );
}

function unknownServiceResponse() {
  return NextResponse.json(
    { error: 'El servicio seleccionado no existe en este evento' },
    { status: 400 }
  );
}

function registrationNotFoundResponse() {
  return NextResponse.json(
    { error: 'No encontramos un registro con este documento para este evento' },
    { status: 404 }
  );
}

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

    // Validate age (must be 16 or older) on Bogotá's calendar day
    if (calculateAge(parseDateOnly(memberBirthDate), todayInBogota()) < 16) {
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

    const maxCapacity = serviceCapacity(event, selectedService);
    if (maxCapacity === undefined) {
      return unknownServiceResponse();
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

    // Create volunteer registration. The capacity check lives in the same
    // statement: a separate COUNT then INSERT let parallel requests oversell
    // the service.
    const registration = await env.DB.prepare(
      `
      INSERT INTO VolunteerRegistration
      (volunteerEventId, memberDocumentID, memberId, selectedService, hasTransport, transportSlots, dietType, createdAt, updatedAt)
      SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?
      WHERE ? IS NULL
        OR (SELECT COUNT(*) FROM VolunteerRegistration WHERE volunteerEventId = ? AND selectedService = ?) < ?
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
        now,
        maxCapacity,
        eventId,
        selectedService,
        maxCapacity
      )
      .run();

    if (registration.meta.changes === 0) {
      return serviceFullResponse(selectedService, maxCapacity);
    }

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

    // Validate age (must be 16 or older) on Bogotá's calendar day
    if (calculateAge(parseDateOnly(memberBirthDate), todayInBogota()) < 16) {
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

    // Only an existing registration can be updated
    const currentRegistration = await env.DB.prepare(
      'SELECT 1 FROM VolunteerRegistration WHERE volunteerEventId = ? AND memberDocumentID = ?'
    )
      .bind(eventId, memberDocumentID)
      .first();

    if (!currentRegistration) {
      return registrationNotFoundResponse();
    }

    const maxCapacity = serviceCapacity(event, selectedService);
    if (maxCapacity === undefined) {
      return unknownServiceResponse();
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

    // Update volunteer registration. Moving to another service checks its
    // capacity in the same statement so parallel changes cannot oversell it.
    const update = await env.DB.prepare(
      `
      UPDATE VolunteerRegistration
      SET selectedService = ?, hasTransport = ?, transportSlots = ?, dietType = ?, updatedAt = ?
      WHERE volunteerEventId = ? AND memberDocumentID = ?
        AND (selectedService = ? OR ? IS NULL
          OR (SELECT COUNT(*) FROM VolunteerRegistration WHERE volunteerEventId = ? AND selectedService = ?) < ?)
    `
    )
      .bind(
        selectedService,
        hasTransport ? 1 : 0,
        transportSlots || null,
        dietType,
        now,
        eventId,
        memberDocumentID,
        selectedService,
        maxCapacity,
        eventId,
        selectedService,
        maxCapacity
      )
      .run();

    if (update.meta.changes === 0) {
      // The registration existed a moment ago, so the capacity guard is what
      // failed; an unlimited service has no guard, so it was deleted meanwhile
      return maxCapacity === null
        ? registrationNotFoundResponse()
        : serviceFullResponse(selectedService, maxCapacity);
    }

    return NextResponse.json({ message: 'Registration updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating volunteer registration:', error);
    return NextResponse.json({ error: 'Failed to update volunteer registration' }, { status: 500 });
  }
}
