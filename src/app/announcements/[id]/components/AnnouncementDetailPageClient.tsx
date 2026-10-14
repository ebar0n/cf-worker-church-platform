'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AlertCircle, ArrowLeft, Calendar } from 'lucide-react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import DepartmentBadge from '@/app/components/DepartmentBadge';
import { MarkdownImage } from '@/app/components/MarkdownImage';
import { Button } from '@/app/components/ui/button';

interface Announcement {
  id: number;
  title: string;
  content: string;
  announcementDate: string;
  department?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const TIMESTAMP: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

export default function AnnouncementDetailPageClient() {
  const params = useParams();
  const router = useRouter();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const response = await fetch(`/api/announcements/${params.id}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));

          if (response.status === 404) {
            throw new Error('Anuncio no encontrado');
          }
          throw new Error((errorData as any).error || 'Error al cargar el anuncio');
        }

        const data = await response.json();
        if (!data || !(data as any).id) {
          throw new Error('Datos de anuncio inválidos');
        }

        setAnnouncement(data as Announcement);
      } catch (err) {
        console.error('Error in fetchAnnouncement:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchAnnouncement();
    }
  }, [params.id]);

  const date = announcement
    ? new Date(announcement.announcementDate + 'T00:00:00')
        .toLocaleDateString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
        .replace(/^./, (c) => c.toUpperCase())
    : '';

  return (
    <div className="flex min-h-screen flex-col">
      <Header current="anuncios" />

      <main className="mx-auto w-full max-w-[75rem] flex-1 px-5 pb-16 pt-6 md:px-8 lg:pb-28 lg:pt-10 xl:px-0">
        {loading ? (
          <div className="flex flex-col gap-5 pt-12 lg:w-2/3">
            <p className="sr-only">Cargando anuncio...</p>
            <div aria-hidden className="h-3.5 w-48 animate-pulse rounded-md bg-[#efebe4]" />
            <div aria-hidden className="h-12 w-4/5 animate-pulse rounded-xl bg-[#efebe4]" />
            <div aria-hidden className="h-4 animate-pulse rounded-md bg-[#efebe4]" />
            <div aria-hidden className="h-4 w-3/5 animate-pulse rounded-md bg-[#efebe4]" />
          </div>
        ) : error || !announcement ? (
          <div className="flex flex-col items-start gap-5 pt-6 lg:pt-12">
            <h2 className="m-0 text-[40px] leading-none lg:text-[56px]">Error</h2>
            <p className="border-line m-0 flex items-center gap-3.5 rounded-xl border bg-white p-4 text-[15px] font-medium">
              <AlertCircle
                className="h-[22px] w-[22px] flex-none text-[#b3261e]"
                strokeWidth={1.5}
              />
              {error || 'Anuncio no encontrado'}
            </p>
            <Button size="lg" onClick={() => router.push('/announcements')}>
              Volver a los anuncios
            </Button>
          </div>
        ) : (
          <div className="grid gap-x-6 lg:grid-cols-12">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-denim hover:text-ink flex h-8 items-center gap-2 self-start justify-self-start text-sm font-medium transition-colors lg:col-span-12 lg:text-[15px]"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
              Volver
            </button>

            <div className="flex flex-col gap-4 pt-4 lg:col-span-8 lg:gap-5 lg:pt-6">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-ink-soft m-0 flex items-center gap-2 text-[13px] font-medium leading-none lg:text-sm">
                  <Calendar className="h-3.5 w-3.5 lg:h-4 lg:w-4" strokeWidth={1.5} />
                  {date}
                </p>
                {announcement.department && (
                  <DepartmentBadge departmentCode={announcement.department} />
                )}
                {!announcement.isActive && (
                  <span className="text-ink-soft rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium">
                    Anuncio inactivo
                  </span>
                )}
              </div>
              <h1 className="m-0 text-[40px] leading-[1.05] lg:text-[64px] lg:leading-[1.04]">
                {announcement.title}
              </h1>
            </div>

            <div className="mt-8 flex min-w-0 flex-col gap-5 text-[17px] leading-[1.7] lg:col-span-7 lg:mt-12 lg:text-lg">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ node, ...props }) => (
                    <a
                      {...props}
                      className="text-denim hover:text-ink underline underline-offset-2 transition-colors duration-200"
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  ),
                  h1: ({ node, ...props }) => (
                    <h1
                      {...props}
                      className="m-0 mt-2 text-[30px] leading-[1.15] lg:mt-4 lg:text-[40px]"
                    />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2
                      {...props}
                      className="m-0 mt-2 text-[28px] leading-[1.15] lg:mt-4 lg:text-[36px]"
                    />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3
                      {...props}
                      className="m-0 mt-2 text-[26px] leading-[1.15] lg:mt-4 lg:text-[32px]"
                    />
                  ),
                  h4: ({ node, ...props }) => (
                    <h4 {...props} className="m-0 mt-2 text-[22px] leading-tight lg:text-2xl" />
                  ),
                  h5: ({ node, ...props }) => (
                    <h5 {...props} className="m-0 mt-2 text-lg font-semibold" />
                  ),
                  h6: ({ node, ...props }) => (
                    <h6 {...props} className="m-0 mt-2 text-base font-semibold" />
                  ),
                  p: ({ node, ...props }) => <p {...props} className="m-0" />,
                  strong: ({ node, ...props }) => <strong {...props} className="font-semibold" />,
                  em: ({ node, ...props }) => <em {...props} className="italic" />,
                  ul: ({ node, ...props }) => (
                    <ul {...props} className="m-0 flex list-disc flex-col gap-2 pl-[22px]" />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol {...props} className="m-0 flex list-decimal flex-col gap-2 pl-[22px]" />
                  ),
                  li: ({ node, ...props }) => <li {...props} />,
                  // react-markdown 10 has no `inline` flag: style inline code here
                  // and let <pre> reset it for blocks.
                  code: ({ node, ...props }) => (
                    <code
                      {...props}
                      className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[0.85em]"
                    />
                  ),
                  pre: ({ node, ...props }) => (
                    <pre
                      {...props}
                      className="m-0 overflow-x-auto rounded-xl bg-gray-100 p-4 text-[15px] leading-relaxed [&>code]:bg-transparent [&>code]:p-0"
                    />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      {...props}
                      className="border-warm text-ink-soft m-0 border-l-2 pl-5 italic"
                    />
                  ),
                  table: ({ node, ...props }) => (
                    <div className="border-line overflow-x-auto rounded-2xl border bg-white">
                      <table {...props} className="min-w-full border-collapse text-[15px]" />
                    </div>
                  ),
                  thead: ({ node, ...props }) => <thead {...props} className="bg-gray-50" />,
                  tbody: ({ node, ...props }) => (
                    <tbody {...props} className="divide-line divide-y" />
                  ),
                  tr: ({ node, ...props }) => <tr {...props} />,
                  th: ({ node, ...props }) => (
                    <th
                      {...props}
                      className="text-ink-soft px-4 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]"
                    />
                  ),
                  td: ({ node, ...props }) => <td {...props} className="px-4 py-3" />,
                  hr: ({ node, ...props }) => <hr {...props} className="border-line my-2 w-full" />,
                  img: (props) => <MarkdownImage {...props} size="lg" />,
                }}
              >
                {announcement.content}
              </ReactMarkdown>
            </div>

            <aside className="border-line mt-10 self-start rounded-2xl border bg-white p-5 lg:col-span-4 lg:col-start-9 lg:mt-12 lg:p-7">
              <h2 className="m-0 pb-3 text-2xl">Detalles</h2>
              <dl className="m-0 text-[15px]">
                <div className="border-line flex justify-between gap-4 border-t py-3.5">
                  <dt className="text-ink-soft whitespace-nowrap">Fecha</dt>
                  <dd className="m-0 text-right">{date}</dd>
                </div>
                <div className="border-line flex justify-between gap-4 border-t py-3.5">
                  <dt className="text-ink-soft whitespace-nowrap">Publicado el</dt>
                  <dd className="m-0 text-right">
                    {new Date(announcement.createdAt).toLocaleDateString('es-ES', TIMESTAMP)}
                  </dd>
                </div>
                {announcement.updatedAt !== announcement.createdAt && (
                  <div className="border-line flex justify-between gap-4 border-t py-3.5">
                    <dt className="text-ink-soft whitespace-nowrap">Actualizado el</dt>
                    <dd className="m-0 text-right">
                      {new Date(announcement.updatedAt).toLocaleDateString('es-ES', TIMESTAMP)}
                    </dd>
                  </div>
                )}
              </dl>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
