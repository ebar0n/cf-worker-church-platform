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
      'SELECT * FROM HealthSurvey WHERE volunteerEventId = ? ORDER BY createdAt DESC, id DESC'
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

    const now = new Date().toISOString();
    const capturedBy = request.headers.get('cf-access-authenticated-user-email');
    const columns = [...SURVEY_FIELDS, 'volunteerEventId', 'capturedBy', 'createdAt', 'updatedAt'];
    const bindings = [
      ...SURVEY_FIELDS.map((field) => values[field]),
      eventId,
      capturedBy,
      now,
      now,
    ];

    const result = await env.DB.prepare(
      `INSERT INTO HealthSurvey (${columns.join(', ')})
       VALUES (${columns.map(() => '?').join(', ')})`
    )
      .bind(...bindings)
      .run();

    const survey = await env.DB.prepare('SELECT * FROM HealthSurvey WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first();

    return NextResponse.json(survey, { status: 201 });
  } catch (error) {
    console.error('Error creating health survey:', error);
    return NextResponse.json({ error: 'Failed to create health survey' }, { status: 500 });
  }
}
