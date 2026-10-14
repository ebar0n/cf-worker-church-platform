'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';
import { getDepartmentImage, getDepartmentName } from '@/lib/constants';
import { parseDateOnly } from '@/lib/age-classification';

interface Announcement {
  id: number;
  title: string;
  content: string;
  announcementDate: string;
  department?: string | null;
}

const MONTHS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sept',
  'oct',
  'nov',
  'dic',
];
const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// The first image in the markdown is the announcement's own photo; otherwise
// its department illustration stands in.
function coverImage({ content, department }: Announcement): string {
  const match = /!\[[^\]]*\]\(\s*([^)\s]+)/.exec(content);
  return match?.[1] || (department && getDepartmentImage(department)) || '/home/congregacion.jpg';
}

// Plain-text preview of the markdown body for the featured card
function excerpt(content: string): string {
  return content
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function Dated({ date, department }: { date: Date; department?: string | null }) {
  const day = `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
  return (
    <p className="text-ink-soft m-0 flex items-center gap-2 text-xs leading-none lg:text-[13px] lg:font-medium">
      <Calendar className="hidden h-3.5 w-3.5 lg:block" strokeWidth={1.5} />
      {department ? `${day} · ${getDepartmentName(department)}` : day}
    </p>
  );
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);

  useEffect(() => {
    fetch('/api/announcements/latest')
      .then((response) => (response.ok ? (response.json() as Promise<Announcement[]>) : []))
      .then((data) => setAnnouncements(data.slice(0, 3)))
      .catch(() => setAnnouncements([]));
  }, []);

  const [featured, ...rest] = announcements ?? [];
  const featuredDate = featured && parseDateOnly(featured.announcementDate.slice(0, 10));

  return (
    <section
      id="anuncios"
      aria-labelledby="anuncios-title"
      className="mx-auto flex w-full max-w-[75rem] scroll-mt-6 flex-col gap-4 px-5 pb-16 md:px-8 lg:gap-10 lg:pb-32 xl:px-0"
    >
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-3.5">
          <p className="text-ink-soft m-0 hidden items-center gap-2 text-[13px] font-semibold uppercase leading-none tracking-[.06em] lg:flex">
            <span className="bg-warm h-0.5 w-6" />
            Esta semana
          </p>
          <h2
            id="anuncios-title"
            className="font-heading m-0 text-[40px] font-bold leading-none tracking-[-0.02em] lg:text-[64px]"
          >
            Anuncios
          </h2>
        </div>
        <Link
          href="/announcements"
          className="text-denim lg:border-ink lg:text-ink flex h-8 items-center gap-1.5 text-sm font-medium no-underline lg:h-12 lg:gap-2 lg:rounded-xl lg:border lg:px-5 lg:text-[15px] lg:transition-colors lg:hover:bg-[#f0ece5]"
        >
          <span className="lg:hidden">Ver todos</span>
          <span className="hidden lg:inline">Ver todos los anuncios</span>
          <ArrowRight className="h-3.5 w-3.5 lg:h-4 lg:w-4" strokeWidth={1.5} />
        </Link>
      </div>

      {announcements === null ? (
        <div aria-hidden className="grid gap-4 lg:grid-cols-12 lg:gap-6">
          <div className="bg-line/70 h-[420px] animate-pulse rounded-[18px] lg:col-span-7 lg:h-[620px] lg:rounded-[20px]" />
          <div className="hidden flex-col gap-6 lg:col-span-5 lg:flex">
            <div className="bg-line/70 flex-1 animate-pulse rounded-[20px]" />
            <div className="bg-line/70 flex-1 animate-pulse rounded-[20px]" />
          </div>
        </div>
      ) : !featured ? (
        <p className="border-line text-ink-soft m-0 rounded-[18px] border bg-white p-8">
          No hay anuncios esta semana.{' '}
          <Link href="/announcements" className="text-denim">
            Ver anuncios anteriores
          </Link>
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
          <Link
            href={`/announcements/${featured.id}`}
            // Activating an announcement retires older ones, so often it is the
            // only one: then it takes the full row, photo beside the text.
            className={`border-line text-ink flex flex-col overflow-hidden rounded-[18px] border bg-white no-underline transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(28,27,25,.25)] lg:rounded-[20px] ${rest.length ? 'lg:col-span-7' : 'lg:col-span-12 lg:grid lg:grid-cols-[7fr_5fr]'}`}
          >
            <div
              className={`relative h-[220px] overflow-hidden ${rest.length ? 'lg:h-[400px]' : 'lg:h-full lg:min-h-[440px]'}`}
            >
              <img
                src={coverImage(featured)}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <span className="bg-paper absolute left-3.5 top-3.5 flex h-[60px] w-14 flex-col items-center justify-center rounded-xl lg:left-5 lg:top-5 lg:h-[72px] lg:w-[68px] lg:rounded-[14px]">
                <span className="text-ink-soft text-[10px] font-semibold uppercase leading-none tracking-[.06em] lg:text-[11px]">
                  {MONTHS[featuredDate.getMonth()]}
                </span>
                <span className="font-heading text-[26px] font-bold leading-none lg:text-[32px]">
                  {featuredDate.getDate()}
                </span>
              </span>
            </div>
            <div className="flex flex-col gap-2.5 p-5 lg:justify-center lg:gap-3.5 lg:p-8">
              {featured.department && (
                <span className="border-line hidden items-center gap-2 self-start rounded-full border px-3 py-1.5 text-[13px] font-medium leading-tight lg:inline-flex">
                  <span className="bg-warm h-1.5 w-1.5 rounded-full" />
                  {getDepartmentName(featured.department)}
                </span>
              )}
              <h3 className="font-heading m-0 text-[28px] font-bold leading-[1.1] lg:text-[40px] lg:leading-[1.05] lg:tracking-[-0.015em]">
                {featured.title}
              </h3>
              <p className="text-ink-soft m-0 line-clamp-3 text-[15px] leading-relaxed lg:text-[17px]">
                {excerpt(featured.content)}
              </p>
              <span className="text-denim hidden items-center gap-1.5 pt-1 text-[15px] font-medium lg:flex">
                Leer más <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </span>
            </div>
          </Link>

          {rest.length > 0 && (
            <div className="flex flex-col gap-4 lg:col-span-5 lg:gap-6">
              {rest.map((announcement) => (
                <Link
                  key={announcement.id}
                  href={`/announcements/${announcement.id}`}
                  className="border-line text-ink flex items-center gap-3.5 overflow-hidden rounded-[18px] border bg-white p-2.5 no-underline transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(28,27,25,.25)] lg:flex-1 lg:flex-col lg:items-stretch lg:gap-0 lg:rounded-[20px] lg:p-0"
                >
                  <img
                    src={coverImage(announcement)}
                    alt=""
                    loading="lazy"
                    className="h-24 w-24 flex-none rounded-xl object-cover lg:h-[200px] lg:w-full lg:rounded-none"
                  />
                  <div className="flex flex-col gap-1.5 lg:gap-2.5 lg:p-6">
                    <Dated
                      date={parseDateOnly(announcement.announcementDate.slice(0, 10))}
                      department={announcement.department}
                    />
                    <h3 className="font-heading m-0 text-[21px] font-bold leading-[1.1] lg:text-[28px]">
                      {announcement.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
