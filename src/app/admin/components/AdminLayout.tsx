'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({
  children,
  adminName,
}: {
  children: React.ReactNode;
  adminName?: string;
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
      <header className="fixed left-0 top-0 z-40 flex h-20 w-full items-center bg-[#4b207f] px-8 shadow-md">
        <div className="flex flex-1 items-center gap-4">
          <span className="text-2xl font-bold tracking-tight text-white">Admin Dashboard</span>
          {adminName && <span className="ml-6 text-lg text-white/80">Hola, {adminName}</span>}
        </div>
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
