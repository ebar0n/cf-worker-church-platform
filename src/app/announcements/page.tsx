'use client';
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Megaphone,
} from 'lucide-react';
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

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [truncatedStates, setTruncatedStates] = useState<boolean[]>([]);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // Increased for better space utilization

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch('/api/announcements/latest?all=1');
        if (!response.ok) {
          throw new Error('Failed to fetch announcements');
        }
        const data = (await response.json()) as Announcement[];
        setAnnouncements(data);
        setTruncatedStates(new Array(data.length).fill(false));
        contentRefs.current = new Array(data.length).fill(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  useEffect(() => {
    // Check if content is truncated after render
    const checkTruncation = () => {
      const newTruncatedStates = contentRefs.current.map((ref, index) => {
        if (ref) {
          const isTruncated = ref.scrollHeight > ref.clientHeight;
          return isTruncated;
        }
        return false;
      });
      setTruncatedStates(newTruncatedStates);
    };

    // Check after a short delay to ensure content is rendered
    const timeoutId = setTimeout(checkTruncation, 100);
    return () => clearTimeout(timeoutId);
  }, [announcements]);

  // Pagination
  const totalPages = Math.ceil(announcements.length / itemsPerPage);
  const paginatedAnnouncements = announcements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header current="anuncios" />

      <main className="mx-auto flex w-full max-w-[75rem] flex-1 flex-col gap-10 px-5 py-14 md:px-8 lg:gap-14 lg:py-24 xl:px-0">
        <div className="flex flex-col gap-4">
          {!error && (loading || announcements.length > 0) && (
            <p className="text-ink-soft m-0 flex items-center gap-2 text-[13px] font-semibold uppercase leading-none tracking-[.06em]">
              <span className="bg-warm h-0.5 w-6" />
              {loading
                ? 'Cargando anuncios...'
                : `${announcements.length} anuncio${announcements.length !== 1 ? 's' : ''} disponible${announcements.length !== 1 ? 's' : ''}`}
            </p>
          )}
          <h1 className="m-0 text-[40px] leading-[1.04] lg:text-[64px]">Anuncios de la Semana</h1>
          <p className="text-ink-soft m-0 max-w-2xl text-lg lg:text-xl">
            Mantente informado sobre las últimas noticias y eventos de nuestra iglesia
          </p>
        </div>

        {loading ? (
          <div aria-hidden className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="border-line flex animate-pulse flex-col gap-3.5 rounded-2xl border bg-white p-6"
              >
                <div className="h-3 w-[110px] rounded-md bg-[#efebe4]" />
                <div className="h-6 w-4/5 rounded-lg bg-[#efebe4]" />
                <div className="h-3 rounded-md bg-[#efebe4]" />
                <div className="h-3 w-3/5 rounded-md bg-[#efebe4]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="border-line flex items-center gap-3.5 rounded-xl border bg-white p-4 text-[15px] font-medium sm:max-w-xl">
            <AlertCircle className="h-[22px] w-[22px] flex-none text-[#b3261e]" strokeWidth={1.5} />
            Error al cargar los anuncios: {error}
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex items-center gap-4 rounded-2xl border border-dashed border-gray-300 p-5 sm:max-w-xl">
            <div className="bg-warm-soft flex h-11 w-11 flex-none items-center justify-center rounded-xl">
              <Megaphone className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="m-0 font-sans text-[15px] font-semibold leading-snug tracking-normal">
                No hay anuncios disponibles
              </h3>
              <p className="text-ink-soft m-0 text-sm">
                No se encontraron anuncios para mostrar en este momento.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {paginatedAnnouncements.map((announcement, index) => (
                <div
                  key={announcement.id}
                  className="border-line flex flex-col gap-5 rounded-2xl border bg-white p-6 lg:p-7"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-ink-soft m-0 flex items-center gap-2 text-sm font-medium leading-none">
                      <Calendar className="h-4 w-4" strokeWidth={1.5} />
                      {new Date(announcement.announcementDate + 'T00:00:00').toLocaleDateString(
                        'es-ES',
                        {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }
                      )}
                    </p>
                    {!announcement.isActive && (
                      <span className="text-ink-soft rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium">
                        Inactivo
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <h3 className="m-0 line-clamp-2 text-[28px] leading-[1.15]">
                      {announcement.title}
                    </h3>

                    <div
                      ref={(el) => {
                        contentRefs.current[index] = el;
                      }}
                      className="text-ink-soft line-clamp-4 text-base leading-relaxed"
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // Customize link styling and make them clickable
                          a: ({ node, href, ...props }) => (
                            <a
                              {...props}
                              href={href}
                              className="text-denim hover:text-ink cursor-pointer underline transition-colors duration-200"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (href) {
                                  window.open(href, '_blank', 'noopener,noreferrer');
                                }
                              }}
                            />
                          ),
                          // Headings stay small inside a card
                          h1: ({ node, ...props }) => (
                            <h1 {...props} className="text-ink mb-2 text-xl" />
                          ),
                          h2: ({ node, ...props }) => (
                            <h2 {...props} className="text-ink mb-2 text-lg" />
                          ),
                          h3: ({ node, ...props }) => (
                            <h3 {...props} className="text-ink mb-2 text-base" />
                          ),
                          h4: ({ node, ...props }) => (
                            <h4 {...props} className="text-ink mb-2 text-sm" />
                          ),
                          h5: ({ node, ...props }) => (
                            <h5 {...props} className="text-ink mb-2 text-xs font-bold" />
                          ),
                          h6: ({ node, ...props }) => (
                            <h6 {...props} className="text-ink mb-2 text-xs font-bold" />
                          ),
                          p: ({ node, ...props }) => <p {...props} className="mb-2" />,
                          strong: ({ node, ...props }) => (
                            <strong {...props} className="text-ink font-semibold" />
                          ),
                          em: ({ node, ...props }) => <em {...props} className="italic" />,
                          ul: ({ node, ...props }) => (
                            <ul {...props} className="mb-2 ml-4 list-disc space-y-1" />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol {...props} className="mb-2 ml-4 list-decimal space-y-1" />
                          ),
                          li: ({ node, ...props }) => <li {...props} />,
                          // react-markdown 10 has no `inline` flag: style inline code
                          // here and let <pre> reset it for blocks.
                          code: ({ node, ...props }) => (
                            <code
                              {...props}
                              className="text-ink rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs"
                            />
                          ),
                          pre: ({ node, ...props }) => (
                            <pre
                              {...props}
                              className="mb-2 overflow-x-auto rounded-lg bg-gray-100 p-3 [&>code]:p-0"
                            />
                          ),
                          blockquote: ({ node, ...props }) => (
                            <blockquote
                              {...props}
                              className="border-warm mb-2 border-l-2 pl-3 italic"
                            />
                          ),
                          table: ({ node, ...props }) => (
                            <div className="mb-2 overflow-x-auto">
                              <table
                                {...props}
                                className="border-line min-w-full border-collapse border"
                              />
                            </div>
                          ),
                          thead: ({ node, ...props }) => (
                            <thead {...props} className="bg-gray-50" />
                          ),
                          tbody: ({ node, ...props }) => <tbody {...props} />,
                          tr: ({ node, ...props }) => (
                            <tr {...props} className="border-line border-b" />
                          ),
                          th: ({ node, ...props }) => (
                            <th
                              {...props}
                              className="border-line text-ink border px-2 py-1 text-left text-xs font-semibold"
                            />
                          ),
                          td: ({ node, ...props }) => (
                            <td {...props} className="border-line border px-2 py-1 text-xs" />
                          ),
                          hr: ({ node, ...props }) => (
                            <hr {...props} className="border-line my-3" />
                          ),
                          img: (props) => <MarkdownImage {...props} size="md" />,
                        }}
                      >
                        {announcement.content}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* Read more only shows when the content is truncated */}
                  {(announcement.department || truncatedStates[index]) && (
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                      {announcement.department && (
                        <DepartmentBadge departmentCode={announcement.department} />
                      )}
                      {truncatedStates[index] && (
                        <Link
                          href={`/announcements/${announcement.id}`}
                          className="text-denim hover:text-ink ml-auto flex h-8 items-center gap-1.5 text-[15px] font-medium underline-offset-4 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          Leer más
                          <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
                  Anterior
                </Button>

                <div className="flex flex-wrap justify-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant="secondary"
                      onClick={() => setCurrentPage(page)}
                      className={`w-11 px-0 ${currentPage === page ? 'border-ink bg-warm-soft hover:bg-warm-soft border-[1.5px] font-semibold' : ''}`}
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
