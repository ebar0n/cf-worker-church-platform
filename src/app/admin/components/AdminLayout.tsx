'use client';
import React from 'react';
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

  const isActive = (path: string) => pathname === path;

  const menuItems = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/friends', label: 'Friends' },
    { path: '/admin/members', label: 'Members' },
  ];

  return (
    <div className="min-h-screen bg-[#f7f6f3] font-sans">
      {/* Header fijo */}
      <header className="fixed left-0 top-0 z-40 flex h-20 w-full items-center justify-between bg-[#4b207f] px-8 shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-2xl font-bold tracking-tight text-white hover:text-white/90">
            Admin Dashboard
          </Link>
          {adminEmail && <span className="ml-6 text-lg text-white/80">Hola, {adminEmail}</span>}
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-white hover:bg-white/20"
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
          Salir
        </Link>
      </header>
      <div className="mx-auto flex max-w-7xl pt-20">
        {/* Menú lateral */}
        <nav className="w-56 flex-shrink-0 py-8 pr-6">
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
        <main className="flex-1 px-2 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
