'use client';
import React, { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import DepartmentBadge from '@/app/components/DepartmentBadge';
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

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // Increased for better space utilization

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch('/api/announcements/latest');
        if (!response.ok) {
          throw new Error('Failed to fetch announcements');
        }
        const data = await response.json();
        setAnnouncements(data as Announcement[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  // Pagination
  const totalPages = Math.ceil(announcements.length / itemsPerPage);
  const paginatedAnnouncements = announcements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f0ff] via-[#ede9f6] to-[#f8f5ff]">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-[#4b207f] border-t-transparent"></div>
            <p className="mt-6 text-lg font-medium text-gray-600">Cargando anuncios...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
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
            <p className="text-lg font-medium text-red-600">
              Error al cargar los anuncios: {error}
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#f5f0ff] via-[#ede9f6] to-[#f8f5ff]">
      <Header />

      <div className="container mx-auto flex-1 px-4 py-12 lg:py-16">
        {/* Hero Section with Background Pattern */}
        <div className="relative mb-16">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="animate-blob absolute -right-40 -top-40 h-80 w-80 rounded-full bg-purple-200 opacity-70 mix-blend-multiply blur-xl filter"></div>
            <div className="animate-blob animation-delay-2000 absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-yellow-200 opacity-70 mix-blend-multiply blur-xl filter"></div>
            <div className="animate-blob animation-delay-4000 absolute left-40 top-40 h-80 w-80 rounded-full bg-pink-200 opacity-70 mix-blend-multiply blur-xl filter"></div>
          </div>

          <div className="relative text-center">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4b207f] to-[#6b46c1] shadow-lg">
              <svg
                className="h-10 w-10 text-white"
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
            <h1 className="mb-6 bg-gradient-to-r from-[#4b207f] to-[#6b46c1] bg-clip-text text-5xl font-bold text-transparent md:text-6xl lg:text-7xl">
              Anuncios de la Semana
            </h1>
            <p className="mx-auto max-w-3xl text-xl leading-relaxed text-gray-600">
              Mantente informado sobre las últimas noticias y eventos de nuestra iglesia
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-12 flex justify-center">
          <div className="rounded-2xl border border-white/20 bg-white/80 px-8 py-4 shadow-lg backdrop-blur-sm">
            <p className="font-medium text-gray-700">
              {announcements.length === 0
                ? 'No se encontraron anuncios'
                : `${announcements.length} anuncio${announcements.length !== 1 ? 's' : ''} disponible${announcements.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Announcements Grid */}
        {announcements.length > 0 && (
          <div className="mb-16 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            {paginatedAnnouncements.map((announcement, index) => (
              <div
                key={announcement.id}
                className="group relative transform overflow-hidden rounded-3xl border border-white/30 bg-white/95 shadow-xl backdrop-blur-sm transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards',
                }}
              >
                {/* Enhanced gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/60 via-pink-50/40 to-indigo-50/60 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>

                {/* Department background image if available */}
                {announcement.department && getDepartmentImage(announcement.department) && (
                  <div className="absolute inset-0 opacity-15 transition-opacity duration-500 group-hover:opacity-20">
                    <img
                      src={getDepartmentImage(announcement.department)}
                      alt="Department background"
                      className="h-full w-full rounded-3xl object-cover"
                    />
                    {/* Enhanced color overlay based on department */}
                    <div
                      className="absolute inset-0 rounded-3xl opacity-30"
                      style={{
                        background: `linear-gradient(135deg, ${getDepartmentColor(announcement.department)}40, ${getDepartmentColor(announcement.department)}25, ${getDepartmentColor(announcement.department)}10)`,
                      }}
                    />
                  </div>
                )}

                {/* Subtle pattern overlay */}
                <div className="opacity-8 group-hover:opacity-12 absolute inset-0 transition-opacity duration-500">
                  <div
                    className="h-full w-full"
                    style={{
                      backgroundImage: `radial-gradient(circle at 25% 25%, ${announcement.department ? getDepartmentColor(announcement.department) : '#4b207f'} 1px, transparent 1px)`,
                      backgroundSize: '20px 20px',
                    }}
                  ></div>
                </div>

                <div className="relative flex min-h-[280px] flex-col p-4 sm:min-h-[320px] sm:p-6 md:min-h-[360px] md:p-8">
                  {/* Status indicator */}
                  {!announcement.isActive && (
                    <div className="absolute right-4 top-4">
                      <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                        Inactivo
                      </span>
                    </div>
                  )}

                  {/* Department image badge - Top right corner */}
                  {announcement.department && getDepartmentImage(announcement.department) && (
                    <div className="absolute right-4 top-4 z-10">
                      <div className="h-24 w-24 overflow-hidden rounded-xl border-2 border-white/80 bg-white/95 shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                        <img
                          src={getDepartmentImage(announcement.department)}
                          alt={getDepartmentName(announcement.department)}
                          className="h-full w-full object-cover opacity-90 transition-opacity hover:opacity-100"
                        />
                        <div
                          className="absolute inset-0 opacity-30"
                          style={{ backgroundColor: getDepartmentColor(announcement.department) }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Subtle Date badge */}
                  <div className="w-fit">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gray-100/80 px-3 py-1.5 text-xs font-medium text-gray-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-3 w-3"
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
                          month: 'short',
                          year: 'numeric',
                        }
                      )}
                    </div>
                  </div>

                  {/* Enhanced Title - moved down to avoid overlap */}
                  <h3 className="mb-4 mt-16 line-clamp-2 text-2xl font-bold leading-tight text-[#4b207f] transition-colors duration-300 group-hover:text-[#6b46c1] sm:mt-20">
                    {announcement.title}
                  </h3>

                  {/* Enhanced Content */}
                  <div className="prose prose-sm mb-4 max-w-none">
                    <p className="line-clamp-5 whitespace-pre-wrap text-base leading-relaxed text-gray-700 transition-colors duration-300 group-hover:text-gray-800 sm:line-clamp-6">
                      {announcement.content}
                    </p>
                  </div>

                  {/* Department tag at the bottom */}
                  {announcement.department && (
                    <div className="mt-auto pt-4">
                      <span
                        className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium text-white shadow-sm"
                        style={{ backgroundColor: getDepartmentColor(announcement.department) }}
                      >
                        {getDepartmentName(announcement.department)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-all duration-300 hover:bg-white/80 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Anterior
              </div>
            </button>

            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-xl px-4 py-3 font-medium transition-all duration-300 ${
                    page === currentPage
                      ? 'bg-gradient-to-r from-[#4b207f] to-[#6b46c1] text-white shadow-lg'
                      : 'border border-gray-300 text-gray-700 hover:bg-white/80 hover:shadow-lg'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-all duration-300 hover:bg-white/80 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                Siguiente
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          </div>
        )}

        {/* Empty state */}
        {announcements.length === 0 && (
          <div className="py-20 text-center">
            <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-2xl font-bold text-gray-700">No hay anuncios disponibles</h3>
            <p className="text-gray-500">
              Pronto tendremos nuevas noticias para compartir contigo.
            </p>
          </div>
        )}
      </div>

      <Footer />

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
