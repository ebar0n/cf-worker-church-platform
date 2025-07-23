'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

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

  // Auto-rotate carousel
  useEffect(() => {
    if (announcements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % announcements.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [announcements.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % announcements.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  if (loading) {
    return (
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#4b207f] border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Cargando anuncios...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-red-600">Error al cargar los anuncios: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold text-[#4b207f]">Anuncios de la Semana</h2>
            <p className="text-gray-600">No hay anuncios para mostrar esta semana.</p>
          </div>
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
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {announcements.map((announcement) => (
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
                        <div className="h-28 w-28 overflow-hidden rounded-xl border-2 border-white/80 bg-white/95 shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl">
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

                    <div className="prose prose-lg mb-6 max-w-none">
                      <p className="md:line-clamp-8 line-clamp-6 whitespace-pre-wrap text-lg leading-relaxed text-gray-700">
                        {announcement.content}
                      </p>
                    </div>

                    {/* Department tag at the bottom */}
                    {announcement.department && (
                      <div className="mt-auto pt-6">
                        <span
                          className="inline-flex items-center rounded-full px-4 py-2 text-base font-medium text-white shadow-lg"
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
                  onClick={() => setCurrentSlide(index)}
                  className={`h-3 w-3 rounded-full transition-all duration-200 ${
                    index === currentSlide
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
