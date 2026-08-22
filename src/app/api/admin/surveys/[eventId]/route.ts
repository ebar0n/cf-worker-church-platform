import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { SURVEY_FIELDS, normalizeSurveyPayload } from '@/lib/health-survey';

// GET /api/admin/surveys/[eventId] - Health surveys captured for the event,
// newest first. This path is a sibling of /api/admin/* on purpose: it gets its
// own Cloudflare Access application so volunteers can reach it without being
// granted the rest of the admin (see specs/health-survey.md).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { env } = getCloudflareContext();
  const { eventId: eventIdParam } = await params;

  try {
    const eventId = parseInt(eventIdParam);
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Evento inválido' }, { status: 400 });
    }

    const event = await env.DB.prepare('SELECT id, title FROM VolunteerEvent WHERE id = ?')
      .bind(eventId)
      .first();
    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    const surveys = await env.DB.prepare(
      // capturedAt (device time) is the real order of a jornada, and it is the
      // indexed one; id breaks ties within the same second.
      'SELECT * FROM HealthSurvey WHERE volunteerEventId = ? ORDER BY capturedAt DESC, id DESC'
    )
      .bind(eventId)
      .all();

    return NextResponse.json({ event, surveys: surveys.results });
  } catch (error) {
    console.error('Error fetching health surveys:', error);
    return NextResponse.json({ error: 'Failed to fetch health surveys' }, { status: 500 });
  }
}

// POST /api/admin/surveys/[eventId] - Register a new survey.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { env } = getCloudflareContext();
  const { eventId: eventIdParam } = await params;

  try {
    const eventId = parseInt(eventIdParam);
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Evento inválido' }, { status: 400 });
    }

    const event = await env.DB.prepare('SELECT id FROM VolunteerEvent WHERE id = ?')
      .bind(eventId)
      .first();
    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const { values, errors } = normalizeSurveyPayload(body);
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join('. ') }, { status: 400 });
    }

    // Optional id minted on the device before the survey is queued. Older
    // clients do not send it and keep the previous behavior.
    const rawClientId = typeof body.clientId === 'string' ? body.clientId.trim() : '';
    const clientId = rawClientId === '' ? null : rawClientId;

    // Idempotency has to be resolved BEFORE the duplicate-phone check below.
    // Volunteers capture offline and the device retries a POST whose response
    // was lost, so the survey may already be stored under this clientId: the
    // retry must look like the success the client never saw. Checking the phone
    // first would answer 409 to that retry and the survey would sit in the
    // device queue forever.
    if (clientId) {
      const stored = await env.DB.prepare(
        'SELECT * FROM HealthSurvey WHERE volunteerEventId = ? AND clientId = ?'
      )
        .bind(eventId, clientId)
        .first();

      if (stored) {
        return NextResponse.json(stored);
      }
    }

    // Two volunteers on different iPads cannot see each other's lists, so the
    // duplicate check belongs here. The phone is not unique in the schema (a
    // household may share a line), so this warns once and the client retries
    // with allowDuplicate.
    if (body.allowDuplicate !== true) {
      const twin = await env.DB.prepare(
        'SELECT name FROM HealthSurvey WHERE volunteerEventId = ? AND phone = ?'
      )
        .bind(eventId, values.phone)
        .first<{ name: string }>();

      if (twin) {
        return NextResponse.json(
          {
            error: `Ya hay una encuesta con ese teléfono en este evento (${twin.name}).`,
            duplicate: true,
          },
          { status: 409 }
        );
      }
    }

    const now = new Date().toISOString();
    const capturedBy = request.headers.get('cf-access-authenticated-user-email');

    // Device time, sent by the offline queue. Trusted only as a timestamp: a
    // survey synced hours later must keep the moment the person was surveyed,
    // while createdAt stays the insert time for auditing.
    // The volunteer's own name, typed once per device: what identifies the
    // person when several of them share one Access account, and the only
    // attribution that cannot go stale — capturedBy records who delivered it.
    const rawInterviewer =
      typeof body.interviewerName === 'string' ? body.interviewerName.trim().slice(0, 120) : '';
    const interviewerName = rawInterviewer === '' ? null : rawInterviewer;

    const rawCapturedAt = typeof body.capturedAt === 'string' ? body.capturedAt : '';
    const parsedCapturedAt = rawCapturedAt ? new Date(rawCapturedAt) : null;
    const capturedAt =
      parsedCapturedAt && !isNaN(parsedCapturedAt.getTime()) ? parsedCapturedAt.toISOString() : now;
    const columns = [
      ...SURVEY_FIELDS,
      'volunteerEventId',
      'clientId',
      'capturedBy',
      'interviewerName',
      'capturedAt',
      'createdAt',
      'updatedAt',
    ];
    const bindings = [
      ...SURVEY_FIELDS.map((field) => values[field]),
      eventId,
      clientId,
      capturedBy,
      interviewerName,
      capturedAt,
      now,
      now,
    ];

    let result: D1Result;
    try {
      result = await env.DB.prepare(
        `INSERT INTO HealthSurvey (${columns.join(', ')})
         VALUES (${columns.map(() => '?').join(', ')})`
      )
        .bind(...bindings)
        .run();
    } catch (error) {
      // Two retries can arrive close enough that both miss the lookup above;
      // the unique index is what actually keeps the row single, so the loser of
      // that race serves the row the winner stored.
      const stored =
        clientId && error instanceof Error && /UNIQUE constraint failed/i.test(error.message)
          ? await env.DB.prepare(
              'SELECT * FROM HealthSurvey WHERE volunteerEventId = ? AND clientId = ?'
            )
              .bind(eventId, clientId)
              .first()
          : null;

      if (!stored) throw error;
      return NextResponse.json(stored);
    }

    const survey = await env.DB.prepare('SELECT * FROM HealthSurvey WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first();

    return NextResponse.json(survey, { status: 201 });
  } catch (error) {
    console.error('Error creating health survey:', error);
    return NextResponse.json({ error: 'Failed to create health survey' }, { status: 500 });
  }
}
