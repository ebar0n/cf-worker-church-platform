import Link from 'next/link';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import AccessLogoutButton from '@/app/admin/components/AccessLogoutButton';

interface EventRow {
  id: number;
  title: string;
  eventDate: string;
  isActive: number;
  surveys: number;
}

// Volunteer-scoped picker: the only way out of a capture screen, and the only
// list of events volunteers can reach. It lives under /admin/surveys so the
// Cloudflare Access application for that prefix covers it, keeping the events
// admin (create, edit, delete, volunteers) outside the volunteers' boundary.
// Reads D1 per request: without this Next tries to prerender the page at build
// time, where there is no database binding.
export const dynamic = 'force-dynamic';

export default async function SurveysEventPickerPage() {
  const { env } = getCloudflareContext();

  const events = await env.DB.prepare(
    `SELECT e.id, e.title, e.eventDate, e.isActive,
            (SELECT COUNT(*) FROM HealthSurvey WHERE volunteerEventId = e.id) AS surveys
     FROM VolunteerEvent e
     ORDER BY e.isActive DESC, e.eventDate DESC`
  ).all<EventRow>();

  const rows = events.results ?? [];

  return (
    <div className="min-h-screen bg-[#f7f6f3] font-sans">
      <header className="flex items-center justify-between gap-4 bg-[#4b207f] px-4 py-5 text-white shadow-md md:px-8">
        <div>
          <h1 className="font-['Advent_Pro'] text-2xl font-bold md:text-3xl">Encuestas de Salud</h1>
          <p className="text-sm text-white/80 md:text-base">
            Elija la jornada en la que va a trabajar
          </p>
        </div>
        {/* A real session close, not just a navigation: on a shared iPad the
            next volunteer must not inherit the previous one's identity. */}
        <AccessLogoutButton className="flex flex-shrink-0 items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-white hover:bg-white/20 disabled:opacity-60 md:px-4" />
      </header>

      <main className="mx-auto max-w-3xl px-3 py-6 md:px-6">
        {rows.length === 0 ? (
          <p className="rounded-md border border-dashed border-gray-300 bg-white py-10 text-center text-gray-500">
            No hay jornadas de voluntariado creadas.
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/admin/surveys/${event.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-[#4b207f]"
                >
                  <div>
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(event.eventDate).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        timeZone: 'UTC',
                      })}
                      {!event.isActive && ' · cerrada'}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-sm font-medium text-[#4b207f]">
                    {event.surveys} {event.surveys === 1 ? 'encuesta' : 'encuestas'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
