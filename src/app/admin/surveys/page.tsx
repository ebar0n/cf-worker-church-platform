import Link from 'next/link';
import { Calendar, ChevronRight, ClipboardList } from 'lucide-react';
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
    <div className="bg-paper min-h-screen">
      <header className="border-line flex items-center justify-between gap-4 border-b bg-white px-5 py-4 md:px-8">
        <div>
          <h1 className="text-[28px] leading-tight md:text-[32px]">Encuestas de Salud</h1>
          <p className="text-ink-soft text-sm md:text-base">
            Elija la jornada en la que va a trabajar
          </p>
        </div>
        {/* A real session close, not just a navigation: on a shared iPad the
            next volunteer must not inherit the previous one's identity. */}
        <AccessLogoutButton className="border-line text-ink flex h-11 flex-shrink-0 items-center gap-2 rounded-xl border bg-white px-3 hover:bg-gray-100 md:px-4" />
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 md:px-6 md:py-12">
        {rows.length === 0 ? (
          <div className="flex items-center gap-4 rounded-2xl border border-dashed border-gray-300 p-5">
            <div className="bg-warm-soft flex h-11 w-11 flex-none items-center justify-center rounded-xl">
              <ClipboardList className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <p className="text-[15px] font-semibold">No hay jornadas de voluntariado creadas.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/admin/surveys/${event.id}`}
                  className="border-line hover:border-ink flex items-center justify-between gap-4 rounded-2xl border bg-white p-5 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-ink text-[17px] font-medium">{event.title}</p>
                    <p className="text-ink-soft mt-1 flex items-center gap-2 text-sm font-medium">
                      <Calendar className="h-4 w-4 flex-none" strokeWidth={1.5} />
                      {new Date(event.eventDate).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        timeZone: 'UTC',
                      })}
                      {!event.isActive && ' · cerrada'}
                    </p>
                  </div>
                  <span className="text-ink flex items-center gap-1 whitespace-nowrap text-sm font-medium">
                    {event.surveys} {event.surveys === 1 ? 'encuesta' : 'encuestas'}
                    <ChevronRight className="text-ink-soft h-5 w-5" strokeWidth={1.5} />
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
