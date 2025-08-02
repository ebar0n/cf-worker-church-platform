'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DepartmentBadge from './DepartmentBadge';
import { getDepartmentImage, getDepartmentName, getDepartmentColor } from '@/lib/constants';

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

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [truncatedStates, setTruncatedStates] = useState<boolean[]>([]);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch('/api/announcements/latest');
        if (response.ok) {
          const data = (await response.json()) as Announcement[];
          setAnnouncements(data);
          setTruncatedStates(new Array(data.length).fill(false));
          contentRefs.current = new Array(data.length).fill(null);
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
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
  }, [announcements, currentIndex]);

  // Auto-rotate carousel
  useEffect(() => {
    if (announcements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [announcements.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  if (loading) {
    return (
      <div className="relative h-96 w-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#f5f0ff] via-[#ede9f6] to-[#f8f5ff]">
        <div className="flex h-full items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#4b207f] border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="relative h-96 w-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#f5f0ff] via-[#ede9f6] to-[#f8f5ff]">
        <div className="flex h-full items-center justify-center">
          <p className="text-lg text-gray-600">No hay anuncios disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[#4b207f]">Anuncios de la Semana</h2>
          <p className="text-lg text-gray-600">
            Mantente informado sobre las últimas noticias y eventos de nuestra iglesia
          </p>
          <Link
            href="/announcements"
            className="mt-4 inline-flex items-center gap-2 text-[#4b207f] transition-colors hover:text-[#e36520]"
          >
            <span>Ver todos los anuncios</span>
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
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        </div>

        {/* Carousel Container */}
        <div className="relative mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-2xl shadow-2xl">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {announcements.map((announcement, index) => (
                <div
                  key={announcement.id}
                  className="relative w-full flex-shrink-0 overflow-hidden bg-white"
                >
                  {/* Department background image if available */}
                  {announcement.department && getDepartmentImage(announcement.department) && (
                    <div className="absolute inset-0 opacity-15 transition-opacity duration-500 group-hover:opacity-25">
                      <img
                        src={getDepartmentImage(announcement.department)}
                        alt="Department background"
                        className="h-full w-full object-cover"
                      />
                      {/* Enhanced color overlay based on department */}
                      <div
                        className="absolute inset-0 opacity-30 transition-opacity duration-500 group-hover:opacity-40"
                        style={{
                          background: `linear-gradient(135deg, ${getDepartmentColor(announcement.department)}40, ${getDepartmentColor(announcement.department)}25, ${getDepartmentColor(announcement.department)}10)`,
                        }}
                      />
                    </div>
                  )}

                  {/* Subtle pattern overlay */}
                  <div className="opacity-8 absolute inset-0 transition-opacity duration-500 group-hover:opacity-15">
                    <div
                      className="h-full w-full"
                      style={{
                        backgroundImage: `radial-gradient(circle at 25% 25%, ${announcement.department ? getDepartmentColor(announcement.department) : '#4b207f'} 1px, transparent 1px)`,
                        backgroundSize: '20px 20px',
                      }}
                    ></div>
                  </div>
                  <div className="flex min-h-[400px] flex-col p-8 md:min-h-[450px] md:p-12 lg:min-h-[500px] lg:p-16">
                    {/* Department image badge - Top right corner */}
                    {announcement.department && getDepartmentImage(announcement.department) && (
                      <div className="absolute right-6 top-6 z-10">
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white shadow-lg"
                            style={{ backgroundColor: getDepartmentColor(announcement.department) }}
                          >
                            {getDepartmentName(announcement.department)}
                          </span>
                          <div className="h-28 w-28 overflow-hidden rounded-xl border-2 border-white/80 bg-white/95 shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                            <img
                              src={getDepartmentImage(announcement.department)}
                              alt={getDepartmentName(announcement.department)}
                              className="h-full w-full object-cover opacity-90 transition-opacity hover:opacity-100"
                            />
                            <div
                              className="absolute inset-0 opacity-30"
                              style={{
                                backgroundColor: getDepartmentColor(announcement.department),
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Date badge - moved to top like in other page */}
                    <div className="w-fit">
                      <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-gray-100/80 px-3 py-1.5 text-xs font-medium text-gray-600">
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

                    <div className="mb-6 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="mb-4 mt-8 text-2xl font-bold text-[#4b207f] sm:mt-10 md:text-3xl">
                          {announcement.title}
                        </h3>
                      </div>
                    </div>

                    {/* Enhanced content with react-markdown */}
                    <div className="prose prose-lg relative mb-6 max-w-none">
                      <div
                        ref={(el) => {
                          contentRefs.current[index] = el;
                        }}
                        className="md:line-clamp-8 relative line-clamp-6 text-lg leading-relaxed text-gray-700"
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            // Customize link styling and make them clickable
                            a: ({ node, href, children, ...props }) => (
                              <a
                                {...props}
                                href={href}
                                className="relative z-10 cursor-pointer text-[#4b207f] underline transition-colors duration-200 hover:text-[#e36520]"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (href) {
                                    window.open(href, '_blank', 'noopener,noreferrer');
                                  }
                                }}
                              >
                                {children}
                              </a>
                            ),
                            // Customize heading styles
                            h1: ({ node, ...props }) => (
                              <h1 {...props} className="mb-2 text-2xl font-bold text-[#4b207f]" />
                            ),
                            h2: ({ node, ...props }) => (
                              <h2 {...props} className="mb-2 text-xl font-bold text-[#4b207f]" />
                            ),
                            h3: ({ node, ...props }) => (
                              <h3 {...props} className="mb-2 text-lg font-bold text-[#4b207f]" />
                            ),
                            h4: ({ node, ...props }) => (
                              <h4 {...props} className="mb-2 text-base font-bold text-[#4b207f]" />
                            ),
                            h5: ({ node, ...props }) => (
                              <h5 {...props} className="mb-2 text-sm font-bold text-[#4b207f]" />
                            ),
                            h6: ({ node, ...props }) => (
                              <h6 {...props} className="mb-2 text-xs font-bold text-[#4b207f]" />
                            ),
                            // Customize paragraph styling
                            p: ({ node, ...props }) => <p {...props} className="mb-2" />,
                            // Customize strong/bold styling
                            strong: ({ node, ...props }) => (
                              <strong {...props} className="font-bold" />
                            ),
                            // Customize emphasis/italic styling
                            em: ({ node, ...props }) => <em {...props} className="italic" />,
                            // Customize list styling
                            ul: ({ node, ...props }) => (
                              <ul {...props} className="mb-2 ml-6 list-disc space-y-1" />
                            ),
                            ol: ({ node, ...props }) => (
                              <ol {...props} className="mb-2 ml-6 list-decimal space-y-1" />
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
                              <pre
                                {...props}
                                className="mb-2 overflow-x-auto rounded bg-gray-100 p-3"
                              />
                            ),
                            // Customize blockquote styling
                            blockquote: ({ node, ...props }) => (
                              <blockquote
                                {...props}
                                className="mb-2 border-l-4 border-[#4b207f] bg-gray-50 pl-4 italic text-gray-700"
                              />
                            ),
                            // Customize table styling
                            table: ({ node, ...props }) => (
                              <div className="mb-2 overflow-x-auto">
                                <table
                                  {...props}
                                  className="min-w-full border-collapse border border-gray-300"
                                />
                              </div>
                            ),
                            thead: ({ node, ...props }) => (
                              <thead {...props} className="bg-gray-100" />
                            ),
                            tbody: ({ node, ...props }) => <tbody {...props} />,
                            tr: ({ node, ...props }) => (
                              <tr {...props} className="border-b border-gray-300" />
                            ),
                            th: ({ node, ...props }) => (
                              <th
                                {...props}
                                className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700"
                              />
                            ),
                            td: ({ node, ...props }) => (
                              <td
                                {...props}
                                className="border border-gray-300 px-3 py-2 text-gray-700"
                              />
                            ),
                            // Customize horizontal rule
                            hr: ({ node, ...props }) => (
                              <hr {...props} className="my-4 border-gray-300" />
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
                    </div>

                    {/* Read More Button - Only show if content is truncated */}
                    {truncatedStates[index] && (
                      <div className="relative z-20 mb-6">
                        <Link
                          href={`/announcements/${announcement.id}`}
                          className="relative z-10 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#4b207f] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4b207f]/90"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.location.href = `/announcements/${announcement.id}`;
                          }}
                        >
                          <span>Leer más</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="h-4 w-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                            />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          {announcements.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute -left-6 top-1/2 -translate-y-1/2 rounded-full border border-gray-200 bg-white p-4 text-[#4b207f] shadow-xl transition-all duration-200 hover:scale-110 hover:bg-gray-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
              </button>
              <button
                onClick={nextSlide}
                className="absolute -right-6 top-1/2 -translate-y-1/2 rounded-full border border-gray-200 bg-white p-4 text-[#4b207f] shadow-xl transition-all duration-200 hover:scale-110 hover:bg-gray-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {announcements.length > 1 && (
            <div className="mt-6 flex justify-center space-x-2">
              {announcements.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-3 w-3 rounded-full transition-all duration-200 ${
                    index === currentIndex
                      ? 'scale-125 bg-[#4b207f]'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
