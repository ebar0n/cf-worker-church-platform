'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { getDepartmentImage, getDepartmentColor, getDepartmentName } from '@/lib/constants';

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

export default function AnnouncementDetailPageClient() {
  const params = useParams();
  const router = useRouter();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        console.log('Fetching announcement with ID:', params.id);
        const response = await fetch(`/api/announcements/${params.id}`);
        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
          console.log('Error response:', errorData);

          if (response.status === 404) {
            throw new Error('Anuncio no encontrado');
          }
          throw new Error((errorData as any).error || 'Error al cargar el anuncio');
        }

        const data = await response.json();
        console.log('Announcement data received:', data);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f0ff] via-[#ede9f6] to-[#f8f5ff]">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-[#4b207f] border-t-transparent"></div>
            <p className="mt-6 text-lg font-medium text-gray-600">Cargando anuncio...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f0ff] via-[#ede9f6] to-[#f8f5ff]">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Error</h2>
            <p className="mb-8 text-lg text-gray-600">{error || 'Anuncio no encontrado'}</p>
            <button
              onClick={() => router.push('/announcements')}
              className="rounded-lg bg-[#4b207f] px-6 py-3 text-white transition-colors hover:bg-[#4b207f]/90"
            >
              Volver a los anuncios
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#f5f0ff] via-[#ede9f6] to-[#f8f5ff]">
      <Header />

      {/* Banner Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#fff8e1] via-[#f3e5f5] to-[#e8eaf6] py-16">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, #4b207f 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
            }}
          ></div>
        </div>

        <div className="container relative mx-auto px-4 text-center">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#4b207f] shadow-lg">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="mb-4 text-4xl font-bold text-[#4b207f] lg:text-5xl">
            Detalle del Anuncio
          </h1>

          {/* Subtitle */}
          <p className="mx-auto max-w-2xl text-lg text-gray-600 lg:text-xl">
            Información completa del anuncio
          </p>
        </div>
      </div>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          {/* Back Button */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-[#4b207f] transition-colors hover:text-[#e36520]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              Volver
            </button>
          </div>

          {/* Main Content */}
          <div className="mx-auto max-w-4xl">
            {/* Announcement Card */}
            <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl">
              {/* Department background image if available */}
              {announcement.department && getDepartmentImage(announcement.department) && (
                <div className="absolute inset-0 opacity-10">
                  <img
                    src={getDepartmentImage(announcement.department)}
                    alt="Department background"
                    className="h-full w-full object-cover"
                  />
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: `linear-gradient(135deg, ${getDepartmentColor(announcement.department)}40, ${getDepartmentColor(announcement.department)}25, ${getDepartmentColor(announcement.department)}10)`,
                    }}
                  />
                </div>
              )}

              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 opacity-5">
                <div
                  className="h-full w-full"
                  style={{
                    backgroundImage: `radial-gradient(circle at 25% 25%, ${announcement.department ? getDepartmentColor(announcement.department) : '#4b207f'} 1px, transparent 1px)`,
                    backgroundSize: '20px 20px',
                  }}
                ></div>
              </div>

              <div className="relative p-8 lg:p-12">
                {/* Header Section */}
                <div className="mb-8">
                  {/* Date and Department */}
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-4 w-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                        />
                      </svg>
                      {new Date(announcement.announcementDate + 'T00:00:00').toLocaleDateString(
                        'es-ES',
                        {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        }
                      )}
                    </div>

                    {announcement.department && (
                      <div className="flex items-center gap-3">
                        {getDepartmentImage(announcement.department) && (
                          <div className="h-12 w-12 overflow-hidden rounded-xl border-2 border-white/80 bg-white/95 shadow-lg">
                            <img
                              src={getDepartmentImage(announcement.department)}
                              alt={getDepartmentName(announcement.department)}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <span
                          className="rounded-full px-4 py-2 text-sm font-medium text-white shadow-lg"
                          style={{ backgroundColor: getDepartmentColor(announcement.department) }}
                        >
                          {getDepartmentName(announcement.department)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="mb-4 text-4xl font-bold text-[#4b207f] lg:text-5xl">
                    {announcement.title}
                  </h1>

                  {/* Status indicator */}
                  {!announcement.isActive && (
                    <div className="mb-6">
                      <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600">
                        Anuncio inactivo
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="prose prose-lg max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Customize link styling
                      a: ({ node, ...props }) => (
                        <a
                          {...props}
                          className="text-[#4b207f] underline transition-colors duration-200 hover:text-[#e36520]"
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      ),
                      // Customize heading styles
                      h1: ({ node, ...props }) => (
                        <h1 {...props} className="mb-4 mt-8 text-3xl font-bold text-[#4b207f]" />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2 {...props} className="mb-3 mt-6 text-2xl font-bold text-[#4b207f]" />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 {...props} className="mb-3 mt-5 text-xl font-bold text-[#4b207f]" />
                      ),
                      h4: ({ node, ...props }) => (
                        <h4 {...props} className="mb-2 mt-4 text-lg font-bold text-[#4b207f]" />
                      ),
                      h5: ({ node, ...props }) => (
                        <h5 {...props} className="mb-2 mt-4 text-base font-bold text-[#4b207f]" />
                      ),
                      h6: ({ node, ...props }) => (
                        <h6 {...props} className="mb-2 mt-4 text-sm font-bold text-[#4b207f]" />
                      ),
                      // Customize paragraph styling
                      p: ({ node, ...props }) => (
                        <p {...props} className="mb-4 text-lg leading-relaxed text-gray-700" />
                      ),
                      // Customize strong/bold styling
                      strong: ({ node, ...props }) => <strong {...props} className="font-bold" />,
                      // Customize emphasis/italic styling
                      em: ({ node, ...props }) => <em {...props} className="italic" />,
                      // Customize list styling
                      ul: ({ node, ...props }) => (
                        <ul {...props} className="mb-4 ml-6 list-disc space-y-2" />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol {...props} className="mb-4 ml-6 list-decimal space-y-2" />
                      ),
                      li: ({ node, ...props }) => <li {...props} className="text-gray-700" />,
                      // Customize code styling
                      code: ({ node, inline, ...props }: any) => {
                        if (inline) {
                          return (
                            <code
                              {...props}
                              className="rounded bg-gray-100 px-2 py-1 font-mono text-sm text-gray-800"
                            />
                          );
                        }
                        return (
                          <code
                            {...props}
                            className="block overflow-x-auto rounded bg-gray-100 p-4 font-mono text-sm text-gray-800"
                          />
                        );
                      },
                      pre: ({ node, ...props }) => (
                        <pre {...props} className="mb-4 overflow-x-auto rounded bg-gray-100 p-4" />
                      ),
                      // Customize blockquote styling
                      blockquote: ({ node, ...props }) => (
                        <blockquote
                          {...props}
                          className="mb-4 border-l-4 border-[#4b207f] bg-gray-50 pl-6 italic text-gray-700"
                        />
                      ),
                      // Customize table styling
                      table: ({ node, ...props }) => (
                        <div className="mb-4 overflow-x-auto">
                          <table
                            {...props}
                            className="min-w-full border-collapse border border-gray-300"
                          />
                        </div>
                      ),
                      thead: ({ node, ...props }) => <thead {...props} className="bg-gray-100" />,
                      tbody: ({ node, ...props }) => <tbody {...props} />,
                      tr: ({ node, ...props }) => (
                        <tr {...props} className="border-b border-gray-300" />
                      ),
                      th: ({ node, ...props }) => (
                        <th
                          {...props}
                          className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700"
                        />
                      ),
                      td: ({ node, ...props }) => (
                        <td {...props} className="border border-gray-300 px-4 py-2 text-gray-700" />
                      ),
                      // Customize horizontal rule
                      hr: ({ node, ...props }) => (
                        <hr {...props} className="my-8 border-gray-300" />
                      ),
                      // Customize image styling
                      img: ({ node, ...props }) => {
                        const [imageError, setImageError] = React.useState(false);
                        const [imageLoading, setImageLoading] = React.useState(true);

                        if (imageError) {
                          return (
                            <div className="mb-4 flex items-center justify-center rounded bg-gray-100 p-6 text-gray-500">
                              <svg
                                className="mr-2 h-6 w-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              Imagen no disponible
                            </div>
                          );
                        }

                        return (
                          <div className="relative mb-4">
                            {imageLoading && (
                              <div className="absolute inset-0 flex items-center justify-center rounded bg-gray-100">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#4b207f] border-t-transparent"></div>
                              </div>
                            )}
                            <img
                              {...props}
                              className={`max-w-full rounded shadow-lg transition-opacity duration-200 ${
                                imageLoading ? 'opacity-0' : 'opacity-100'
                              }`}
                              loading="lazy"
                              onLoad={() => setImageLoading(false)}
                              onError={() => {
                                setImageLoading(false);
                                setImageError(true);
                              }}
                              style={{ maxHeight: '500px', objectFit: 'contain' }}
                            />
                          </div>
                        );
                      },
                    }}
                  >
                    {announcement.content}
                  </ReactMarkdown>
                </div>

                {/* Footer */}
                <div className="mt-12 border-t border-gray-200 pt-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500">
                    <div>
                      <span>Publicado el: </span>
                      <span className="font-medium">
                        {new Date(announcement.createdAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {announcement.updatedAt !== announcement.createdAt && (
                      <div>
                        <span>Actualizado el: </span>
                        <span className="font-medium">
                          {new Date(announcement.updatedAt).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
