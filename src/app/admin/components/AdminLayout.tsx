'use client';
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({
  children,
  adminEmail,
}: {
  children: React.ReactNode;
  adminEmail: string;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const menuItems = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/friends', label: 'Solicitudes' },
    { path: '/admin/members', label: 'Miembros' },
    { path: '/admin/children', label: 'Niños' },
    { path: '/admin/announcements', label: 'Anuncios' },
    { path: '/admin/programs', label: 'Programas' },
    { path: '/admin/courses', label: 'Cursos' },
    { path: '/admin/volunteer-events', label: 'Voluntariado' },
  ];

  return (
    <div className="min-h-screen bg-[#f7f6f3] font-sans">
      {/* Header fijo */}
      <header className="fixed left-0 top-0 z-40 flex h-20 w-full items-center justify-between bg-[#4b207f] px-4 shadow-md md:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-white md:hidden"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
          <Link
            href="/admin"
            className="text-xl font-bold tracking-tight text-white hover:text-white/90 md:text-2xl"
          >
            Admin Dashboard
          </Link>
          {adminEmail && (
            <span className="ml-6 hidden text-lg text-white/80 md:inline">Hola, {adminEmail}</span>
          )}
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-white hover:bg-white/20 md:px-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
            />
          </svg>
          <span className="hidden md:inline">Salir</span>
        </Link>
      </header>

      <div className="mx-auto flex max-w-7xl pt-20">
        {/* Menú lateral - Desktop */}
        <nav className="hidden w-56 flex-shrink-0 py-8 pr-6 md:block">
          <ul className="flex flex-col gap-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`block rounded-xl border border-transparent px-4 py-2 text-base font-semibold transition-colors duration-200
                    ${
                      isActive(item.path)
                        ? 'border-[#4b207f] bg-[#4b207f] text-white shadow-md'
                        : 'bg-[#ede9f6] text-[#4b207f] hover:bg-[#e36520]/90 hover:text-white hover:shadow-md'
                    }
                  `}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Menú móvil */}
        <div
          className={`fixed inset-0 z-30 bg-black/50 transition-opacity md:hidden ${
            isMobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <nav
            className={`fixed left-0 top-20 h-[calc(100vh-5rem)] w-64 bg-white p-6 shadow-lg transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6">
              <span className="text-lg text-[#4b207f]">{adminEmail}</span>
            </div>
            <ul className="flex flex-col gap-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`block rounded-xl border border-transparent px-4 py-2 text-base font-semibold transition-colors duration-200
                      ${
                        isActive(item.path)
                          ? 'border-[#4b207f] bg-[#4b207f] text-white shadow-md'
                          : 'bg-[#ede9f6] text-[#4b207f] hover:bg-[#e36520]/90 hover:text-white hover:shadow-md'
                      }
                    `}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <main className="flex-1 px-2 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
