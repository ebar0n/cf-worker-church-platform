'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import AccessLogoutButton from '@/app/admin/components/AccessLogoutButton';

export default function AdminLayout({
  children,
  adminEmail,
}: {
  children: React.ReactNode;
  adminEmail: string;
}) {
  const pathname = usePathname();

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
    <div className="bg-paper text-ink min-h-screen font-sans">
      <header className="border-line sticky top-0 z-40 border-b bg-white">
        <div className="mx-auto flex h-16 w-full max-w-[75rem] items-center justify-between gap-4 px-5 md:px-8 xl:px-0">
          <Link href="/admin" className="text-ink flex items-center gap-2.5 no-underline">
            <Image
              src="/church-logo.png"
              alt=""
              width={96}
              height={96}
              className="h-9 w-9 rounded-full object-cover"
            />
            <span className="font-heading text-2xl font-bold tracking-[-0.01em]">El Jordán</span>
            <span className="text-ink-soft rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium">
              Admin
            </span>
          </Link>
          <div className="flex min-w-0 items-center gap-3">
            {adminEmail && (
              <span className="text-ink-soft hidden truncate text-sm md:inline">{adminEmail}</span>
            )}
            <AccessLogoutButton className="border-line text-ink flex h-11 min-w-11 items-center justify-center gap-2 rounded-xl border bg-white px-3 text-sm font-medium transition-colors hover:bg-gray-100" />
          </div>
        </div>
        {/* Section tabs scroll sideways on phones instead of hiding in a menu */}
        <nav
          aria-label="Secciones"
          className="no-scrollbar mx-auto flex w-full max-w-[75rem] gap-6 overflow-x-auto px-5 md:px-8 xl:px-0"
        >
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              aria-current={isActive(item.path) ? 'page' : undefined}
              className="text-ink-soft hover:text-ink aria-[current=page]:border-warm aria-[current=page]:text-ink shrink-0 whitespace-nowrap border-b-2 border-transparent py-3 text-[15px] font-medium no-underline transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-[75rem] px-5 py-8 md:px-8 md:py-10 xl:px-0">
        {children}
      </main>
    </div>
  );
}
