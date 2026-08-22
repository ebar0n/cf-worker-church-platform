import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { SURVEY_FIELDS, normalizeSurveyPayload } from '@/lib/health-survey';

type RouteParams = { params: Promise<{ eventId: string; surveyId: string }> };

// Surveys are always addressed through their event so a mistyped id cannot
// reach another event's records.
async function findSurvey(eventId: number, surveyId: number) {
  const { env } = getCloudflareContext();
  return env.DB.prepare('SELECT * FROM HealthSurvey WHERE id = ? AND volunteerEventId = ?')
    .bind(surveyId, eventId)
    .first();
}

function parseIds(eventIdParam: string, surveyId: string) {
  const eventId = parseInt(eventIdParam);
  const parsedSurveyId = parseInt(surveyId);
  if (isNaN(eventId) || isNaN(parsedSurveyId)) return null;
  return { eventId, surveyId: parsedSurveyId };
}

// PUT /api/admin/surveys/[eventId]/[surveyId] - Update a survey.
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { env } = getCloudflareContext();
  const { eventId: eventIdParam, surveyId } = await params;

  try {
    const ids = parseIds(eventIdParam, surveyId);
    if (!ids) {
      return NextResponse.json({ error: 'Identificador inválido' }, { status: 400 });
    }

    const existing = await findSurvey(ids.eventId, ids.surveyId);
    if (!existing) {
      return NextResponse.json({ error: 'Encuesta no encontrada' }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const { values, errors } = normalizeSurveyPayload(body);
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join('. ') }, { status: 400 });
    }

    const now = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE HealthSurvey
       SET ${SURVEY_FIELDS.map((field) => `${field} = ?`).join(', ')}, updatedAt = ?
       WHERE id = ? AND volunteerEventId = ?`
    )
      .bind(...SURVEY_FIELDS.map((field) => values[field]), now, ids.surveyId, ids.eventId)
      .run();

    const survey = await findSurvey(ids.eventId, ids.surveyId);
    return NextResponse.json(survey);
  } catch (error) {
    console.error('Error updating health survey:', error);
    return NextResponse.json({ error: 'Failed to update health survey' }, { status: 500 });
  }
}

// DELETE /api/admin/surveys/[eventId]/[surveyId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { env } = getCloudflareContext();
  const { eventId: eventIdParam, surveyId } = await params;

  try {
    const ids = parseIds(eventIdParam, surveyId);
    if (!ids) {
      return NextResponse.json({ error: 'Identificador inválido' }, { status: 400 });
    }

    const result = await env.DB.prepare(
      'DELETE FROM HealthSurvey WHERE id = ? AND volunteerEventId = ?'
    )
      .bind(ids.surveyId, ids.eventId)
      .run();

    if (result.meta.changes === 0) {
      return NextResponse.json({ error: 'Encuesta no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting health survey:', error);
    return NextResponse.json({ error: 'Failed to delete health survey' }, { status: 500 });
  }
}
